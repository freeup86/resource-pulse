const express = require('express');
const router = express.Router();
const skillsController = require('../controllers/skillsController');

// Get all skills
router.get('/', skillsController.getAllSkills);

// Get skill categories
router.get('/categories', skillsController.getSkillCategories);

// Get skill proficiency levels
router.get('/proficiency-levels', skillsController.getSkillProficiencyLevels);

// Get skills gap analysis
router.get('/gap-analysis', skillsController.getSkillsGapAnalysis);

// Get a single skill by ID
router.get('/:id', skillsController.getSkillById);

// Create a new skill
router.post('/', skillsController.createSkill);

// Update a skill
router.put('/:id', skillsController.updateSkill);

// Delete a skill
router.delete('/:id', skillsController.deleteSkill);

// Create skill certification
router.post('/certifications', skillsController.createSkillCertification);

// Create skill development recommendation
router.post('/recommendations', skillsController.createSkillRecommendation);

module.exports = router;