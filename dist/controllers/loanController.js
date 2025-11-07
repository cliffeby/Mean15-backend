"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLoan = exports.getMyLoans = exports.updateLoan = exports.updateLoanStatus = exports.getLoanById = exports.getLoans = exports.createLoan = void 0;
const Loan_js_1 = require("../models/Loan.js");
const Customer_js_1 = require("../models/Customer.js");
const createLoan = async (req, res, next) => {
    try {
        const { customerId, amount, termMonths, interestRate } = req.body;
        if (!customerId || !amount || !termMonths || !interestRate) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const customer = await Customer_js_1.Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        const loan = await Loan_js_1.Loan.create({
            customer: customerId,
            amount,
            termMonths,
            interestRate,
            createdBy: req.user?.id
        });
        res.status(201).json({ success: true, loan });
    }
    catch (err) {
        next(err);
    }
};
exports.createLoan = createLoan;
const getLoans = async (req, res, next) => {
    try {
        const loans = await Loan_js_1.Loan.find().populate('customer', 'name email phone').populate('createdBy', 'name email');
        res.json({ success: true, count: loans.length, loans });
    }
    catch (err) {
        next(err);
    }
};
exports.getLoans = getLoans;
const getLoanById = async (req, res, next) => {
    try {
        const loan = await Loan_js_1.Loan.findById(req.params.id)
            .populate('customer', 'name email phone')
            .populate('createdBy', 'name email');
        if (!loan) {
            return res.status(404).json({ success: false, message: 'Loan not found' });
        }
        res.json({ success: true, loan });
    }
    catch (err) {
        next(err);
    }
};
exports.getLoanById = getLoanById;
const updateLoanStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['pending', 'approved', 'declined'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const loan = await Loan_js_1.Loan.findById(req.params.id);
        if (!loan) {
            return res.status(404).json({ success: false, message: 'Loan not found' });
        }
        loan.status = status;
        await loan.save();
        res.json({ success: true, loan });
    }
    catch (err) {
        next(err);
    }
};
exports.updateLoanStatus = updateLoanStatus;
const updateLoan = async (req, res, next) => {
    try {
        const { amount, termMonths, interestRate, status } = req.body;
        const loan = await Loan_js_1.Loan.findById(req.params.id);
        if (!loan) {
            return res.status(404).json({ success: false, message: 'Loan not found' });
        }
        if (amount !== undefined)
            loan.amount = amount;
        if (termMonths !== undefined)
            loan.termMonths = termMonths;
        if (interestRate !== undefined)
            loan.interestRate = interestRate;
        if (status !== undefined && ['pending', 'approved', 'declined'].includes(status)) {
            loan.status = status;
        }
        await loan.save();
        res.json({ success: true, loan });
    }
    catch (err) {
        next(err);
    }
};
exports.updateLoan = updateLoan;
const getMyLoans = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const loans = await Loan_js_1.Loan.find({ customer: userId });
        res.json(loans);
    }
    catch (err) {
        next(err);
    }
};
exports.getMyLoans = getMyLoans;
const deleteLoan = async (req, res, next) => {
    try {
        const loan = await Loan_js_1.Loan.findById(req.params.id);
        if (!loan) {
            return res.status(404).json({ success: false, message: 'Loan not found' });
        }
        await loan.deleteOne();
        res.json({ success: true, message: 'Loan deleted successfully' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteLoan = deleteLoan;
//# sourceMappingURL=loanController.js.map