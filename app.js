// app.js
const environment = require('./config/environment');

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const errorHandler = require('./middleware/errorHandler');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const authRoutes = require('./routes/authRoutes');
// Customer model, controller, and routes removed
const memberRoutes = require('./routes/memberRoutes');
const userRoutes = require('./routes/userRoutes');
const scorecardRoutes = require('./routes/scorecardRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const matchRoutes = require('./routes/matchRoutes');
const hcapRoutes = require('./routes/hcapRoutes');
const orphanRoutes = require('./routes/orphanRoutes');

const app = express();

app.use(helmet());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 100, // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use(limiter);

// MS Entra config
// const ENTRA_TENANT_ID = process.env.ENTRA_TENANT_ID || '887b774a-d6ed-4d56-9c24-1af7b955fd02';
// const ENTRA_CLIENT_ID = process.env.ENTRA_CLIENT_ID || 'aa1ad4fb-4f38-46ba-970d-9af33e9a2e52';
const ENTRA_TENANT_ID = process.env.ENTRA_TENANT_ID;
const ENTRA_CLIENT_ID = process.env.ENTRA_CLIENT_ID;
const ENTRA_ISSUER = `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/v2.0`;

// JWT validation middleware for Entra External ID tokens
const jwtCheck = jwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/discovery/v2.0/keys`,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5
  }),
  audience: [`api://${ENTRA_CLIENT_ID}`, ENTRA_CLIENT_ID], // Accept both API scope and client ID formats
  issuer: ENTRA_ISSUER,
  algorithms: ['RS256'],
  requestProperty: 'auth',
  credentialsRequired: false, // Don't require credentials for debugging
});

// Role-based middleware
function requireRole(role) {
  return (req, res, next) => {
    const roles = req.auth?.roles || [req.auth?.role].filter(Boolean);
    if (roles && roles.includes(role)) return next();
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  };
}

// Debug logging for all API requests
app.use('/api', (req, res, next) => {
  console.log(`\n--- API Request ---`);
  console.log(`${req.method} ${req.path}`);
  console.log('Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  if (req.headers.authorization) {
    console.log('Token preview:', req.headers.authorization.substring(0, 50) + '...');
  }
  next();
});

// Mount auth routes first (no JWT check)
app.use('/api/auth', authRoutes);

// Mount protected API routes with JWT check
app.use('/api/members', jwtCheck, memberRoutes);
app.use('/api/users', jwtCheck, userRoutes);
app.use('/api/scorecards', jwtCheck, scorecardRoutes);
app.use('/api/scores', jwtCheck, scoreRoutes);
app.use('/api/matches', jwtCheck, matchRoutes);
app.use('/api/hcaps', jwtCheck, hcapRoutes);
app.use('/api/orphans', jwtCheck, orphanRoutes);

// Example: app.use('/api/admin', requireRole('admin'));

// healthcheck
app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // allow all origins
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

// Expose defaultLeague for admin config and profile logic
app.get('/api/config/default-league', jwtCheck, (req, res) => {
  res.json({ defaultLeague: environment.defaultLeague });
});

// error handler (last)
app.use(errorHandler);

module.exports = app;


