const express = require('express');
const router = express.Router();
const { register, login, getMe, provision, changePassword } = require('../controllers/authController');
const auth = require('../middleware/auth');
const jwtCheck = require('../middleware/jwtCheck');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);

// Force-change password — requires a valid local JWT (auth middleware)
router.put('/change-password', auth, changePassword);

// JIT provisioning — called by frontend after each Entra login.
// jwtCheck is applied here directly because /api/auth is mounted before the
// global jwtCheck in app.js.
router.post('/provision', jwtCheck, provision);

module.exports = router;
