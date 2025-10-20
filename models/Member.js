const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  usgaIndex: { type: Number },
  lastDatePlayed: { type: String },
  scorecardsId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scorecard' }],
  email: { type: String },
  user: { type: String }
}, {
  collection: 'members',
  timestamps: true
});

memberSchema.virtual('id').get(function () {
  return this._id;
});

memberSchema.virtual('fullName')
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function (v) {
    const firstName = v.substring(0, v.indexOf(' '));
    const lastName = v.substring(v.indexOf(' ') + 1);
    this.set({ firstName, lastName });
  });

memberSchema.virtual('fullNameR')
  .get(function () {
    return `${this.lastName}, ${this.firstName}`;
  })
  .set(function (v) {
    const lastName = v.substring(0, v.indexOf(' '));
    const firstName = v.substring(v.indexOf(' ') + 1);
    this.set({ lastName, firstName });
  });

memberSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Member', memberSchema);
