const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true },
  termMonths: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Loan', loanSchema);
