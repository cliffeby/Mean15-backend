/**
 * enrichAuthFromDb.js
 *
 * Runs after jwtCheck (which populates req.auth with the Entra JWT claims).
 * For users who have no Entra app roles assigned (e.g. newly invited guests),
 * looks up their DB User record by entraOid or email and injects the DB role
 * into req.auth so that requireMinRole checks pass correctly.
 *
 * Users who DO have Entra app roles are untouched — the Entra roles take
 * precedence once assigned.
 */

const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = async function enrichAuthFromDb(req, res, next) {
  try {
    // Skip if no Entra token was decoded
    if (!req.auth) return next();

    // If the token already carries app roles, nothing to do
    const entraRoles = Array.isArray(req.auth.roles) ? req.auth.roles : [];
    if (entraRoles.length > 0) return next();

    // Find the DB user by OID (most reliable) or email/upn
    const oid = req.auth.oid || req.auth.sub;
    const email =
      req.auth.preferred_username ||
      req.auth.email ||
      req.auth.upn ||
      null;

    const query = [];
    if (oid) query.push({ entraOid: oid });
    if (email) query.push({ email });
    if (query.length === 0) return next();

    const user = await User.findOne({ $or: query }).select('role entraOid email').lean();

    if (user) {
      // Backfill entraOid if this is their first login after being pre-provisioned by email
      if (!user.entraOid && oid) {
        await User.findByIdAndUpdate(user._id, { entraOid: oid });
      }
      // Inject DB role into req.auth so all downstream middleware/controllers can use it
      req.auth.roles = [user.role];
      req.auth.role = user.role;
      req.auth.dbUserId = user._id.toString();
    }
    // If no DB record yet, roles stay empty — jwtCheck already validated the token,
    // so let requireMinRole return the proper 403.

    next();
  } catch (err) {
    logger.warn(`enrichAuthFromDb error (non-fatal): ${err.message}`);
    next(); // never block the request over a DB lookup failure
  }
};
