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
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// All routes protected with auth middleware
router.use(auth);

// CRUD routes
router.get('/', getScores);           // Get all scores
router.get('/member/:memberId', getScoresByMember); // Get scores by member
router.get('/match/:matchId', getScoresByMatch);   // Get scores by match
router.get('/scorecard/:scorecardId', getScoresByScorecard); // Get scores by scorecard
router.get('/:id', getScore);         // Get single score
router.post('/', admin, createScore); // Create new score (admin only)
router.put('/:id', admin, updateScore); // Update score (admin only)
router.delete('/:id', admin, deleteScore); // Delete score (admin only)

module.exports = router;