// controllers/userController.js
const User = require('../models/User');
const logger = require('../utils/logger');
const emailService = require('../utils/emailService');

// ---------------------------------------------------------------------------
// POST /api/users/invite
// Creates a local account with the default temp password and emails credentials.
// ---------------------------------------------------------------------------
exports.inviteUser = async (req, res, next) => {
  try {
    const { email, displayName } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
    }

    const tempPassword = process.env.REGISTRATION_DEFAULT_PASSWORD || 'Welcome1!';
    const name = displayName || email.split('@')[0];

    await User.create({
      name,
      email: email.toLowerCase(),
      password: tempPassword,
      role: 'user',
      mustChangePassword: true,
    });
    logger.info(`Admin created local account for: ${email}`);

    const appName = process.env.APP_NAME || 'Rochester Golf System';
    const loginUrl = process.env.FRONTEND_URL || process.env.FRONTEND_LOCAL_URL || 'http://localhost:4200';
    const greeting = `Hi ${name},`;

    try {
      await emailService.sendEmail({
        to: email,
        subject: `Your ${appName} account is ready`,
        plainTextContent:
          `${greeting}\n\nAn account has been created for you on ${appName}.\n\n` +
          `Login: ${loginUrl}\nEmail: ${email}\nTemporary password: ${tempPassword}\n\n` +
          `You will be asked to change your password on first login.\n\nWelcome aboard!`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:32px;
                      border:1px solid #e0e0e0;border-radius:8px;">
            <h2 style="color:#1a237e;margin-top:0;">${appName}</h2>
            <p>${greeting}</p>
            <p>An account has been created for you on <strong>${appName}</strong>.</p>
            <table style="margin:16px 0;border-collapse:collapse;">
              <tr><td style="padding:4px 12px 4px 0;color:#555;">Login URL</td>
                  <td><a href="${loginUrl}" style="color:#1976d2;">${loginUrl}</a></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#555;">Email</td>
                  <td>${email}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#555;">Temporary password</td>
                  <td><strong>${tempPassword}</strong></td></tr>
            </table>
            <p>You will be prompted to change your password on first login.</p>
            <p style="text-align:center;margin:32px 0;">
              <a href="${loginUrl}"
                 style="background:#1976d2;color:#fff;padding:14px 28px;border-radius:4px;
                        text-decoration:none;font-size:16px;font-weight:bold;">Log In</a>
            </p>
          </div>`,
      });
      logger.info(`Welcome email sent to: ${email}`);
    } catch (emailErr) {
      logger.warn(`Welcome email delivery failed for ${email}: ${emailErr.message}`);
      // Account already created — still return success
    }

    return res.json({ success: true, message: `Account created and welcome email sent to ${email}.` });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    logger.info(`GET /api/users requested by: ${JSON.stringify(req.user)}`);
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

// Get a single user by ID
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// Update user's role (admin/developer only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'fieldhand', 'admin', 'developer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    logger.info(`Role updated for user ${user.email} → ${role} by ${req.user?.email}`);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// Update user's defaultLeague
exports.updateUserLeague = async (req, res, next) => {
  try {
    const { defaultLeague } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { defaultLeague },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
