const Score = require('../models/Score');
const Member = require('../models/Member');
const mongoose = require('mongoose');

exports.getScores = async (req, res, next) => {
  try {
    const scores = await Score.find()
      .populate('matchId', 'name datePlayed status')
      .populate('memberId', 'firstName lastName Email')
      .populate('scorecardId', 'name')
      .sort({ datePlayed: -1 });
    res.json({ success: true, count: scores.length, scores });
  } catch (err) {
    next(err);
  }
};

exports.getScore = async (req, res, next) => {
  try {
    const score = await Score.findById(req.params.id);
    if (!score) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, score });
  } catch (err) {
    next(err);
  }
};

exports.createScore = async (req, res, next) => {
  try {
    // console.log('Creating score with data:', JSON.stringify(req.body, null, 2));
    
    // Ensure ObjectId fields are properly formatted
    const scoreData = { ...req.body, author: req.author };
    
    // Helper function to validate and convert ObjectId
    const convertToObjectId = (value, fieldName) => {
      if (!value) return value;
      if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
      }
      if (mongoose.Types.ObjectId.isValid(value)) {
        return value;
      }
      console.warn(`Invalid ObjectId for ${fieldName}: ${value}`);
      return value; // Let mongoose handle the validation error
    };
    
    scoreData.scorecardId = convertToObjectId(scoreData.scorecardId, 'scorecardId');
    scoreData.matchId = convertToObjectId(scoreData.matchId, 'matchId');
    scoreData.memberId = convertToObjectId(scoreData.memberId, 'memberId');
    // scoreData.user = convertToObjectId(scoreData.user, 'user');
    
    const score = await Score.create(scoreData);
    
    // Update member's lastDatePlayed if we have a memberId and datePlayed
    if (score.memberId && score.datePlayed) {
      try {
        await Member.findByIdAndUpdate(
          score.memberId,
          { lastDatePlayed: score.datePlayed },
          { new: true }
        );
      } catch (memberErr) {
        console.warn('Failed to update member lastDatePlayed:', memberErr);
        // Don't fail the score creation if member update fails
      }
    }
    
    // console.log('Created score:', JSON.stringify(score, null, 2));
    res.status(201).json({ success: true, score });
  } catch (err) {
    console.error('Error creating score:', err);
    next(err);
  }
};

exports.updateScore = async (req, res, next) => {
  try {
    // console.log('Updating score with ID:', req.params.id);
    // console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    // Ensure ObjectId fields are properly formatted
    const updateData = { ...req.body, author: req.author };
    
    // Helper function to validate and convert ObjectId
    const convertToObjectId = (value, fieldName) => {
      if (!value) return value;
      if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
      }
      if (mongoose.Types.ObjectId.isValid(value)) {
        return value;
      }
      console.warn(`Invalid ObjectId for ${fieldName}: ${value}`);
      return value; // Let mongoose handle the validation error
    };
    
    updateData.scorecardId = convertToObjectId(updateData.scorecardId, 'scorecardId');
    updateData.matchId = convertToObjectId(updateData.matchId, 'matchId');
    updateData.memberId = convertToObjectId(updateData.memberId, 'memberId');
    // updateData.user = convertToObjectId(updateData.user, 'user');
    
    const score = await Score.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!score) return res.status(404).json({ success: false, message: 'Not found' });
    
    // Update member's lastDatePlayed if we have a memberId and datePlayed
    if (score.memberId && score.datePlayed) {
      try {
        await Member.findByIdAndUpdate(
          score.memberId,
          { lastDatePlayed: score.datePlayed },
          { new: true }
        );
      } catch (memberErr) {
        console.warn('Failed to update member lastDatePlayed:', memberErr);
        // Don't fail the score update if member update fails
      }
    }
    
    // console.log('Updated score:', JSON.stringify(score, null, 2));
    res.json({ success: true, score });
  } catch (err) {
    console.error('Error updating score:', err);
    next(err);
  }
};

exports.deleteScore = async (req, res, next) => {
  try {
    // Delete the associated HCap first
    const HCap = require('../models/HCap');
    const deletedHCap = await HCap.findOneAndDelete({ scoreId: req.params.id });

    // Now delete the Score
    const score = await Score.findByIdAndDelete(req.params.id);
    if (!score) return res.status(404).json({ success: false, message: 'Not found' });

    res.json({
      success: true,
      message: 'Score deleted',
      hcapDeleted: !!deletedHCap
    });
  } catch (err) {
    next(err);
  }
};

