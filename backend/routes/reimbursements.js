const express = require('express');
const { pool } = require('../config/db');
const { upload, removeStoredReceipt, getReceiptAccessUrl } = require('../config/s3');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

const CATEGORY_VALUES = new Set([
  'travel',
  'food',
  'accommodation',
  'training',
  'medical',
  'office_supplies',
  'other',
]); // matches DB ENUM

function managerCanAccessRow(row, managerUserId) {
  return (
    row &&
    row.assigned_manager_id != null &&
    Number(row.assigned_manager_id) === Number(managerUserId)
  );
}

function extractReceiptFromUpload(file) {
  if (!file) return { receiptUrl: null, receiptKey: null };
  if (file.location) {
    return { receiptUrl: file.location, receiptKey: file.key };
  }
  if (file.filename) {
    return { receiptUrl: `/uploads/${file.filename}`, receiptKey: file.filename };
  }
  return { receiptUrl: null, receiptKey: null };
}

async function validateManagerId(managerIdRaw) {
  const mid = parseInt(String(managerIdRaw), 10);
  if (Number.isNaN(mid) || mid < 1) return null;
  const [chk] = await pool.query('SELECT id FROM users WHERE id = ? AND role = ?', [mid, 'manager']);
  return chk.length ? mid : null;
}

async function selectOneWithJoins(id) {
  const [rows] = await pool.query(
    `
    SELECT r.*, u.name AS employee_name, u.email AS employee_email,
           m.name AS reviewer_name,
           am.name AS assigned_manager_name, am.email AS assigned_manager_email
    FROM   reimbursements r
    JOIN   users u ON r.user_id = u.id
    LEFT JOIN users m ON r.reviewed_by = m.id
    LEFT JOIN users am ON r.assigned_manager_id = am.id
    WHERE  r.id = ?
  `,
    [id]
  );
  return rows[0] || null;
}

