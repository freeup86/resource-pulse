/**
 * Project Risk Routes
 * Defines API routes for project risk analysis functionality
 */
const express = require('express');
const router = express.Router();
const projectRiskController = require('../controllers/projectRiskController');

// Get all project risks
router.get('/projects', projectRiskController.getAllProjectRisks);

// Get detailed risk analysis for a specific project
router.get('/projects/:projectId', projectRiskController.getProjectRisk);

// Get risk factors for a specific project
router.get('/projects/:projectId/factors', projectRiskController.getProjectRiskFactors);

// Get risk mitigation recommendations for a project
router.get('/projects/:projectId/mitigations', projectRiskController.getRiskMitigations);

module.exports = router;