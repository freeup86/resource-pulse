// resource-pulse-backend/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// GET /api/settings - Get all system settings
router.get('/', settingsController.getSettings);

// PUT /api/settings - Update system settings
router.put('/', settingsController.updateSettings);

module.exports = router;