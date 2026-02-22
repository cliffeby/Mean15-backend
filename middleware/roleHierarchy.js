// middleware/roleHierarchy.js
const ROLE_LEVELS = { user: 1, fieldhand: 2, admin: 3, developer: 4 };

function requireMinRole(minRole) {
  return (req, res, next) => {
    // auth.js sets req.user from the local JWT
    const role = req.user?.role;
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!role || (ROLE_LEVELS[role] || 0) < (ROLE_LEVELS[minRole] || 0)) {
      return res.status(403).json({ error: `Requires at least ${minRole} role`, role });
    }
    return next();
  };
}

module.exports = { requireMinRole, ROLE_LEVELS };
