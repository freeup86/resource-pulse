// telemetryRoutes.js
const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');

// Route to get AI API usage statistics (Claude)
router.get('/ai', telemetryController.getAIStatistics);

// Keep backward compatibility
router.get('/openai', telemetryController.getAIStatistics);

module.exports = router;