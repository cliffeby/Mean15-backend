// app.js
const environment = require('./config/environment');

// ...existing code...
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
// Customer model, controller, and routes removed
const memberRoutes = require('./routes/memberRoutes');
const userRoutes = require('./routes/userRoutes');
const scorecardRoutes = require('./routes/scorecardRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const matchRoutes = require('./routes/matchRoutes');
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

// Mount API routes
app.use('/api/auth', authRoutes);
// Customer model, controller, and routes removed
app.use('/api/members', memberRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scorecards', scorecardRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/orphans', orphanRoutes);

// healthcheck
app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // allow all origins
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

// Expose defaultLeague for admin config and profile logic
app.get('/api/config/default-league', (req, res) => {
  res.json({ defaultLeague: environment.defaultLeague });
});

// error handler (last)
app.use(errorHandler);

module.exports = app;


