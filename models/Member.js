const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  usgaIndex: { 
    type: Number,
    min: [-10, 'USGA Index cannot be less than -10.0'],
    max: [54, 'USGA Index cannot be greater than 54.0'],
    validate: {
      validator: function(v) {
        // Allow null/undefined values
        if (v == null) return true;
        // Ensure the value has at most 1 decimal place
        return Number.isInteger(v * 10);
      },
      message: 'USGA Index must have at most one decimal place'
    }
  },
  handicap: { type: Number },
  lastDatePlayed: { type: String },
  scorecardsId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scorecard' }],
  Email: { type: String },
  // Embedded author object for audit
  author: {
    id: { type: String },
    email: { type: String },
    name: { type: String }
  },
  GHIN: { type: String },
  CellPhone: { type: String },
  defaultTees: { type: String },
  Street: { type: String },
  City: { type: String },
  State: { type: String },
  Zip: { type: String },
  Spouse: { type: String },
  DateJoined: { type: Number },
  hidden: { type: Boolean, default: false }
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

  memberSchema.virtual('name')
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
