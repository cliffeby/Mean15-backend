const express = require('express');
const router = express.Router();
const { getScores, getScore, createScore, updateScore, deleteScore } = require('../controllers/scoreController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// All routes protected with auth middleware
router.use(auth);

// CRUD routes
router.get('/', getScores);           // Get all scores
router.get('/:id', getScore);         // Get single score
router.post('/', admin, createScore); // Create new score (admin only)
router.put('/:id', admin, updateScore); // Update score (admin only)
router.delete('/:id', admin, deleteScore); // Delete score (admin only)

module.exports = router;