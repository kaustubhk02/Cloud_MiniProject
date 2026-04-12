// const { body, validationResult } = require('express-validator');

// /**
//  * Handle validation errors
//  */
// const validate = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({
//       success: false,
//       message: 'Validation failed',
//       errors: errors.array().map((err) => ({ field: err.path, message: err.msg })),
//     });
//   }
//   next();
// };

// /**
//  * Register validation rules
//  */
// const registerValidation = [
//   body('name')
//     .trim()
//     .notEmpty().withMessage('Name is required')
//     .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2-50 characters'),

//   body('email')
//     .trim()
//     .notEmpty().withMessage('Email is required')
//     .isEmail().withMessage('Invalid email format')
//     .normalizeEmail(),

//   body('password')
//     .notEmpty().withMessage('Password is required')
//     .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

//   body('role')
//     .optional()
//     .isIn(['employee', 'manager']).withMessage('Role must be employee or manager'),

//   validate,
// ];

// /**
//  * Login validation rules
//  */
// const loginValidation = [
//   body('email')
//     .trim()
//     .notEmpty().withMessage('Email is required')
//     .isEmail().withMessage('Invalid email format')
//     .normalizeEmail(),

//   body('password')
//     .notEmpty().withMessage('Password is required'),

//   validate,
// ];

// /**
//  * Reimbursement validation rules
//  */
// const reimbursementValidation = [
//   body('amount')
//     .notEmpty().withMessage('Amount is required')
//     .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),

//   body('category')
//     .notEmpty().withMessage('Category is required')
//     .isIn(['travel', 'food', 'medical', 'accommodation', 'office_supplies', 'training', 'other'])
//     .withMessage('Invalid category'),

//   body('description')
//     .trim()
//     .notEmpty().withMessage('Description is required')
//     .isLength({ min: 10, max: 500 }).withMessage('Description must be between 10-500 characters'),

//   body('date')
//     .notEmpty().withMessage('Date is required')
//     .isISO8601().withMessage('Invalid date format'),

//   validate,
// ];

// /**
//  * Manager action validation rules
//  */
// const managerActionValidation = [
//   body('managerComments')
//     .optional()
//     .trim()
//     .isLength({ max: 500 }).withMessage('Comments cannot exceed 500 characters'),

//   validate,
// ];

// module.exports = {
//   registerValidation,
//   loginValidation,
//   reimbursementValidation,
//   managerActionValidation,
// };