exports.getScoresByMember = async (req, res, next) => {
  try {
    const scores = await Score.find({ memberId: req.params.memberId })
      .populate('memberId', 'firstName lastName name')
      .sort({ datePlayed: -1 });
    res.json({ success: true, count: scores.length, scores });
  } catch (err) {
    next(err);
  }
};

exports.getScoresByMatch = async (req, res, next) => {
  try {
    const scores = await Score.find({ matchId: req.params.matchId })
      .populate('matchId', 'name status')
      .populate('memberId', 'name email')
      .populate('scorecardId', 'name')
      .sort({ datePlayed: -1 });
    res.json({ success: true, count: scores.length, scores });
  } catch (err) {
    next(err);
  }
};

exports.getScoresByScorecard = async (req, res, next) => {
  try {
    const scores = await Score.find({ scorecardId: req.params.scorecardId });
    res.json({ success: true, count: scores.length, scores });
  } catch (err) {
    next(err);
  }
};

// Delete all scores for a given match
exports.deleteScoresByMatch = async (req, res, next) => {
  try {
    const matchId = req.params.matchId;
    if (!matchId) return res.status(400).json({ success: false, message: 'matchId required' });

    // Ensure matchId is a valid ObjectId where appropriate
    // Mongoose will handle invalid ids, but we can be explicit
    const result = await Score.deleteMany({ matchId });

    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    next(err);
  }
};

// Winners report: top 5 all-time and winners from past 5 rounds
exports.getWinnersReport = async (req, res, next) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const scores = await Score.find({
      orphaned: { $ne: true },
      datePlayed: { $gte: twelveMonthsAgo }
    })
      .populate('memberId', 'firstName lastName')
      .lean();

    // --- Top 5 all-time winners ---
    const winCountMap = {};
    for (const score of scores) {
      if (!score.memberId) continue;
      const memberId = score.memberId._id ? score.memberId._id.toString() : score.memberId.toString();
      const name = score.memberId.firstName
        ? `${score.memberId.firstName} ${score.memberId.lastName}`
        : memberId;
      if (!winCountMap[memberId]) {
        winCountMap[memberId] = { name, twoBall: 0, oneBall: 0, indo: 0, total: 0 };
      }
      if (score.wonTwoBall) { winCountMap[memberId].twoBall++; winCountMap[memberId].total++; }
      if (score.wonOneBall) { winCountMap[memberId].oneBall++; winCountMap[memberId].total++; }
      if (score.wonIndo)    { winCountMap[memberId].indo++;    winCountMap[memberId].total++; }
    }
    const topFive = Object.values(winCountMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // --- Past 5 rounds winners ---
    const matchMap = {};
    for (const score of scores) {
      if (!score.matchId) continue;
      const matchId = score.matchId.toString();
      if (!matchMap[matchId]) {
        matchMap[matchId] = { matchId, datePlayed: score.datePlayed, winners: { twoBall: [], oneBall: [], indo: [] } };
      }
      if (!matchMap[matchId].datePlayed && score.datePlayed) {
        matchMap[matchId].datePlayed = score.datePlayed;
      }
    }

    const recentMatches = Object.values(matchMap)
      .filter(m => m.datePlayed)
      .sort((a, b) => new Date(b.datePlayed) - new Date(a.datePlayed))
      .slice(0, 5);

    for (const match of recentMatches) {
      const matchScores = scores.filter(s => s.matchId && s.matchId.toString() === match.matchId);
      const getName = s => s.memberId && s.memberId.firstName
        ? `${s.memberId.firstName} ${s.memberId.lastName}`
        : (s.memberId ? s.memberId.toString() : '');
      match.winners.twoBall = matchScores.filter(s => s.wonTwoBall && s.memberId).map(getName);
      match.winners.oneBall = matchScores.filter(s => s.wonOneBall && s.memberId).map(getName);
      match.winners.indo    = matchScores.filter(s => s.wonIndo    && s.memberId).map(getName);
    }

    res.json({ success: true, topFive, recentRounds: recentMatches });
  } catch (err) {
    next(err);
  }
};