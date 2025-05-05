// matchingRoutes.js
const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');

// Find resources for a project
router.get('/projects/:projectId/resources', matchingController.findResourcesForProject);

// Find projects for a resource
router.get('/resources/:resourceId/projects', matchingController.findProjectsForResource);

// Get match score for a resource-project pair
router.get('/resources/:resourceId/projects/:projectId/score', matchingController.getMatchScore);

// Find the best matches based on query parameters
router.get('/matches', matchingController.findBestMatches);

// Get resource allocations
router.get('/allocations', matchingController.getResourceAllocations);

module.exports = router;