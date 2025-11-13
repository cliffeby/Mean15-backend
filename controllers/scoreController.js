const Score = require('../models/Score');
const mongoose = require('mongoose');

exports.getScores = async (req, res, next) => {
  try {
    const scores = await Score.find()
      .populate('matchId', 'name datePlayed status')
      .populate('memberId', 'name email')
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
    console.log('Creating score with data:', JSON.stringify(req.body, null, 2));
    
    // Ensure ObjectId fields are properly formatted
    const scoreData = { ...req.body };
    
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
    scoreData.user = convertToObjectId(scoreData.user, 'user');
    
    const score = await Score.create(scoreData);
    
    console.log('Created score:', JSON.stringify(score, null, 2));
    res.status(201).json({ success: true, score });
  } catch (err) {
    console.error('Error creating score:', err);
    next(err);
  }
};

exports.updateScore = async (req, res, next) => {
  try {
    console.log('Updating score with ID:', req.params.id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    // Ensure ObjectId fields are properly formatted
    const updateData = { ...req.body };
    
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
    updateData.user = convertToObjectId(updateData.user, 'user');
    
    const score = await Score.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!score) return res.status(404).json({ success: false, message: 'Not found' });
    
    console.log('Updated score:', JSON.stringify(score, null, 2));
    res.json({ success: true, score });
  } catch (err) {
    console.error('Error updating score:', err);
    next(err);
  }
};

exports.deleteScore = async (req, res, next) => {
  try {
    const score = await Score.findByIdAndDelete(req.params.id);
    if (!score) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Score deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getScoresByMember = async (req, res, next) => {
  try {
    const scores = await Score.find({ memberId: req.params.memberId });
    res.json({ success: true, count: scores.length, scores });
  } catch (err) {
    next(err);
  }
};

exports.getScoresByMatch = async (req, res, next) => {
  try {
    const scores = await Score.find({ matchId: req.params.matchId })
      .populate('matchId', 'name datePlayed status')
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