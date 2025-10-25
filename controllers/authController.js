const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
console.log('Auth Controller loaded', signToken);
exports.register = async (req, res, next) => {
  console.log('Register request payload:', req.body);
  try {
  const { name, email, password, role } = req.body;
  
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }
    
    // validate role
    if (!['admin', 'user'].includes(role.toLowerCase())) {
      console.log('role', role);
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already in use' });

    const user = await User.create({
      name,
      email,
      password,
      role: role.toLowerCase() // save role as lowercase
    });

    const token = signToken(user);
    res.status(201).json({ success: true, token });
  } catch (err) {
    next(err);
  }
  console.log('Register request payload:', req.body);
};


exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
