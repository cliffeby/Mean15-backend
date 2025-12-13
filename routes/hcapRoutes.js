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
const admin = require('../middleware/admin');

// Auth is now handled globally in app.js via jwtCheck middleware

router.get('/', getHcaps);
router.get('/member/:memberId', getHcapsByMember);
router.get('/match/:matchId', getHcapsByMatch);
router.get('/scorecard/:scorecardId', getHcapsByScorecard);
router.get('/:id', getHcap);
router.post('/', admin, createHcap);
router.put('/:id', admin, updateHcap);
router.delete('/:id', admin, deleteHcap);

module.exports = router;
