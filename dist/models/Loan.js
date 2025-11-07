"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loan = void 0;
const mongoose_1 = require("mongoose");
const loanSchema = new mongoose_1.Schema({
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true },
    termMonths: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
exports.Loan = mongoose_1.default.model('Loan', loanSchema);
//# sourceMappingURL=Loan.js.map