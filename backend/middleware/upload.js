// const { S3Client }  = require('@aws-sdk/client-s3');
// const multer         = require('multer');
// const multerS3       = require('multer-s3');
// const path           = require('path');

// // ── S3 Client ────────────────────────────────────────────
// // Uses env vars (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
// // On EC2 with IAM Role attached, credentials are picked up automatically
// const s3 = new S3Client({
//   region: process.env.AWS_REGION || 'ap-south-1',
//   ...(process.env.AWS_ACCESS_KEY_ID && {
//     credentials: {
//       accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
//       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     },
//   }),
// });

// // ── Allowed File Types ───────────────────────────────────
// const allowedMimeTypes = [
//   'image/jpeg',
//   'image/jpg',
//   'image/png',
//   'image/gif',
//   'application/pdf',
//   'application/msword',
//   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
// ];

// const allowedExtensions = /jpeg|jpg|png|gif|pdf|doc|docx/;

// const fileFilter = (req, file, cb) => {
//   const extOk  = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
//   const mimeOk = allowedMimeTypes.includes(file.mimetype);

//   if (extOk && mimeOk) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only images (JPEG, PNG, GIF) and documents (PDF, DOC, DOCX) are allowed'));
//   }
// };

// // ── Multer-S3 Storage ────────────────────────────────────
// const storage = multerS3({
//   s3,
//   bucket: process.env.S3_BUCKET_NAME,
//   contentType: multerS3.AUTO_CONTENT_TYPE,
//   key: (req, file, cb) => {
//     // Unique filename: receipts/timestamp-random.ext
//     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     const ext          = path.extname(file.originalname).toLowerCase();
//     cb(null, `receipts/attachment-${uniqueSuffix}${ext}`);
//   },
// });

// // ── Export upload middleware ─────────────────────────────
// const upload = multer({
//   storage,
//   limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB
//   fileFilter,
// });

// module.exports = upload;