// Middleware to extract user info and build author object
// Uses req.user (set by local JWT auth middleware)
function extractAuthor(req, _res, next) {
  const user = req.user; // set by auth.js after verifying local JWT
  if (user) {
    req.author = {
      id: user._id?.toString() || '',
      email: user.email || '',
      name: user.name || user.email || '',
    };
  }
  next();
}
module.exports = { extractAuthor };