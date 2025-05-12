const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const skillRecommendationController = require('../controllers/skillRecommendationController');

// GET /api/projects - Get all projects
router.get('/', projectController.getAllProjects);

// GET /api/projects/:id - Get a single project
router.get('/:id', projectController.getProjectById);

// POST /api/projects - Create a new project
router.post('/', projectController.createProject);

// PUT /api/projects/:id - Update a project
router.put('/:id', projectController.updateProject);

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', projectController.deleteProject);

// POST /api/projects/:id/recalculate-financials - Recalculate project financial data
router.post('/:id/recalculate-financials', projectController.recalculateFinancials);

// GET /api/projects/:projectId/skill-recommendations - Get skill recommendations for a project
router.get('/:projectId/skill-recommendations', skillRecommendationController.getProjectSkillRecommendations);

// POST /api/projects/:projectId/skill-recommendations - Add skill recommendation for a project
router.post('/:projectId/skill-recommendations', skillRecommendationController.addSkillRecommendation);

module.exports = router;