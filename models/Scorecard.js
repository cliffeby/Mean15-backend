const mongoose = require('mongoose');

const ScorecardSchema = new mongoose.Schema({
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
  scorecardsId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scorecard' }],
  scorecardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scorecard' },
  user: { type: String }
}, {
  collection: 'scorecards',
  timestamps: true
});

ScorecardSchema.virtual('courseTeeName').get(function () {
  return `${this.groupName} ${this.name}`;
});

ScorecardSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Scorecard', ScorecardSchema);
