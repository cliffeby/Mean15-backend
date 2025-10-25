const Scorecard = require('../models/Scorecard');

exports.getScorecards = async (req, res, next) => {
  try {
    const scorecards = await Scorecard.find();
    res.json({ success: true, count: scorecards.length, scorecards });
  } catch (err) {
    next(err);
  }
};

exports.getScorecard = async (req, res, next) => {
  try {
    const scorecard = await Scorecard.findById(req.params.id);
    if (!scorecard) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, scorecard });
  } catch (err) {
    next(err);
  }
};

exports.createScorecard = async (req, res, next) => {
  try {
    const scorecard = await Scorecard.create(req.body);
    res.status(201).json({ success: true, scorecard });
  } catch (err) {
    next(err);
  }
};

exports.updateScorecard = async (req, res, next) => {
  try {
    const scorecard = await Scorecard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!scorecard) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, scorecard });
  } catch (err) {
    next(err);
  }
};

exports.deleteScorecard = async (req, res, next) => {
  try {
    const scorecard = await Scorecard.findByIdAndDelete(req.params.id);
    if (!scorecard) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
