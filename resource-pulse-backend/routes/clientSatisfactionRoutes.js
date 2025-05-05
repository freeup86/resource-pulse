/**
 * Client Satisfaction Routes
 * Defines API routes for client satisfaction prediction functionality
 */
const express = require('express');
const router = express.Router();
const clientSatisfactionController = require('../controllers/clientSatisfactionController-fixed');

// Get all satisfaction predictions
router.get('/predictions', clientSatisfactionController.getAllSatisfactionPredictions);

// Get project satisfaction detail
router.get('/projects/:projectId', clientSatisfactionController.getProjectSatisfactionDetails);

// Get project satisfaction factors
router.get('/projects/:projectId/factors', clientSatisfactionController.getProjectSatisfactionFactors);

// Get project resource pairings
router.get('/projects/:projectId/pairings', clientSatisfactionController.getResourcePairingRecommendations);

// Predict satisfaction for resource-project pairing
router.get('/projects/:projectId/resources/:resourceId/satisfaction', 
  clientSatisfactionController.predictResourceClientSatisfaction);

// Predict satisfaction for all resources on a project
router.get('/projects/:projectId/satisfaction', 
  clientSatisfactionController.predictProjectSatisfaction);

// Predict satisfaction for all projects with a client
router.get('/clients/:clientId/satisfaction', 
  clientSatisfactionController.predictClientSatisfaction);

// Get at-risk clients
router.get('/at-risk', clientSatisfactionController.getAtRiskClients);

// Get all clients
router.get('/clients', clientSatisfactionController.getAllClients);

// Record a client satisfaction rating
router.post('/ratings', clientSatisfactionController.recordSatisfactionRating);

module.exports = router;