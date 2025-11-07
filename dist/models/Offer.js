"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Offer = void 0;
const mongoose_1 = require("mongoose");
const offerSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    interestRate: { type: Number, required: true, min: 0 },
    validTill: { type: Date, required: true }
}, { timestamps: true });
exports.Offer = mongoose_1.default.model('Offer', offerSchema);
//# sourceMappingURL=Offer.js.map