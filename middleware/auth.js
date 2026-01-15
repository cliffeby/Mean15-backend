const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Allow a small clock tolerance to account for minor server/client time skew (in seconds)
const DEFAULT_CLOCK_TOLERANCE = parseInt(process.env.JWT_CLOCK_TOLERANCE || '300', 10);

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    // Verify token with configurable clock tolerance
    const verifyOptions = { clockTolerance: DEFAULT_CLOCK_TOLERANCE };
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, verifyOptions);
    } catch (err) {
      if (err && err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token: user not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

module.exports = auth;
