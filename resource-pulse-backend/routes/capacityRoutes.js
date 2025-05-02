// capacityRoutes.js
const express = require('express');
const router = express.Router();
const capacityController = require('../controllers/capacityController');
const resourceCapacityController = require('../controllers/resourceCapacityController');

// Capacity Scenarios routes
router.get('/scenarios', capacityController.getScenarios);
router.post('/scenarios', capacityController.createScenario);
router.get('/scenarios/:scenarioId', capacityController.getScenarioById);
router.put('/scenarios/:scenarioId', capacityController.updateScenario);
router.post('/scenarios/:scenarioId/resources/:resourceId', capacityController.updateScenarioAllocation);
router.delete('/scenarios/:scenarioId/allocations/:allocationId', capacityController.deleteScenarioAllocation);
router.post('/scenarios/:scenarioId/apply', capacityController.applyScenario);

// Resource Capacity routes
router.get('/resources/:resourceId/capacity', resourceCapacityController.getResourceCapacity);
router.put('/resources/:resourceId/capacity', resourceCapacityController.updateResourceCapacity);
router.put('/resources/:resourceId/capacity/bulk', resourceCapacityController.bulkUpdateResourceCapacity);

// Capacity Forecast route
router.get('/forecast', capacityController.getCapacityForecast);

module.exports = router;