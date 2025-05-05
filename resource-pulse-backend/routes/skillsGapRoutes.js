/**
 * Skills Gap Routes
 * Defines API routes for skills gap analysis functionality
 */
const express = require('express');
const router = express.Router();
const skillsGapController = require('../controllers/skillsGapController');

// Analyze organization-wide skills gap
router.get('/organization', skillsGapController.analyzeOrganizationSkillsGap);

// Analyze department-specific skills gap
router.get('/departments/:departmentId', skillsGapController.analyzeDepartmentSkillsGap);

// Analyze resource-specific skills gap
router.get('/resources/:resourceId', skillsGapController.analyzeResourceSkillsGap);

// Get all departments gap analysis summary
router.get('/departments', skillsGapController.getAllDepartmentsGapAnalysis);

// Get overall skills gap analysis (for the frontend)
router.get('/analysis', skillsGapController.getSkillsGapAnalysis);

// Get training recommendations
router.get('/training-recommendations', skillsGapController.getTrainingRecommendations);

// Get hiring recommendations
router.get('/hiring-recommendations', skillsGapController.getHiringRecommendations);

module.exports = router;