// Authentication controller.
// Local registration and login are supported alongside Microsoft Entra (MSAL).
// Entra users are provisioned via /api/auth/provision (JIT).
const User = require('../models/User');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// Creates a local account with role='user' and the organisation default password.
// The caller (new user) receives a success message — they must log in separately.
// ---------------------------------------------------------------------------
exports.register = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
    }

    // The common/temporary password every new registrant receives.
    // Set REGISTRATION_DEFAULT_PASSWORD in your .env to override.
    const tempPassword = process.env.REGISTRATION_DEFAULT_PASSWORD || 'Welcome1!';

    await User.create({
      name,
      email: email.toLowerCase(),
      password: tempPassword,    // bcrypt pre-save hook hashes it automatically
      role: 'user',
      mustChangePassword: true,  // Force a password change on first login
    });

    logger.info(`Local account registered: ${email}`);

    return res.status(201).json({
      success: true,
      message: 'Account created. Log in with the temporary password and change it immediately.',
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/login  (local email + password only)
// ---------------------------------------------------------------------------
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      token,
      mustChangePassword: user.mustChangePassword,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/auth/me  (kept for local-auth clients)
// ---------------------------------------------------------------------------
exports.getMe = async (req, res) => {
  return res.status(501).json({ success: false, message: 'User info is handled by Microsoft Entra. This endpoint is disabled.' });
};

// ---------------------------------------------------------------------------
// PUT /api/auth/change-password
// Requires the old password and issues a new token with mustChangePassword=false.
// Protected by the local auth middleware (auth.js) — caller must be logged in.
// ---------------------------------------------------------------------------
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !user.password) {
      return res.status(404).json({ success: false, message: 'User not found or has no local password.' });
    }

    const match = await user.matchPassword(currentPassword);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;          // pre-save hook re-hashes
    user.mustChangePassword = false;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    // Issue a fresh token so the caller's session reflects mustChangePassword=false
    const token = signToken(user);
    return res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/provision  (Entra JIT provisioning — see inline jwtCheck in route)
// ---------------------------------------------------------------------------
// Extract the real email from an Entra token, handling the #EXT# guest UPN format.
// Guest UPN: user_gmail.com#EXT#@tenant.onmicrosoft.com → user@gmail.com
function extractEmail(auth) {
  // Prefer the 'email' claim — it always holds the real address
  if (auth?.email) return auth.email.toLowerCase();

  const upn = auth?.preferred_username || '';
  if (upn.includes('#EXT#')) {
    // Decode: everything before #EXT#, then replace the LAST underscore with @
    const local = upn.split('#EXT#')[0];
    const atIdx = local.lastIndexOf('_');
    if (atIdx !== -1) {
      return (local.substring(0, atIdx) + '@' + local.substring(atIdx + 1)).toLowerCase();
    }
  }
  return upn.toLowerCase() || null;
}

exports.provision = async (req, res, next) => {
  try {
    const oid = req.auth?.oid;
    const email = extractEmail(req.auth);
    const name = req.auth?.name || email;

    if (!oid && !email) {
      return res.status(400).json({ success: false, message: 'Cannot provision: no OID or email in token.' });
    }

    let user = await User.findOne({ $or: [{ entraOid: oid }, { email }] });

    if (user) {
      if (oid && !user.entraOid) {
        user.entraOid = oid;
        await user.save();
      }
      return res.json({ success: true, provisioned: false, user: { _id: user._id, name: user.name, email: user.email, role: user.role, defaultLeague: user.defaultLeague } });
    }

    user = await User.create({ name, email, entraOid: oid, role: 'user' });
    logger.info(`JIT provisioned new user: ${email} (OID: ${oid})`);

    return res.status(201).json({ success: true, provisioned: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role, defaultLeague: user.defaultLeague } });
  } catch (err) {
    next(err);
  }
};
