const Reimbursement = require('../models/Reimbursement');
const path = require('path');

/**
 * @desc    Create new reimbursement request
 * @route   POST /api/reimbursements
 * @access  Private (Employee)
 */
const createReimbursement = async (req, res, next) => {
  try {
    const { amount, category, description, date } = req.body;

    const reimbursementData = {
      userId: req.user._id,
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date),
    };

    // Handle file attachment
    if (req.file) {
      reimbursementData.attachment = `/uploads/${req.file.filename}`;
    }

    const reimbursement = await Reimbursement.create(reimbursementData);
    await reimbursement.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Reimbursement request submitted successfully',
      data: reimbursement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reimbursements
 *          - Employee: only their own
 *          - Manager: all requests
 * @route   GET /api/reimbursements
 * @access  Private
 */
const getReimbursements = async (req, res, next) => {
  try {
    const { status, category, startDate, endDate, search, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    // Build query
    const query = {};

    // Role-based filter
    if (req.user.role === 'employee') {
      query.userId = req.user._id;
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const total = await Reimbursement.countDocuments(query);
    let reimbursements = await Reimbursement.find(query)
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Search in description (post-filter for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      reimbursements = reimbursements.filter(
        (r) =>
          r.description.toLowerCase().includes(searchLower) ||
          r.category.toLowerCase().includes(searchLower) ||
          (r.userId?.name && r.userId.name.toLowerCase().includes(searchLower))
      );
    }

    res.status(200).json({
      success: true,
      data: reimbursements,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single reimbursement
 * @route   GET /api/reimbursements/:id
 * @access  Private
 */
const getReimbursement = async (req, res, next) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email');

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    // Employees can only view their own
    if (req.user.role === 'employee' && reimbursement.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this request' });
    }

    res.status(200).json({ success: true, data: reimbursement });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update reimbursement (only if pending)
 * @route   PUT /api/reimbursements/:id
 * @access  Private (Employee - own pending only)
 */
const updateReimbursement = async (req, res, next) => {
  try {
    let reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    // Only owner can edit
    if (reimbursement.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this request' });
    }

    // Only pending requests can be edited
    if (reimbursement.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be edited' });
    }

    const { amount, category, description, date } = req.body;
    const updateData = {};
    if (amount) updateData.amount = parseFloat(amount);
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (date) updateData.date = new Date(date);
    if (req.file) updateData.attachment = `/uploads/${req.file.filename}`;

    reimbursement = await Reimbursement.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('userId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Reimbursement updated successfully',
      data: reimbursement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete reimbursement (only if pending)
 * @route   DELETE /api/reimbursements/:id
 * @access  Private (Employee - own pending only)
 */
const deleteReimbursement = async (req, res, next) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    // Only owner can delete
    if (reimbursement.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this request' });
    }

    // Only pending requests can be deleted
    if (reimbursement.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be deleted' });
    }

    await reimbursement.deleteOne();

    res.status(200).json({ success: true, message: 'Reimbursement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve reimbursement
 * @route   PUT /api/reimbursements/:id/approve
 * @access  Private (Manager only)
 */
const approveReimbursement = async (req, res, next) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    if (reimbursement.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be approved' });
    }

    const updated = await Reimbursement.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        managerComments: req.body.managerComments || '',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate('userId', 'name email').populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Reimbursement approved successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject reimbursement
 * @route   PUT /api/reimbursements/:id/reject
 * @access  Private (Manager only)
 */
const rejectReimbursement = async (req, res, next) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    if (reimbursement.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be rejected' });
    }

    const updated = await Reimbursement.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        managerComments: req.body.managerComments || '',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate('userId', 'name email').populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Reimbursement rejected',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard stats
 * @route   GET /api/reimbursements/stats
 * @access  Private
 */
const getStats = async (req, res, next) => {
  try {
    const matchQuery = req.user.role === 'employee' ? { userId: req.user._id } : {};

    const stats = await Reimbursement.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const result = {
      pending: { count: 0, totalAmount: 0 },
      approved: { count: 0, totalAmount: 0 },
      rejected: { count: 0, totalAmount: 0 },
      total: { count: 0, totalAmount: 0 },
    };

    stats.forEach((stat) => {
      result[stat._id] = { count: stat.count, totalAmount: stat.totalAmount };
      result.total.count += stat.count;
      result.total.totalAmount += stat.totalAmount;
    });

    // Category breakdown
    const categoryStats = await Reimbursement.aggregate([
      { $match: { ...matchQuery, status: 'approved' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: { summary: result, categoryBreakdown: categoryStats },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReimbursement,
  getReimbursements,
  getReimbursement,
  updateReimbursement,
  deleteReimbursement,
  approveReimbursement,
  rejectReimbursement,
  getStats,
};
