// app.js
console.log('=== Backend started: ', new Date().toISOString());
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
// DB type endpoint (must be public, so define before any /api middleware)
// ...existing code...
console.log('DB TYPE ROUTE REGISTERED');
const allowedOrigins = [
  'http://localhost:4200',
  'https://brave-tree-00ac3970f.1.azurestaticapps.net'
];
// Place this block here, before any app.use('/api', ...)
const requestIp = (req) => req.headers['x-forwarded-for'] || req.connection.remoteAddress;
app.get('/api/config/db-type', (req, res) => {
  const uri = process.env.MONGO_URI || '';
  const host = req.hostname || '';
  let server = 'unknown';
  if (uri.includes('localhost') || uri.includes('127.0.0.1') || host.includes('localhost') || host.includes('127.0.0.1')) {
    server = 'local';
  } else if (uri.includes('azure') || host.includes('azure')) {
    server = 'azure';
  } else if (process.env.NODE_ENV) {
    server = process.env.NODE_ENV;
  }
  console.log('[DB Type Endpoint] MONGO_URI:', uri, 'IP:', requestIp(req), 'Server:', server);
  res.json({
    dbType: getDbType(uri),
    dbName: getDbName(uri),
    server
  });
});
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,  // Reflect the request origin
  credentials: true
}));
app.use((req, res, next) => {
  console.log('INCOMING:', req.method, req.path, req.originalUrl, req.headers.origin);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());

// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev', {
//     skip: function (req) {
//       return req.path === '/api/audit/logs';
//     }
//   }));
// } else {
//   app.use(morgan('combined'));
// }

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Generous limit for production
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

// Helper to determine DB type
function getDbType(uri) {
  if (uri.includes('cosmos.azure.com')) return 'AzureCosmos';
  if (uri.includes('mongodb://127.0.0.1') || uri.includes('localhost')) return 'Local';
  if (uri.includes('mongodb+srv://') && uri.includes('atlas')) return 'Atlas';
  if (uri.includes('mongodb+srv://')) return 'Atlas'; // fallback for Atlas
  return 'Unknown';
}

function getDbName(uri) {
  // Extract db name from URI: after last '/' and before '?' or end
  if (!uri) return 'Unknown';
  // Handles both mongodb+srv and mongodb:// formats
  // Example: mongodb+srv://user:pass@host/dbname?params
  const parts = uri.split('/');
  if (parts.length > 0) {
    // Find the last non-empty part before any ?
    const lastPart = parts[parts.length - 1].split('?')[0];
    if (lastPart) return lastPart;
  }
  return 'Unknown';
}

// Healthcheck
app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // allow all origins
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});



// ...existing code...

// Expose defaultLeague for admin config and profile logic
app.get('/api/config/default-league', jwtCheck, (req, res) => {
  res.json({ defaultLeague: environment.defaultLeague });
});

// error handler (last)
app.use(errorHandler);

module.exports = app;


