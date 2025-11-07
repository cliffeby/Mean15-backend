"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
const User_js_1 = require("../models/User.js");
const jsonwebtoken_1 = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const signToken = (user) => jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
console.log('Auth Controller loaded', signToken);
// Register a new user
async function register(req, res, next) {
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
        const exists = await User_js_1.User.findOne({ email });
        if (exists)
            return res.status(400).json({ success: false, message: 'Email already in use' });
        const user = await User_js_1.User.create({
            name,
            email,
            password,
            role: role.toLowerCase()
        });
        const token = signToken(user);
        res.status(201).json({ success: true, token });
    }
    catch (err) {
        next(err);
    }
    console.log('Register request payload:', req.body);
}
// Login user
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const user = await User_js_1.User.findOne({ email }).select('+password');
        if (!user)
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        // @ts-ignore
        const isMatch = await user.matchPassword(password);
        if (!isMatch)
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        const token = signToken(user);
        res.json({ success: true, token });
    }
    catch (err) {
        next(err);
    }
}
// Get current user profile
async function getMe(req, res, next) {
    try {
        // @ts-ignore
        const user = await User_js_1.User.findById(req.user.id).select('-password');
        res.json({ success: true, user });
    }
    catch (err) {
        next(err);
    }
} // ...existing code from authController.js will be inserted here...
//# sourceMappingURL=authController.js.map