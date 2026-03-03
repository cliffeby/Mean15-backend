const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;

const HCapSchema = new Schema(
  {
    name: String,
    postedScore: Number,
    // currentHCap: Number,
    // newHCap: Number,
    datePlayed: Date,
    usgaIndexB4Round: Number,
    rochIndexB4Round: Number,
    usgaIndexAfterRound: Number,
    rochIndexAfterRound: Number,
    differentialForRound: Number,
    courseAdjustedDifferentialForRound: Number,
    teeAbreviation: String,
    // handicapDifferential: Number,
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
    scPar: Number,
    scRating: Number,
    scSlope: Number,
    scCourse: String,
    scTees: String,
    author: {
      id: { type: String },
      email: { type: String },
      name: { type: String }
    },
    // userId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "User",
    // },
    // String representation of the user who created/updated the HCap (populated by controller)
    // user: { type: String },
    // Backwards-compatible alias
    // username: { type: String },
    orphaned: { type: Boolean, default: false },
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
HCapSchema.index({ author: 1, datePlayed: -1 });

module.exports = mongoose.model("HCap", HCapSchema);
