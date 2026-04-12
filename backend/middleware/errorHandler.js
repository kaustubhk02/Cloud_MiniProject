const errorHandler = (err, req, res, next) => {
console.error('ERROR:', err.message);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Max size is 5MB.' });
  }

  // Multer file type error
  if (err.message && err.message.includes('Only JPEG')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;