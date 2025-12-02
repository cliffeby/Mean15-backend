// middleware/admin.js
const admin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin' || req.user.role !== 'developer') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin/developer privileges required.' 
    });
  }
  next();
};

module.exports = admin;
