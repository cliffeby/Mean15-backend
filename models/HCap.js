const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;

const HCapSchema = new Schema(
  {
    name: String,
    postedScore: Number,
    currentHCap: Number,
    newHCap: Number,
    datePlayed: Date,
    usgaIndexForTodaysScore: {
      type: Number,
      min: [-10, "USGA Index for today cannot be less than -10.0"],
      max: [54, "USGA Index for today cannot be greater than 54.0"],
      validate: {
        validator: function (v) {
          // Allow null/undefined values
          if (v == null) return true;
          // Ensure the value has at most 1 decimal place
          return Number.isInteger(v * 10);
        },
        message: "USGA Index for today must have at most one decimal place",
      },
    },
    handicapDifferential: Number,
    scoreId: {
      type: Schema.Types.ObjectId,
      ref: "Score",
    },
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
    },
    scorecardId: {
      type: Schema.Types.ObjectId,
      ref: "Scorecard",
    },
    author: {
      id: { type: String },
      email: { type: String },
      name: { type: String }
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // String representation of the user who created/updated the HCap (populated by controller)
    user: { type: String },
    // Backwards-compatible alias
    username: { type: String },
  },
  {
    // collection: 'scores',
    timestamps: true,
  }
);

// Add useful indexes for queries
HCapSchema.index({ memberId: 1, datePlayed: -1 });
HCapSchema.index({ matchId: 1 });
HCapSchema.index({ scorecardId: 1, datePlayed: -1 });
HCapSchema.index({ user: 1, datePlayed: -1 });

module.exports = mongoose.model("HCap", HCapSchema);
