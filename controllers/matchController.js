const Match = require('../models/Match');

// @desc    Get all matches
// @route   GET /api/matches
// @access  Private
exports.getMatches = async (req, res, next) => {
  try {
    const matches = await Match.find().populate('scorecardId', 'name slope rating');
    res.json({ success: true, count: matches.length, matches });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single match by ID
// @route   GET /api/matches/:id
// @access  Private
exports.getMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id).populate('scorecardId', 'name slope rating');
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    res.json({ success: true, match });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new match
// @route   POST /api/matches
// @access  Private
exports.createMatch = async (req, res, next) => {
  try {
    const matchData = {
      ...req.body,
      user: req.user.id
    };
    
    const match = await Match.create(matchData);
    res.status(201).json({ success: true, match });
  } catch (err) {
    next(err);
  }
};

// @desc    Update match
// @route   PUT /api/matches/:id
// @access  Private
exports.updateMatch = async (req, res, next) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, req.body, { 
      new: true,
      runValidators: true
    }).populate('scorecardId', 'name slope rating');
    
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    
    res.json({ success: true, match });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete match
// @route   DELETE /api/matches/:id
// @access  Private (Admin only)
exports.deleteMatch = async (req, res, next) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    res.json({ success: true, message: 'Match deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get matches by user
// @route   GET /api/matches/user/:userId
// @access  Private
exports.getMatchesByUser = async (req, res, next) => {
  try {
    const matches = await Match.find({ user: req.params.userId })
      .populate('scorecardId', 'name slope rating')
      .sort({ datePlayed: -1 });
    res.json({ success: true, count: matches.length, matches });
  } catch (err) {
    next(err);
  }
};

// @desc    Get matches by status
// @route   GET /api/matches/status/:status
// @access  Private
exports.getMatchesByStatus = async (req, res, next) => {
  try {
    const matches = await Match.find({ status: req.params.status })
      .populate('scorecardId', 'name slope rating')
      .sort({ datePlayed: -1 });
    res.json({ success: true, count: matches.length, matches });
  } catch (err) {
    next(err);
  }
};

// @desc    Update match status
// @route   PATCH /api/matches/:id/status
// @access  Private
exports.updateMatchStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const match = await Match.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true, runValidators: true }
    ).populate('scorecardId', 'name slope rating');
    
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    
    res.json({ success: true, match });
  } catch (err) {
    next(err);
  }
};