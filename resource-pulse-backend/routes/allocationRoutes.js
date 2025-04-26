const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');

// PUT /api/allocations/resource/:resourceId - Update resource allocation
router.put('/resource/:resourceId', allocationController.updateAllocation);

// GET /api/allocations/ending-soon - Get resources with assignments ending soon
router.get('/ending-soon', allocationController.getResourcesEndingSoon);

// GET /api/allocations/matches - Get resource-project matches
router.get('/matches', allocationController.getResourceMatches);

module.exports = router;