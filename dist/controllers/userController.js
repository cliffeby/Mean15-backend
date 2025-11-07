"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
exports.getUser = getUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const User_js_1 = require("../models/User.js");
// Get all users (admin only)
async function getAllUsers(req, res, next) {
    try {
        const users = await User_js_1.User.find().select('-password');
        res.json({ success: true, users });
    }
    catch (err) {
        next(err);
    }
}
// Get a single user by ID (admin only)
async function getUser(req, res, next) {
    try {
        const user = await User_js_1.User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    }
    catch (err) {
        next(err);
    }
}
// Update a user by ID (admin only)
async function updateUser(req, res, next) {
    try {
        const user = await User_js_1.User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    }
    catch (err) {
        next(err);
    }
}
// Delete a user by ID (admin only)
async function deleteUser(req, res, next) {
    try {
        const user = await User_js_1.User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'User deleted' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=userController.js.map