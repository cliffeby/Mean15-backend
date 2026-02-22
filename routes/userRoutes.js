// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, getUser, updateUserLeague, updateUserRole, inviteUser } = require('../controllers/userController');
const { requireMinRole } = require('../middleware/roleHierarchy');

// Auth is now handled globally in app.js via jwtCheck middleware
// All user routes require admin access

// POST /api/users/invite - send Entra guest invitation (admin only)
router.post('/invite', requireMinRole('admin'), inviteUser);

// GET /api/users - list all users (admin only)
router.get('/', requireMinRole('admin'), getAllUsers);

// GET /api/users/:id - get user by id (admin only)
router.get('/:id', requireMinRole('admin'), getUser);

// PATCH /api/users/:id/league - update user's defaultLeague (admin only)
router.patch('/:id/league', requireMinRole('admin'), updateUserLeague);

// PATCH /api/users/:id/role - update user's role (admin/developer only)
router.patch('/:id/role', requireMinRole('admin'), updateUserRole);

// DELETE /api/users/:id - delete user by id (admin only)
router.delete('/:id', requireMinRole('admin'), deleteUser);

module.exports = router;
