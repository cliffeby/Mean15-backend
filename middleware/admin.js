// middleware/admin.js
// Updated to work with Microsoft Entra External ID tokens
const admin = (req, res, next) => {
  // req.auth is populated by express-jwt middleware
  const roles = req.auth?.roles || [];
  
  // Check if user has admin or developer role
  if (!roles.includes('admin') && !roles.includes('developer')) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin/developer privileges required.',
      userRoles: roles // Debug info
    });
  }
  next();
};

module.exports = admin;
