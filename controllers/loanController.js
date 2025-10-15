// controllers/loanController.js
const Loan = require('../models/Loan');
const Customer = require('../models/Customer');

// @desc    Create a new loan
// @route   POST /api/loans
// @access  Private
exports.createLoan = async (req, res, next) => {
  try {
    const { customerId, amount, termMonths, interestRate } = req.body;

    // Validate required fields
    if (!customerId || !amount || !termMonths || !interestRate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const loan = await Loan.create({
      customer: customerId,
      amount,
      termMonths,
      interestRate,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, loan });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all loans
// @route   GET /api/loans
// @access  Private
exports.getLoans = async (req, res, next) => {
  try {
    const loans = await Loan.find().populate('customer', 'name email phone').populate('createdBy', 'name email');
    res.json({ success: true, count: loans.length, loans });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single loan by ID
// @route   GET /api/loans/:id
// @access  Private
exports.getLoanById = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name email');

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    res.json({ success: true, loan });
  } catch (err) {
    next(err);
  }
};

// @desc    Update loan status
// @route   PATCH /api/loans/:id/status
// @access  Private (admin)
exports.updateLoanStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    loan.status = status;
    await loan.save();

    res.json({ success: true, loan });
  } catch (err) {
    next(err);
  }
};

exports.updateLoan = async (req, res, next) => {
  try {
    const { amount, termMonths, interestRate, status } = req.body;

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    // Update fields if provided
    if (amount !== undefined) loan.amount = amount;
    if (termMonths !== undefined) loan.termMonths = termMonths;
    if (interestRate !== undefined) loan.interestRate = interestRate;
    if (status !== undefined && ['pending','approved','declined'].includes(status)) {
      loan.status = status;
    }

    await loan.save();
    res.json({ success: true, loan });
  } catch (err) {
    next(err);
  }
};

exports.getMyLoans = async (req, res, next) => {
  try {
    const userId = req.user.id; // extracted from JWT middleware
    const loans = await Loan.find({ customer: userId });
    res.json(loans);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a loan
// @route   DELETE /api/loans/:id
// @access  Private (admin)
exports.deleteLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    await loan.deleteOne();
    res.json({ success: true, message: 'Loan deleted successfully' });
  } catch (err) {
    next(err);
  }
};
