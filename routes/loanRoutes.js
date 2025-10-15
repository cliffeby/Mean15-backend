// routes/loanRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createLoan,
  getLoans,
  getLoanById,
  updateLoanStatus,
  deleteLoan,
  updateLoan
} = require('../controllers/loanController');

// All routes protected with auth middleware
router.use(auth);

// CRUD routes
router.post('/', createLoan);             // Create new loan
router.get('/', getLoans);                // Get all loans
router.get('/:id', getLoanById);          // Get single loan
router.patch('/:id/status', updateLoanStatus); // Update loan status
router.delete('/:id', deleteLoan);        // Delete loan (admin only)
router.put('/:id', updateLoan);           // Update a Loan
module.exports = router;
