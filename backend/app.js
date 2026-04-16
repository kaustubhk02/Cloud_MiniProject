const path         = require('path');
const express      = require('express');
const cors         = require('cors');
const morgan       = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── CORS ─────────────────────────────────────────────────
const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://3.110.33.11:3000',
    process.env.CLIENT_URL,
  ].filter(Boolean)
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
  })
);

// ── Body Parser ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Logger (dev only) ────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Uploaded receipts (local disk when S3 is not configured) ──
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ───────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/reimbursements', require('./routes/reimbursements'));

// ── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running', timestamp: new Date() });
});

// ── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
