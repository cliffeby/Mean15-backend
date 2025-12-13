// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, getUser, updateUserLeague } = require('../controllers/userController');
const admin = require('../middleware/admin');

// Auth is now handled globally in app.js via jwtCheck middleware
// All user routes require admin access

// GET /api/users - list all users (admin only)
router.get('/', admin, getAllUsers);

// GET /api/users/:id - get user by id (admin only)
router.get('/:id', admin, getUser);

// PATCH /api/users/:id/league - update user's defaultLeague (admin only)
router.patch('/:id/league', admin, updateUserLeague);

// DELETE /api/users/:id - delete user by id (admin only)
router.delete('/:id', admin, deleteUser);

module.exports = router;
