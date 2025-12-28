// middleware/roleHierarchy.js
// Express middleware for hierarchical role-based access

const ROLE_LEVELS = { user: 1, fieldhand: 2, admin: 3, developer: 4 };

function requireMinRole(minRole) {
  return (req, res, next) => {
    // Diagnostic logging for Azure issues
    if (process.env.NODE_ENV !== 'production') {
      console.log('[requireMinRole] req.auth:', JSON.stringify(req.auth));
    }
    const userRoles = Array.isArray(req.auth?.roles) ? req.auth.roles : (req.auth?.role ? [req.auth.role] : []);
    if (!req.auth) {
      return res.status(401).json({ error: 'Missing authentication (req.auth not set)', details: req.auth });
    }
    if (!userRoles.length) {
      return res.status(403).json({ error: `No roles found in token. Requires at least ${minRole} role.`, details: req.auth });
    }
    const userMaxLevel = Math.max(...userRoles.map(r => ROLE_LEVELS[r] || 0));
    if (userMaxLevel >= ROLE_LEVELS[minRole]) {
      return next();
    }
    return res.status(403).json({ error: `Requires at least ${minRole} role`, roles: userRoles, details: req.auth });
  };
}

module.exports = { requireMinRole, ROLE_LEVELS };
