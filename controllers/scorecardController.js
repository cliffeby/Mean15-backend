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
    if (!scorecard) return res.status(404).json({ success: false, message: 'Scorecard not found' });
    res.json({ success: true, scorecard });
  } catch (err) {
    next(err);
  }
};

exports.createScorecard = async (req, res, next) => {
  try {
    const scorecard = await Scorecard.create({ ...req.body, author: req.author });
    res.status(201).json({ success: true, scorecard });
  } catch (err) {
    next(err);
  }
};

exports.updateScorecard = async (req, res, next) => {
  try {
    const scorecard = await Scorecard.findByIdAndUpdate(req.params.id, { ...req.body, author: req.author }, { new: true });
    if (!scorecard) return res.status(404).json({ success: false, message: 'Scorecard not found' });
    res.json({ success: true, scorecard });
  } catch (err) {
    next(err);
  }
};

exports.deleteScorecard = async (req, res, next) => {
  try {
    // const { name, author } = req.query;
    // Optionally: log, audit, or validate name/author here
    // Example: console.log('Deleting scorecard', req.params.id, name, author);
    const scorecard = await Scorecard.findByIdAndDelete(req.params.id);
    if (!scorecard) return res.status(404).json({ success: false, message: 'Scorecard not found' });
    // Optionally: audit log
    // if (name || author) { /* audit logic here */ }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
