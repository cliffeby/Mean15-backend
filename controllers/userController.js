// controllers/userController.js
const User = require('../models/User');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Graph API helper — acquires an app-only access token via client_credentials
// ---------------------------------------------------------------------------
async function getGraphToken() {
  const tenantId = process.env.ENTRA_TENANT_ID;
  const clientId = process.env.ENTRA_CLIENT_ID;
  const clientSecret = process.env.ENTRA_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('ENTRA_TENANT_ID, ENTRA_CLIENT_ID, and ENTRA_CLIENT_SECRET must all be set in .env');
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Failed to acquire Graph token');
  return data.access_token;
}

// ---------------------------------------------------------------------------
// POST /api/users/invite
// Sends a Microsoft Entra guest invitation via the Graph API.
// Requires the App Registration to have the User.Invite.All application permission
// (granted by an admin in Azure Portal → App registrations → API permissions).
// ---------------------------------------------------------------------------
exports.inviteUser = async (req, res, next) => {
  try {
    const { email, displayName } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const redirectUrl = process.env.FRONTEND_URL || process.env.FRONTEND_LOCAL_URL || 'http://localhost:4200';

    const token = await getGraphToken();

    const graphRes = await fetch('https://graph.microsoft.com/v1.0/invitations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitedUserEmailAddress: email,
        inviteRedirectUrl: redirectUrl,
        sendInvitationMessage: true,
        invitedUserDisplayName: displayName || undefined,
        invitedUserMessageInfo: {
          customizedMessageBody:
            'You have been invited to the Rochester Golf System. Click the link below to accept your invitation and sign in.',
        },
      }),
    });

    const graphData = await graphRes.json();
    if (!graphRes.ok) {
      logger.warn(`Graph invitation failed for ${email}: ${JSON.stringify(graphData)}`);
      return res.status(graphRes.status).json({ success: false, message: graphData?.error?.message || 'Invitation failed.' });
    }

    logger.info(`Entra guest invitation sent to: ${email}`);
    return res.json({ success: true, message: `Invitation sent to ${email}.`, inviteRedeemUrl: graphData.inviteRedeemUrl });
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
