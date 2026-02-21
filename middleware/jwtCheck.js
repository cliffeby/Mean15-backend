/**
 * Shared JWT validation middleware for Microsoft Entra tokens.
 * Extracted here so it can be reused by individual routes (e.g. /api/auth/provision)
 * that are mounted before the global jwtCheck in app.js.
 */
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const ENTRA_TENANT_ID = process.env.ENTRA_TENANT_ID;
const ENTRA_CLIENT_ID = process.env.ENTRA_CLIENT_ID;

const jwtCheck = jwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/discovery/v2.0/keys`,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
  }),
  audience: [`api://${ENTRA_CLIENT_ID}`, ENTRA_CLIENT_ID],
  issuer: `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/v2.0`,
  algorithms: ['RS256'],
  requestProperty: 'auth',
  credentialsRequired: true, // provision always requires a valid token
});

module.exports = jwtCheck;
