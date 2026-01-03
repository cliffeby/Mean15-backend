// controllers/userController.js
const User = require('../models/User');

const logger = require('../utils/logger');

exports.getAllUsers = async (req, res, next) => {
  try {
    logger.info(`GET /api/users requested by: ${JSON.stringify(req.user)}`);
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

// Get a single user by ID
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// Update user's defaultLeague
exports.updateUserLeague = async (req, res, next) => {
  try {
    const { defaultLeague } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { defaultLeague },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
