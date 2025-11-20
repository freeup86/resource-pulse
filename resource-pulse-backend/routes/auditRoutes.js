const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, checkRole } = require('../middleware/auth');

// Get audit logs (Admin only)
router.get('/', authenticate, checkRole(['Admin']), auditController.getAuditLogs);

module.exports = router;
