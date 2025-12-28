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
const auditLogger = require('./middleware/auditLogger');
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
const auditRoutes = require('./routes/auditRoutes');


// Ensure logs directory exists (for Azure and local)
const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, 'logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    // Optionally log creation
    if (process.env.NODE_ENV !== 'production') {
      console.log('[startup] Created logs directory:', logsDir);
    }
  }
} catch (err) {
  console.error('[startup] Failed to create logs directory:', err);
}

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
  audience: [`api://${ENTRA_CLIENT_ID}`, ENTRA_CLIENT_ID],
  issuer: ENTRA_ISSUER,
  algorithms: ['RS256'],
  requestProperty: 'auth',
  credentialsRequired: false,
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
app.use('/api', (req, _res, next) => {
  // console.log(`\n--- API Request ---`);
  // console.log(`${req.method} ${req.path}`);
  // console.log('Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  if (req.headers.authorization) {
    // console.log('Token preview:', req.headers.authorization.substring(0, 50) + '...');
  }
  next();
});

// Mount auth routes first (no JWT check)
app.use('/api/auth', authRoutes);

// Global: require at least 'user' role for all /api routes except /api/auth
const { requireMinRole } = require('./middleware/roleHierarchy');
app.use('/api', jwtCheck, (req, res, next) => {
  // Allow /api/auth without role check
  if (req.path.startsWith('/auth')) return next();
  return requireMinRole('user')(req, res, next);
});

// Add auditLogger after JWT check for all protected API routes
app.use('/api/members', auditLogger, memberRoutes);
app.use('/api/users', auditLogger, userRoutes);
app.use('/api/scorecards', auditLogger, scorecardRoutes);
app.use('/api/scores', auditLogger, scoreRoutes);
app.use('/api/matches', auditLogger, matchRoutes);
app.use('/api/hcaps', auditLogger, hcapRoutes);
app.use('/api/orphans', auditLogger, orphanRoutes);
app.use('/api/audit', requireRole('admin'), auditRoutes);

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


