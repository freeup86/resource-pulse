// whatIfScenarioRoutes.js
const express = require('express');
const router = express.Router();
const whatIfScenarioController = require('../controllers/whatIfScenarioController');

// Create a new what-if scenario
router.post('/scenarios', whatIfScenarioController.createWhatIfScenario);

// Get all what-if scenarios
router.get('/scenarios', whatIfScenarioController.getWhatIfScenarios);

// Get a what-if scenario by ID
router.get('/scenarios/:scenarioId', whatIfScenarioController.getWhatIfScenarioById);

// Update project timeline in a scenario
router.post('/scenarios/:scenarioId/projects/:projectId/timeline', whatIfScenarioController.updateProjectTimeline);

// Update resource in a scenario
router.post('/scenarios/:scenarioId/resources', whatIfScenarioController.updateScenarioResource);

// Calculate scenario metrics
router.post('/scenarios/:scenarioId/calculate-metrics', whatIfScenarioController.calculateScenarioMetrics);

// Compare scenarios
router.post('/compare', whatIfScenarioController.compareScenarios);

// Promote scenario to production
router.post('/scenarios/:scenarioId/promote', whatIfScenarioController.promoteScenario);

module.exports = router;