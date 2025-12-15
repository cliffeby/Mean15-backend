// middleware/roleHierarchy.js
// Express middleware for hierarchical role-based access

const ROLE_LEVELS = { user: 1, fieldhand: 2, admin: 3, developer: 4 };

function requireMinRole(minRole) {
  return (req, res, next) => {
    const userRoles = req.auth?.roles || [];
    const userMaxLevel = Math.max(...userRoles.map(r => ROLE_LEVELS[r] || 0));
    if (userMaxLevel >= ROLE_LEVELS[minRole]) {
      return next();
    }
    return res.status(403).json({ error: `Requires at least ${minRole} role` });
  };
}

module.exports = { requireMinRole, ROLE_LEVELS };
