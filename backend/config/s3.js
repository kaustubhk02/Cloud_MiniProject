const fs = require('fs');
const path = require('path');
const { S3Client, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const multerS3 = require('multer-s3');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed'), false);
  }
};

const limits = { fileSize: 5 * 1024 * 1024 };

const bucket = (process.env.S3_BUCKET_NAME || '').trim();
const region = (process.env.AWS_REGION || '').trim();

/** Set USE_LOCAL_UPLOADS=true to keep files on disk even if bucket/region are set (local dev). */
const useLocalUploads = process.env.USE_LOCAL_UPLOADS === 'true';

const accessKey = (process.env.AWS_ACCESS_KEY_ID || '').trim();
const secretKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();
const hasStaticCredentials =
  Boolean(accessKey && secretKey) && !accessKey.startsWith('your_');

/**
 * S3 uploads when bucket + region are set and local uploads are not forced.
 * On EC2: attach an IAM role with s3:PutObject (and s3:PutObjectAcl if you use ACLs) on the bucket/prefix.
 * Leave AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY unset so the SDK uses the instance profile.
 */
const useS3 = !useLocalUploads && Boolean(bucket && region);

function buildS3Client() {
  const config = { region };
  if (hasStaticCredentials) {
    config.credentials = {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    };
  }
  return new S3Client(config);
}

let s3 = null;
let upload;

if (useS3) {
  s3 = buildS3Client();

  const storageOptions = {
    s3,
    bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const uniqueName = `receipts/${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  };

  const acl = (process.env.S3_OBJECT_ACL || '').trim();
  if (acl) {
    storageOptions.acl = acl;
  }

  upload = multer({
    storage: multerS3(storageOptions),
    limits,
    fileFilter,
  });

  const authMode = hasStaticCredentials ? 'static access keys' : 'default credential chain (e.g. EC2 IAM role)';
  console.log(`[uploads] S3 storage: bucket=${bucket} region=${region} (${authMode})`);
} else {
  upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadsDir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
      },
    }),
    limits,
    fileFilter,
  });
  console.log(
    '[uploads] Local disk storage (set S3_BUCKET_NAME + AWS_REGION for S3; USE_LOCAL_UPLOADS=true keeps disk)'
  );
}

async function removeStoredReceipt({ receipt_key, receipt_url }) {
  if (!receipt_key && !receipt_url) return;
  if (useS3 && s3 && receipt_key) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: receipt_key }));
    } catch (err) {
      console.error('[uploads] S3 DeleteObject failed:', err.message);
    }
    return;
  }
  const raw = receipt_key || (typeof receipt_url === 'string' ? receipt_url.replace(/^\/?uploads\/?/i, '') : '');
  const name = path.basename(raw);
  if (!name || name === '.' || name === '..') return;
  const abs = path.join(uploadsDir, name);
  fs.unlink(abs, (err) => {
    if (err && err.code !== 'ENOENT') console.error('[uploads] local delete failed:', err.message);
  });
}

/** Browser-openable URL: presigned for private S3; path or absolute for disk. */
async function getReceiptAccessUrl({ receipt_key, receipt_url }) {
  if (!receipt_url && !receipt_key) return null;
  if (useS3 && s3 && receipt_key) {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: receipt_key });
    return getSignedUrl(s3, cmd, { expiresIn: 300 });
  }
  if (typeof receipt_url === 'string' && /^https?:\/\//i.test(receipt_url)) {
    return receipt_url;
  }
  const rel = (typeof receipt_url === 'string' && receipt_url.startsWith('/'))
    ? receipt_url
    : `/uploads/${receipt_key || path.basename(receipt_url || '')}`;
  const origin = (process.env.API_PUBLIC_ORIGIN || '').trim().replace(/\/$/, '');
  if (origin) return `${origin}${rel}`;
  return rel;
}

module.exports = { s3, upload, useS3, bucket, removeStoredReceipt, getReceiptAccessUrl };
