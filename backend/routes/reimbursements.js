const express = require('express');
const router = express.Router();
const {
  createReimbursement,
  getReimbursements,
  getReimbursement,
  updateReimbursement,
  deleteReimbursement,
  approveReimbursement,
  rejectReimbursement,
  getStats,
} = require('../controllers/reimbursementController');
const { protect, authorize } = require('../middleware/auth');
const { reimbursementValidation, managerActionValidation } = require('../middleware/validate');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(protect);

// Stats route
router.get('/stats', getStats);

// CRUD routes
router.route('/')
  .get(getReimbursements)
  .post(
    authorize('employee'),
    upload.single('attachment'),
    reimbursementValidation,
    createReimbursement
  );

router.route('/:id')
  .get(getReimbursement)
  .put(
    authorize('employee'),
    upload.single('attachment'),
    updateReimbursement
  )
  .delete(authorize('employee'), deleteReimbursement);

// Manager actions
router.put('/:id/approve', authorize('manager'), managerActionValidation, approveReimbursement);
router.put('/:id/reject', authorize('manager'), managerActionValidation, rejectReimbursement);

module.exports = router;
