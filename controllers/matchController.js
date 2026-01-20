const Match = require('../models/Match');
const Score = require('../models/Score');

// @desc    Get all matches
// @route   GET /api/matches
// @access  Private
exports.getMatches = async (_req, res, next) => {
  try {
    const matches = await Match.find().populate('scorecardId', 'name slope rating');
    
    // Debug: Check which matches have scorecards
    // console.log('=== MATCH SCORECARD DEBUG ===');
    // matches.forEach((match, index) => {
    //   console.log(`Match ${index + 1}: ${match.name}`);
    //   console.log(`  - ID: ${match._id}`);
    //   console.log(`  - ScorecardId: ${match.scorecardId}`);
    //   console.log(`  - Has Scorecard: ${!!match.scorecardId}`);
    //   console.log(`  - Scorecard Type: ${typeof match.scorecardId}`);
    //   console.log('---');
    // });
    // console.log('=== END DEBUG ===');
    
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
    // console.log('=== GET MATCH DEBUG ===');
    // console.log('Requested match ID:', req.params.id);
    // console.log('ID type:', typeof req.params.id);
    // console.log('ID length:', req.params.id?.length);
    
    // First get the raw match without population to see what's actually stored
    const rawMatch = await Match.findById(req.params.id);
    console.log('Raw match found:', !!rawMatch);
    if (rawMatch) {
      console.log('Raw match from DB:', JSON.stringify(rawMatch, null, 2));
      console.log('Raw match scorecardId:', rawMatch?.scorecardId);
      console.log('Raw match scorecardId exists:', !!rawMatch?.scorecardId);
    }
    
    // Then get populated version
    const match = await Match.findById(req.params.id).populate('scorecardId', 'name slope rating pars hCaps par');
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    
    // console.log('Populated match scorecardId:', match.scorecardId);
    // console.log('Populated match scorecardId type:', typeof match.scorecardId);
    // console.log('Is scorecardId populated object?', match.scorecardId && typeof match.scorecardId === 'object');
    // console.log('Sending response with match');
    // console.log('=== END GET MATCH DEBUG ===');
    
    res.json({ success: true, match });
  } catch (err) {
    // console.error('Error fetching match:', err);
    // console.error('Error details:', err.message);
    // console.error('Stack:', err.stack);
    next(err);
  }
};

// @desc    Create new match
// @route   POST /api/matches
// @access  Private
exports.createMatch = async (req, res, next) => {
  try {
    const matchData = {
      ...req.body, author: req.author
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
    const match = await Match.findByIdAndUpdate(req.params.id, { ...req.body, author: req.author }, { 
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
    const matchId = req.params.id;
    
    // Delete all Scores associated with this Match
    const deletedScores = await Score.deleteMany({ matchId });
    // Delete all HCaps associated with this Match
    const HCap = require('../models/HCap');
    const deletedHCaps = await HCap.deleteMany({ matchId });

    // Now delete the match
    const match = await Match.findByIdAndDelete(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    res.json({
      success: true,
      message: 'Match deleted successfully',
      scoresDeleted: deletedScores.deletedCount,
      hcapsDeleted: deletedHCaps.deletedCount
    });
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
    console.log(`Updating match : ${JSON.stringify(req.body)}`);
    const { status, name, author } = req.body;
    const updateData = { status, author: req.author };
    
    // Include name if provided in request for audit logging
    if (name) {
      updateData.name = name;
    }
    
    const match = await Match.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('scorecardId', 'name slope rating author');
    console.log(`Updating match2 : ${JSON.stringify(req.body)}`);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    
    res.json({ success: true, match });
  } catch (err) {
    next(err);
  }
};

// @desc    Update match scorecard
// @route   PATCH /api/matches/:id/scorecard
// @access  Private (Admin)
exports.updateMatchScorecard = async (req, res, next) => {
  try {
    const { scorecardId } = req.body;
    console.log(`Updating match ${req.params.id} with scorecardId: ${scorecardId}`);
    
    const match = await Match.findByIdAndUpdate(
      req.params.id, 
      { scorecardId, author: req.author }, 
      { new: true }
    ).populate('scorecardId', 'name slope rating');
    
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    
    console.log('Updated match:', match);
    res.json({ success: true, match });
  } catch (err) {
    console.error('Error updating match scorecard:', err);
    next(err);
  }
};