// ─── GET /api/reimbursements ─────────────────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    const isManager = req.user.role === 'manager';
    const {
      status: qStatus,
      category: qCategory,
      search: qSearch,
      startDate,
      endDate,
      page: qPage,
      limit: qLimit,
      sort: qSort,
    } = req.query;

    const conditions = [];
    const values = [];

    if (!isManager) {
      conditions.push('r.user_id = ?');
      values.push(req.user.id);
    } else {
      conditions.push('r.assigned_manager_id = ?');
      values.push(req.user.id);
    }

    if (qStatus && qStatus !== 'all' && ['pending', 'approved', 'rejected'].includes(qStatus)) {
      conditions.push('r.status = ?');
      values.push(qStatus);
    }

    if (qCategory && qCategory !== 'all' && CATEGORY_VALUES.has(qCategory)) {
      conditions.push('r.category = ?');
      values.push(qCategory);
    }

    if (qSearch && String(qSearch).trim()) {
      const term = `%${String(qSearch).trim()}%`;
      if (isManager) {
        conditions.push('(r.description LIKE ? OR u.name LIKE ? OR u.email LIKE ?)');
        values.push(term, term, term);
      } else {
        conditions.push('r.description LIKE ?');
        values.push(term);
      }
    }

    if (startDate) {
      conditions.push('r.date >= ?');
      values.push(startDate);
    }
    if (endDate) {
      conditions.push('r.date <= ?');
      values.push(endDate);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderCol = 'r.created_at';
    let orderDir = 'DESC';
    const sort = qSort || '-createdAt';
    if (sort === 'createdAt' || sort === '-createdAt') {
      orderCol = 'r.created_at';
      orderDir = sort.startsWith('-') ? 'DESC' : 'ASC';
    } else if (sort === 'date' || sort === '-date') {
      orderCol = 'r.date';
      orderDir = sort.startsWith('-') ? 'DESC' : 'ASC';
    }
    const orderBySql = `ORDER BY ${orderCol} ${orderDir}`;

    const fromManager = `
      FROM reimbursements r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN users m ON r.reviewed_by = m.id
      LEFT JOIN users am ON r.assigned_manager_id = am.id
      ${whereSql}`;
    const fromEmployee = `
      FROM reimbursements r
      LEFT JOIN users m ON r.reviewed_by = m.id
      LEFT JOIN users am ON r.assigned_manager_id = am.id
      ${whereSql}`;

    const selectManager = `
      SELECT r.*, u.name AS employee_name, u.email AS employee_email, m.name AS reviewer_name,
             am.name AS assigned_manager_name, am.email AS assigned_manager_email`;
    const selectEmployee = `
      SELECT r.*, m.name AS reviewer_name,
             am.name AS assigned_manager_name, am.email AS assigned_manager_email`;

    const fromSql = isManager ? fromManager : fromEmployee;
    const selectSql = isManager ? selectManager : selectEmployee;

    let limitNum = null;
    if (qLimit !== undefined && qLimit !== null && String(qLimit).trim() !== '') {
      const n = parseInt(String(qLimit), 10);
      if (!Number.isNaN(n)) limitNum = Math.min(Math.max(n, 1), 200);
    }

    let rows;
    let pagination = null;

    if (limitNum != null) {
      const pageNum = Math.max(parseInt(String(qPage || '1'), 10) || 1, 1);
      const offset = (pageNum - 1) * limitNum;

      const countSql = `SELECT COUNT(*) AS total ${fromSql}`;
      const [countRows] = await pool.query(countSql, values);
      const totalNum = Number(countRows[0]?.total ?? 0);

      const dataSql = `${selectSql} ${fromSql} ${orderBySql} LIMIT ? OFFSET ?`;
      [rows] = await pool.query(dataSql, [...values, limitNum, offset]);

      pagination = {
        page: pageNum,
        pages: Math.max(1, Math.ceil(totalNum / limitNum)),
        total: totalNum,
        limit: limitNum,
      };
    } else {
      const dataSql = `${selectSql} ${fromSql} ${orderBySql}`;
      [rows] = await pool.query(dataSql, values);
    }

    res.json({
      success: true,
      count: rows.length,
      data: rows,
      pagination,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/reimbursements/stats (before /:id routes) ─
router.get('/stats', protect, async (req, res, next) => {
  try {
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    const isManager = req.user.role === 'manager';

    const [statusRows] = await pool.query(
      isManager
        ? `SELECT status, COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS totalAmount
           FROM reimbursements WHERE assigned_manager_id = ? GROUP BY status`
        : `SELECT status, COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS totalAmount
           FROM reimbursements WHERE user_id = ? GROUP BY status`,
      isManager ? [req.user.id] : [req.user.id]
    );

    const [totalsRow] = await pool.query(
      isManager
        ? `SELECT COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS totalAmount
           FROM reimbursements WHERE assigned_manager_id = ?`
        : `SELECT COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS totalAmount FROM reimbursements WHERE user_id = ?`,
      isManager ? [req.user.id] : [req.user.id]
    );

    const pending = { count: 0, totalAmount: 0 };
    const approved = { count: 0, totalAmount: 0 };
    const rejected = { count: 0, totalAmount: 0 };
    for (const row of statusRows) {
      const bucket = { count: Number(row.cnt), totalAmount: Number(row.totalAmount) };
      if (row.status === 'pending') Object.assign(pending, bucket);
      else if (row.status === 'approved') Object.assign(approved, bucket);
      else if (row.status === 'rejected') Object.assign(rejected, bucket);
    }

    const summary = {
      total: {
        count: Number(totalsRow[0].cnt),
        totalAmount: Number(totalsRow[0].totalAmount),
      },
      pending,
      approved,
      rejected,
    };

    const [catRows] = await pool.query(
      isManager
        ? `SELECT category, COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS totalAmount
           FROM reimbursements WHERE assigned_manager_id = ? AND status = 'approved' GROUP BY category`
        : `SELECT category, COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS totalAmount
           FROM reimbursements WHERE user_id = ? AND status = 'approved' GROUP BY category`,
      isManager ? [req.user.id] : [req.user.id]
    );

    const categoryBreakdown = catRows.map((r) => ({
      _id: r.category,
      count: Number(r.cnt),
      totalAmount: Number(r.totalAmount),
    }));

    res.json({ success: true, data: { summary, categoryBreakdown } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/reimbursements ────────────────────────────
router.post('/', protect, restrictTo('employee'), upload.single('receipt'), async (req, res, next) => {
  try {
    const { amount, category, description, date, assigned_manager_id } = req.body;

    if (!amount || !category || !description || !date) {
      return res.status(400).json({ success: false, message: 'Amount, category, description, and date are required.' });
    }

    const managerId = await validateManagerId(assigned_manager_id);
    if (!managerId) {
      return res.status(400).json({ success: false, message: 'Select a valid manager to review this request.' });
    }

    const { receiptUrl, receiptKey } = extractReceiptFromUpload(req.file);

    let result;
    try {
      [result] = await pool.query(
        `
        INSERT INTO reimbursements
          (user_id, assigned_manager_id, amount, category, description, date, receipt_url, receipt_key, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `,
        [req.user.id, managerId, amount, category, description, date, receiptUrl, receiptKey]
      );
    } catch (dbErr) {
      if (receiptKey || receiptUrl) {
        await removeStoredReceipt({ receipt_key: receiptKey, receipt_url: receiptUrl });
      }
      throw dbErr;
    }

    const data = await selectOneWithJoins(result.insertId);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/reimbursements/:id/receipt (before /:id) ───
router.get('/:id/receipt', protect, async (req, res, next) => {
  try {
    const row = await selectOneWithJoins(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found.' });
    }
    if (req.user.role === 'employee' && row.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (req.user.role === 'manager' && !managerCanAccessRow(row, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (!row.receipt_url && !row.receipt_key) {
      return res.status(404).json({ success: false, message: 'No receipt attached.' });
    }
    const url = await getReceiptAccessUrl({
      receipt_key: row.receipt_key,
      receipt_url: row.receipt_url,
    });
    if (!url) {
      return res.status(404).json({ success: false, message: 'Receipt unavailable.' });
    }
    res.json({ success: true, url });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/reimbursements/:id/receipt ──────────────
router.delete('/:id/receipt', protect, restrictTo('employee'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM reimbursements WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Not found or not authorized.' });
    }
    const row = rows[0];
    if (row.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be edited.' });
    }
    await pool.query(
      'UPDATE reimbursements SET receipt_url = NULL, receipt_key = NULL WHERE id = ?',
      [req.params.id]
    );
    await removeStoredReceipt({ receipt_key: row.receipt_key, receipt_url: row.receipt_url });
    const data = await selectOneWithJoins(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/reimbursements/:id/review ─────────────────
router.put('/:id/review', protect, restrictTo('manager'), async (req, res, next) => {
  try {
    const { status, manager_comments } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'approved' or 'rejected'." });
    }

    const row = await selectOneWithJoins(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found.' });
    }
    if (!managerCanAccessRow(row, req.user.id)) {
      return res.status(403).json({ success: false, message: 'You are not the assigned manager for this request.' });
    }

    await pool.query(
      `
      UPDATE reimbursements
      SET    status = ?, manager_comments = ?, reviewed_by = ?, reviewed_at = NOW()
      WHERE  id = ?
    `,
      [status, manager_comments || null, req.user.id, req.params.id]
    );

    const data = await selectOneWithJoins(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/reimbursements/:id (employee update) ───────
router.put('/:id', protect, restrictTo('employee'), upload.single('receipt'), async (req, res, next) => {
  try {
    const { amount, category, description, date, remove_receipt, assigned_manager_id } = req.body;

    const [rows] = await pool.query(
      'SELECT * FROM reimbursements WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Not found or not authorized.' });
    }
    const existing = rows[0];
    if (existing.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be updated.' });
    }

    if (!amount || !category || !description || !date) {
      return res.status(400).json({ success: false, message: 'Amount, category, description, and date are required.' });
    }

    let receiptUrl = existing.receipt_url;
    let receiptKey = existing.receipt_key;
    let assignedManagerId = existing.assigned_manager_id;
    let oldReceiptToDelete = null;
    let uploadedReceiptToRollback = null;

    if (assigned_manager_id !== undefined && assigned_manager_id !== null && String(assigned_manager_id).trim() !== '') {
      const mid = await validateManagerId(assigned_manager_id);
      if (!mid) {
        return res.status(400).json({ success: false, message: 'Select a valid manager.' });
      }
      assignedManagerId = mid;
    }

    const stripReceipt = remove_receipt === 'true' || remove_receipt === true;

    if (req.file) {
      const uploaded = extractReceiptFromUpload(req.file);
      uploadedReceiptToRollback = uploaded;
      receiptUrl = uploaded.receiptUrl;
      receiptKey = uploaded.receiptKey;
      oldReceiptToDelete = {
        receipt_key: existing.receipt_key,
        receipt_url: existing.receipt_url,
      };
    } else if (stripReceipt) {
      oldReceiptToDelete = {
        receipt_key: existing.receipt_key,
        receipt_url: existing.receipt_url,
      };
      receiptUrl = null;
      receiptKey = null;
    }

    try {
      await pool.query(
        `
        UPDATE reimbursements
        SET    amount = ?, category = ?, description = ?, date = ?,
               receipt_url = ?, receipt_key = ?, assigned_manager_id = ?
        WHERE  id = ?
      `,
        [amount, category, description, date, receiptUrl, receiptKey, assignedManagerId, req.params.id]
      );
    } catch (dbErr) {
      if (uploadedReceiptToRollback?.receiptKey || uploadedReceiptToRollback?.receiptUrl) {
        await removeStoredReceipt({
          receipt_key: uploadedReceiptToRollback.receiptKey,
          receipt_url: uploadedReceiptToRollback.receiptUrl,
        });
      }
      throw dbErr;
    }

    if (oldReceiptToDelete) {
      await removeStoredReceipt(oldReceiptToDelete);
    }

    const data = await selectOneWithJoins(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/reimbursements/:id ─────────────────────
router.delete('/:id', protect, restrictTo('employee'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM reimbursements WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Not found or not authorized.' });
    }

    if (rows[0].status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending reimbursements can be deleted.' });
    }

    await pool.query('DELETE FROM reimbursements WHERE id = ?', [req.params.id]);
    await removeStoredReceipt({ receipt_key: rows[0].receipt_key, receipt_url: rows[0].receipt_url });
    res.json({ success: true, message: 'Deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/reimbursements/:id ─────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const row = await selectOneWithJoins(req.params.id);

    if (!row) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found.' });
    }

    if (req.user.role === 'employee' && row.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (req.user.role === 'manager' && !managerCanAccessRow(row, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
