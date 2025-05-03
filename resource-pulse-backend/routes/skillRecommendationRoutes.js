// skillRecommendationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  addSkillRecommendation, 
  getProjectSkillRecommendations 
} = require('../controllers/skillRecommendationController');

// Routes for skill recommendations
router.get('/projects/:projectId/skill-recommendations', getProjectSkillRecommendations);
router.post('/projects/:projectId/skill-recommendations', addSkillRecommendation);

module.exports = router;