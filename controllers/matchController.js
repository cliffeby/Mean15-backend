const Match = require('../models/Match');
const Score = require('../models/Score');

// @desc    Get all matches
// @route   GET /api/matches
// @access  Private
exports.getMatches = async (req, res, next) => {
  try {
    const matches = await Match.find().populate('scorecardId', 'name slope rating');
    
    // Debug: Check which matches have scorecards
    console.log('=== MATCH SCORECARD DEBUG ===');
    matches.forEach((match, index) => {
      console.log(`Match ${index + 1}: ${match.name}`);
      console.log(`  - ID: ${match._id}`);
      console.log(`  - ScorecardId: ${match.scorecardId}`);
      console.log(`  - Has Scorecard: ${!!match.scorecardId}`);
      console.log(`  - Scorecard Type: ${typeof match.scorecardId}`);
      console.log('---');
    });
    console.log('=== END DEBUG ===');
    
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
    console.log('=== GET MATCH DEBUG ===');
    console.log('Requested match ID:', req.params.id);
    console.log('ID type:', typeof req.params.id);
    console.log('ID length:', req.params.id?.length);
    
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
    
    console.log('Populated match scorecardId:', match.scorecardId);
    console.log('Populated match scorecardId type:', typeof match.scorecardId);
    console.log('Is scorecardId populated object?', match.scorecardId && typeof match.scorecardId === 'object');
    console.log('Sending response with match');
    console.log('=== END GET MATCH DEBUG ===');
    
    res.json({ success: true, match });
  } catch (err) {
    console.error('Error fetching match:', err);
    console.error('Error details:', err.message);
    console.error('Stack:', err.stack);
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
    const matchId = req.params.id;
    
    // Check for associated scores
    const associatedScores = await Score.find({ matchId: matchId });
    
    if (associatedScores.length > 0) {
      // Check if force delete was requested - handle undefined req.body
      const { force, action } = req.body || {};
      
      if (!force) {
        return res.status(409).json({ 
          success: false, 
          message: 'Cannot delete match with associated scores',
          conflictType: 'scores',
          conflictCount: associatedScores.length,
          scores: associatedScores.map(score => ({
            id: score._id,
            name: score.name,
            datePlayed: score.datePlayed,
            score: score.score
          })),
          options: {
            nullify: 'Remove match reference from scores (scores remain)',
            delete: 'Delete match and all associated scores',
            cancel: 'Cancel deletion'
          }
        });
      }
      
      // Handle forced deletion with specified action
      if (action === 'nullify') {
        // Set matchId to null for all associated scores
        await Score.updateMany({ matchId: matchId }, { matchId: null });
        console.log(`Nullified matchId for ${associatedScores.length} scores`);
      } else if (action === 'delete') {
        // Delete all associated scores
        await Score.deleteMany({ matchId: matchId });
        console.log(`Deleted ${associatedScores.length} associated scores`);
      } else if (action) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use "nullify" or "delete"'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Action required when force=true. Use "nullify" or "delete"'
        });
      }
    }

    // Now delete the match
    const match = await Match.findByIdAndDelete(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Match deleted successfully',
      scoresAffected: associatedScores.length,
      action: associatedScores.length > 0 ? (req.body.action || 'none') : 'none'
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

// @desc    Update match scorecard
// @route   PATCH /api/matches/:id/scorecard
// @access  Private (Admin)
exports.updateMatchScorecard = async (req, res, next) => {
  try {
    const { scorecardId } = req.body;
    console.log(`Updating match ${req.params.id} with scorecardId: ${scorecardId}`);
    
    const match = await Match.findByIdAndUpdate(
      req.params.id, 
      { scorecardId }, 
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