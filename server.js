// server.js  
// Load environment variables from .env when available. In some deployment
// environments (e.g. App Service build pipeline) the dependency may not be
// installed — guard so the process doesn't crash.
try {
  require('dotenv').config();
} catch (err) {
  // If dotenv isn't installed we still want the app to start; platform
  // environment variables should be used instead.
  // eslint-disable-next-line no-console
  console.warn('dotenv not found — skipping .env load');
}
const app = require('./app');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');

process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`Server running on port ${PORT}`);
    });

    process.on('unhandledRejection', err => {
      console.error('UNHANDLED REJECTION! Shutting down...', err);
      server.close(() => process.exit(1));
    });
  })
  .catch(err => {
    console.error('Failed to connect to DB', err);
    process.exit(1);
  });
