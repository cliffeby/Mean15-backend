const express = require('express');
const router = express.Router();
const { 
  getOrphanReport,
  cleanupOrphans,
  findOrphans
} = require('../controllers/orphanController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// All routes require admin access
router.use(auth);
router.use(admin);

// Get orphaned records report
router.get('/report', getOrphanReport);

// Find orphaned scores
router.get('/find', findOrphans);

// Clean up orphaned records
router.post('/cleanup', cleanupOrphans);

module.exports = router;