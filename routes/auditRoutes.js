const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { requireMinRole } = require('../middleware/roleHierarchy');

// GET /api/audit-logs
router.get('/logs',requireMinRole('admin'), auditController.getAuditLogs);

module.exports = router;
