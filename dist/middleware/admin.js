"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = admin;
// Middleware to allow only admins
function admin(req, res, next) {
    // @ts-ignore
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Admin access required.' });
}
//# sourceMappingURL=admin.js.map