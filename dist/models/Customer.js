"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customer = void 0;
const mongoose_1 = require("mongoose");
const customerSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, lowercase: true, required: true },
    phone: String,
    dob: Date,
    ssnLast4: String,
    address: String
}, { timestamps: true });
exports.Customer = mongoose_1.default.model('Customer', customerSchema);
//# sourceMappingURL=Customer.js.map