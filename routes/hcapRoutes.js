const express = require('express');
const router = express.Router();
const {
  getHcaps,
  getHcap,
  createHcap,
  updateHcap,
  deleteHcap,
  getHcapsByMember,
  getHcapsByMatch,
  getHcapsByScorecard
} = require('../controllers/hcapController');
const { requireMinRole } = require('../middleware/roleHierarchy');
const { extractAuthor } = require('../middleware/authorExtractor');

// Auth is now handled globally in app.js via jwtCheck middleware

router.get('/', getHcaps);
router.get('/member/:memberId', getHcapsByMember);
router.get('/match/:matchId', getHcapsByMatch);
router.get('/scorecard/:scorecardId', getHcapsByScorecard);
router.get('/:id', getHcap);
router.post('/', requireMinRole('admin'), extractAuthor, createHcap);
router.put('/:id', requireMinRole('admin'),extractAuthor, updateHcap);
router.delete('/:id', requireMinRole('admin'), deleteHcap);
module.exports = router;
