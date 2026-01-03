// All authentication is now handled by Microsoft Entra External ID.
// These endpoints are disabled.  

exports.register = async (req, res) => {
  return res.status(501).json({ success: false, message: 'Registration is handled by Microsoft Entra. This endpoint is disabled.' });
};

exports.login = async (req, res) => {
  return res.status(501).json({ success: false, message: 'Login is handled by Microsoft Entra. This endpoint is disabled.' });
};

exports.getMe = async (req, res) => {
  return res.status(501).json({ success: false, message: 'User info is handled by Microsoft Entra. This endpoint is disabled.' });
};
