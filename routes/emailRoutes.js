// backend/routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { requireMinRole } = require('../middleware/roleHierarchy');
const { extractAuthor } = require('../middleware/authorExtractor');

// Apply author extractor to all routes to get req.author from JWT
router.use(extractAuthor);

// All email routes require at least 'admin' role

// Get email service status (check if configured)
router.get('/status', requireMinRole('admin'), emailController.getEmailStatus);

// Send test email
router.post('/test', requireMinRole('admin'), emailController.sendTestEmail);

// Send email to specific members
router.post('/send', requireMinRole('admin'), emailController.sendToMembers);

// Send email to all members
router.post('/send-all', requireMinRole('admin'), emailController.sendToAllMembers);

module.exports = router;
