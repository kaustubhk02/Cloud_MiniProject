const mongoose = require('mongoose');

const reimbursementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      max: [1000000, 'Amount cannot exceed 1,000,000'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['travel', 'food', 'medical', 'accommodation', 'office_supplies', 'training', 'other'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    managerComments: {
      type: String,
      trim: true,
      maxlength: [500, 'Comments cannot exceed 500 characters'],
      default: '',
    },
    attachment: {
      type: String, // File URL/path
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
reimbursementSchema.index({ userId: 1, status: 1 });
reimbursementSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model('Reimbursement', reimbursementSchema);
