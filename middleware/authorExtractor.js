// Middleware to extract Entra user info and build author object
function extractAuthor(req, _res, next) {
  const entraUser = req.auth; // <-- use req.auth, not req.user
  if (entraUser) {
    req.author = {
      id: entraUser.oid || entraUser.sub,
      email: entraUser.email,
      name: entraUser.name,
    };
  }
  next();
}
module.exports = { extractAuthor };