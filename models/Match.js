const mongoose = require('mongoose');
const { Schema } = mongoose;

const MatchSchema = new Schema(
  {
    name: {
      type: Schema.Types.String,
      default: 'Please fill Match name',
      required: true,
      trim: true,
    },
    scorecardId: {
      type: Schema.Types.ObjectId,
      ref: 'Scorecard',
    },
    scGroupName: {
      type: Schema.Types.String,
    },
    players: Number,
    status: { type: Schema.Types.String, default: 'open' },
    lineUps: [{
      type: Schema.Types.ObjectId,
      ref: 'Member',
    }],
    foursomeIdsTEMP: [[
      {
        type: Schema.Types.ObjectId,
        ref: 'Member',
      },
       {
        type: Schema.Types.ObjectId,
        ref: 'Member',
      },
       {
        type: Schema.Types.ObjectId,
        ref: 'Member',
      },
       {
        type: Schema.Types.ObjectId,
        ref: 'Member',
      }
    ]],
    partnerIdsTEMP: [[
      {
        type: Schema.Types.ObjectId,
        ref: 'Member',
      },
      {
        type: Schema.Types.ObjectId,
        ref: 'Member',
      }
    ]],
    datePlayed: Date,
    user: {
      type: Schema.Types.String,
      required: false,
      unique: false,
    },
  },
  {
    collection: 'matches',
    timestamps: true,
  }
);

// Add useful indexes
MatchSchema.index({ user: 1, datePlayed: -1 });
MatchSchema.index({ scorecardId: 1, datePlayed: -1 });
MatchSchema.index({ status: 1 });

module.exports = mongoose.model('Match', MatchSchema);