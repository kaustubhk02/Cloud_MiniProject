const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reimbursements', require('./routes/reimbursements'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
