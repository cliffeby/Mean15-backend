"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scorecard = void 0;
const mongoose_1 = require("mongoose");
const ScorecardSchema = new mongoose_1.Schema({
    groupName: { type: String },
    name: { type: String },
    rating: { type: Number },
    slope: { type: Number },
    parInputString: String,
    pars: [Number],
    par: { type: Number },
    hCapInputString: String,
    hCaps: [Number],
    yardsInputString: String,
    yards: [Number],
    scorecardsId: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Scorecard' }],
    scorecardId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Scorecard' },
    user: { type: String }
}, {
    collection: 'scorecards',
    timestamps: true
});
ScorecardSchema.virtual('courseTeeName').get(function () {
    return `${this.groupName} ${this.name}`;
});
ScorecardSchema.set('toJSON', { virtuals: true });
exports.Scorecard = mongoose_1.default.model('Scorecard', ScorecardSchema);
//# sourceMappingURL=Scorecard.js.map