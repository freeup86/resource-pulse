// skillRecommendationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  addSkillRecommendation, 
  getProjectSkillRecommendations,
  deleteSkillRecommendation
} = require('../controllers/skillRecommendationController');

// Routes for skill recommendations
router.get('/projects/:projectId/skill-recommendations', getProjectSkillRecommendations);
router.post('/projects/:projectId/skill-recommendations', addSkillRecommendation);
router.delete('/skill-recommendations/:recommendationId', deleteSkillRecommendation);

module.exports = router;