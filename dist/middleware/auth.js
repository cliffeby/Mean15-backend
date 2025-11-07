"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
const jsonwebtoken_1 = require("jsonwebtoken");
const User_js_1 = require("../models/User.js");
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
// Middleware to authenticate JWT and attach user to request
async function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Attach user to request
        const user = await User_js_1.User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }
        // @ts-ignore
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({ success: false, message: 'Token is not valid.' });
    }
}
//# sourceMappingURL=auth.js.map