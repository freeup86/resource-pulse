// aiRecommendationRoutes.js
const express = require('express');
const router = express.Router();
const { generateRecommendations, saveRecommendation } = require('../controllers/aiRecommendationController');

// GET route to generate recommendations for a project's required skills
router.get('/projects/:projectId/recommendations', generateRecommendations);

// POST route to save a recommendation for a project
router.post('/projects/:projectId/recommendations', saveRecommendation);

module.exports = router;