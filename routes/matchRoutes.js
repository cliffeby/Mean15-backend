const express = require('express');
const router = express.Router();
const { 
  getMatches, 
  getMatch, 
  createMatch, 
  updateMatch, 
  deleteMatch,
  getMatchesByUser,
  getMatchesByStatus,
  updateMatchStatus,
  updateMatchScorecard
} = require('../controllers/matchController');
const admin = require('../middleware/admin');

// Auth is now handled globally in app.js via jwtCheck middleware

// CRUD routes
router.get('/', getMatches);                    // Get all matches
router.get('/:id', getMatch);                   // Get single match
router.post('/', createMatch);                  // Create new match
router.put('/:id', updateMatch);                // Update match
router.delete('/:id', admin, deleteMatch);      // Delete match (admin only)

// Additional routes
router.get('/user/:userId', getMatchesByUser);           // Get matches by user
router.get('/status/:status', getMatchesByStatus);       // Get matches by status
router.patch('/:id/status', updateMatchStatus);          // Update match status
router.patch('/:id/scorecard', admin, updateMatchScorecard); // Update match scorecard (admin only)

module.exports = router;