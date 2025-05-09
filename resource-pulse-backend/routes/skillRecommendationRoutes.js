// skillRecommendationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  addSkillRecommendation, 
  getProjectSkillRecommendations,
  deleteSkillRecommendation
} = require('../controllers/skillRecommendationController');

// Routes for skill recommendations
router.get('/projects/:projectId', getProjectSkillRecommendations);
router.post('/projects/:projectId', addSkillRecommendation);
router.delete('/:recommendationId', deleteSkillRecommendation);

module.exports = router;