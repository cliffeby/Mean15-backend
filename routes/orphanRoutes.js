const express = require('express');
const router = express.Router();
const { 
  getOrphanReport,
  cleanupOrphans,
  findOrphans
} = require('../controllers/orphanController');
// const admin = require('../middleware/admin');
const { requireMinRole } = require('../middleware/roleHierarchy');
const { extractAuthor } = require('../middleware/authorExtractor');

// Auth is now handled globally in app.js via jwtCheck middleware
// All routes require admin access
// router.use(admin);

// Get orphaned records report
router.get('/report', requireMinRole('admin'), getOrphanReport);

// Find orphaned scores
router.get('/find', requireMinRole('admin'), findOrphans);

// Clean up orphaned records
router.post('/cleanup', requireMinRole('admin'), extractAuthor, cleanupOrphans);

module.exports = router;