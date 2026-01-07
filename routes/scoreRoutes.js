const express = require('express');
const router = express.Router();
const { 
  getScores, 
  getScore, 
  createScore, 
  updateScore, 
  deleteScore,
  getScoresByMember,
  getScoresByMatch,
  deleteScoresByMatch,
  getScoresByScorecard
} = require('../controllers/scoreController');
const { requireMinRole } = require('../middleware/roleHierarchy');
const { extractAuthor } = require('../middleware/authorExtractor');

// Auth is now handled globally in app.js via jwtCheck middleware

// CRUD routes
router.get('/', getScores);           // Get all scores
router.get('/member/:memberId', getScoresByMember); // Get scores by member
router.get('/match/:matchId', getScoresByMatch);   // Get scores by match
router.get('/scorecard/:scorecardId', getScoresByScorecard); // Get scores by scorecard
router.get('/:id', getScore);         // Get single score
router.post('/', requireMinRole('admin'), extractAuthor, createScore); // Create new score (editor or admin)
router.put('/:id', requireMinRole('admin'), extractAuthor, updateScore); // Update score (editor or admin)
// Delete all scores for a match (admin only) - must come before the :id route
router.delete('/match/:matchId', requireMinRole('admin'), extractAuthor, deleteScoresByMatch);

// Delete single score by id (admin only)
router.delete('/:id', requireMinRole('admin'), extractAuthor,  deleteScore); // Delete score (admin only)

module.exports = router;
