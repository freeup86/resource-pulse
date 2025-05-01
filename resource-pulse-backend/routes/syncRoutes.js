// resource-pulse-backend/routes/syncRoutes.js
const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

// POST /api/sync/resources - Sync resources from external system
router.post('/resources', syncController.syncResources);

// POST /api/sync/projects - Sync projects from external system
router.post('/projects', syncController.syncProjects);

// POST /api/sync/allocations - Sync allocations from external system
router.post('/allocations', syncController.syncAllocations);

// POST /api/sync/all - Sync all data from external system
router.post('/all', syncController.syncAll);

module.exports = router;