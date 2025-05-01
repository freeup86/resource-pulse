const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');

// POST /api/import/resources - Import resources from Excel
router.post('/resources', importController.importResources);

// POST /api/import/projects - Import projects from Excel
router.post('/projects', importController.importProjects);

// POST /api/import/allocations - Import allocations from Excel
router.post('/allocations', importController.importAllocations);

module.exports = router;