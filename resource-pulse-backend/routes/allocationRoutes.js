const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');

// POST /api/allocations/remove - Remove resource allocation
router.post('/remove', allocationController.removeAllocation);

// PUT /api/allocations/resource/:resourceId - Update resource allocation
router.put('/resource/:resourceId', allocationController.updateAllocation);

// GET /api/allocations/ending-soon - Get resources with assignments ending soon
router.get('/ending-soon', allocationController.getResourcesEndingSoon);

// GET /api/allocations/matches - Get resource-project matches
router.get('/matches', allocationController.getResourceMatches);

// GET /api/allocations/resource/:resourceId - Get resource allocations
router.get('/resource/:resourceId', allocationController.getResourceAllocations);

// GET /api/allocations/expired - Get expired allocations
router.get('/expired', allocationController.getExpiredAllocations);

// GET /api/allocations/capacity/forecast - Get capacity forecast
router.get('/capacity/forecast', allocationController.getCapacityForecast);

module.exports = router;