const express = require('express');
const router = express.Router();
const { 
  getOrphanReport,
  cleanupOrphans,
  findOrphans
} = require('../controllers/orphanController');
const admin = require('../middleware/admin');

// Auth is now handled globally in app.js via jwtCheck middleware
// All routes require admin access
router.use(admin);

// Get orphaned records report
router.get('/report', admin, getOrphanReport);

// Find orphaned scores
router.get('/find', admin, findOrphans);

// Clean up orphaned records
router.post('/cleanup', admin, cleanupOrphans);

module.exports = router;