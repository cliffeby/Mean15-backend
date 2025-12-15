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
const { requireMinRole } = require('../middleware/roleHierarchy');
const { extractAuthor } = require('../middleware/authorExtractor');

// Auth is now handled globally in app.js via jwtCheck middleware

// CRUD routes
router.get('/', getMatches);                    // Get all matches
router.get('/:id', getMatch);                   // Get single match
router.post('/', requireMinRole('admin'), extractAuthor,createMatch);                  // Create new match (admin only)
router.put('/:id', requireMinRole('admin'), extractAuthor,updateMatch);                // Update match (editor or admin)
router.delete('/:id', requireMinRole('admin'), extractAuthor, deleteMatch);      // Delete match (admin only)

// Additional routes
router.get('/user/:userId', getMatchesByUser);           // Get matches by user
router.get('/status/:status', getMatchesByStatus);       // Get matches by status
router.patch('/:id/status', requireMinRole('admin'), extractAuthor, updateMatchStatus);          // Update match status
router.patch('/:id/scorecard', requireMinRole('admin') ,extractAuthor, updateMatchScorecard); // Update match scorecard (admin only)

module.exports = router;