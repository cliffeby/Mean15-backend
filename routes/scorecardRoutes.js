const express = require('express');
const router = express.Router();
const { getScorecards, getScorecard, createScorecard, updateScorecard, deleteScorecard } = require('../controllers/scorecardController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.use(auth);

router.get('/', getScorecards);           // Get all scorecards
router.get('/:id', getScorecard);         // Get single scorecard
router.post('/', admin, createScorecard); // Create new scorecard (admin only)
router.put('/:id', admin, updateScorecard); // Update scorecard (admin only)
router.delete('/:id', admin, deleteScorecard); // Delete scorecard (admin only)

module.exports = router;
