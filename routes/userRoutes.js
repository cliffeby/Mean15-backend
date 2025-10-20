// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser } = require('../controllers/userController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// GET /api/users - list all users (admin only)
router.get('/', auth, admin, getAllUsers);

// DELETE /api/users/:id - delete user by id (admin only)
router.delete('/:id', auth, admin, deleteUser);

module.exports = router;
