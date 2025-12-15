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
  getScoresByScorecard
} = require('../controllers/scoreController');
const { requireMinRole } = require('../middleware/roleHierarchy');

// Auth is now handled globally in app.js via jwtCheck middleware

// CRUD routes
router.get('/', getScores);           // Get all scores
router.get('/member/:memberId', getScoresByMember); // Get scores by member
router.get('/match/:matchId', getScoresByMatch);   // Get scores by match
router.get('/scorecard/:scorecardId', getScoresByScorecard); // Get scores by scorecard
router.get('/:id', getScore);         // Get single score
router.post('/', requireMinRole('admin'), createScore); // Create new score (editor or admin)
router.put('/:id', requireMinRole('admin'), updateScore); // Update score (editor or admin)
router.delete('/:id', requireMinRole('admin'), deleteScore); // Delete score (admin only)

module.exports = router;