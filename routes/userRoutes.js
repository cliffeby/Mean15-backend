// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, getUser, updateUserLeague } = require('../controllers/userController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// GET /api/users - list all users (admin only)
router.get('/', auth, admin, getAllUsers);

// GET /api/users/:id - get user by id (admin only)
router.get('/:id', auth, admin, getUser);

// PATCH /api/users/:id/league - update user's defaultLeague (admin only)
router.patch('/:id/league', auth, admin, updateUserLeague);

// DELETE /api/users/:id - delete user by id (admin only)
router.delete('/:id', auth, admin, deleteUser);

module.exports = router;
