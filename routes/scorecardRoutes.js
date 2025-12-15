const express = require('express');
const router = express.Router();
const { getScorecards, getScorecard, createScorecard, updateScorecard, deleteScorecard } = require('../controllers/scorecardController');
const { requireMinRole } = require('../middleware/roleHierarchy');
const { extractAuthor } = require('../middleware/authorExtractor');

// Auth is now handled globally in app.js via jwtCheck middleware

router.get('/', getScorecards);           // Get all scorecards
router.get('/:id', getScorecard);         // Get single scorecard
router.post('/', requireMinRole('admin'), extractAuthor, createScorecard); // Create new scorecard (admin only)
router.put('/:id', requireMinRole('admin'), extractAuthor, updateScorecard); // Update scorecard (admin only)
router.delete('/:id', requireMinRole('admin'), deleteScorecard); // Delete scorecard (admin only)

module.exports = router;
