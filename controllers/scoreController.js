const Score = require('../models/Score');

exports.getScores = async (req, res, next) => {
  try {
    const scores = await Score.find();
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
    const score = await Score.create(req.body);
    res.status(201).json({ success: true, score });
  } catch (err) {
    next(err);
  }
};

exports.updateScore = async (req, res, next) => {
  try {
    const score = await Score.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!score) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, score });
  } catch (err) {
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