const mongoose = require('mongoose');
const { Schema } = mongoose;

const ScoreSchema = new Schema(
  {
    name: String,
    score: Number,
    postedScore: Number,
    scores: [Number],
    scoresToPost: [Number],
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
    usgaIndexForTodaysScore: {
      type: Number,
      min: [-10, 'USGA Index for today cannot be less than -10.0'],
      max: [54, 'USGA Index for today cannot be greater than 54.0'],
      validate: {
        validator: function(v) {
          // Allow null/undefined values
          if (v == null) return true;
          // Ensure the value has at most 1 decimal place
          return Number.isInteger(v * 10);
        },
        message: 'USGA Index for today must have at most one decimal place'
      }
    },
    handicap: Number,
    wonTwoBall: { type: Boolean, default: false },
    wonOneBall: { type: Boolean, default: false },
    wonIndo: { type: Boolean, default: false },
    isPaired: { type: Boolean, default: false },
    isScored: { type: Boolean, default: false },
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
    },
    scorecardId: {
      type: Schema.Types.ObjectId,
      ref: 'Scorecard',
    },
    scSlope: Number,
    scRating: Number,
    scPars: [Number],
    scHCaps: [Number],
    scName: String,
    datePlayed: Date,
    foursomeIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Member',
      },
    ],
    partnerIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Member',
      },
    ],
    user: {
    type: Schema.Types.ObjectId,
        ref: 'User',
    },
  },
  {
    collection: 'scores',
    timestamps: true,
  }
);

// Add useful indexes for queries
ScoreSchema.index({ memberId: 1, datePlayed: -1 });
ScoreSchema.index({ matchId: 1 });
ScoreSchema.index({ scorecardId: 1, datePlayed: -1 });
ScoreSchema.index({ user: 1, datePlayed: -1 });

module.exports = mongoose.model('Score', ScoreSchema);