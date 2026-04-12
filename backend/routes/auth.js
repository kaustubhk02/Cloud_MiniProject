const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { pool } = require('../config/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Generate JWT ────────────────────────────────────────
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ─── POST /api/auth/register ─────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // Check duplicate email
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Allowed roles only
    const userRole = role === 'manager' ? 'manager' : 'employee';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, userRole]
    );

    const token = generateToken(result.insertId, userRole);

    res.status(201).json({
      success: true,
      token,
      user: { id: result.insertId, name, email, role: userRole },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/managers (for employee reimbursement assignment) ─
router.get('/managers', protect, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email FROM users WHERE role = ? ORDER BY name ASC',
      ['manager']
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ────────────────────────────────────
router.get('/me', protect, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
