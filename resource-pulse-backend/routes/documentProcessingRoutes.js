/**
 * Document Processing Routes
 * Defines API routes for document processing functionality
 */
const express = require('express');
const router = express.Router();
const documentProcessingController = require('../controllers/documentProcessingController');

// Upload and process resume
router.post(
  '/resume',
  documentProcessingController.uploadMiddleware.resume,
  documentProcessingController.processResume
);

// Upload and process project document
router.post(
  '/project',
  documentProcessingController.uploadMiddleware.project,
  documentProcessingController.processProjectDocument
);

// Extract skills from resume data
router.post('/extract-skills', documentProcessingController.extractSkillsFromResume);

// Extract requirements from project document data
router.post('/extract-requirements', documentProcessingController.extractRequirementsFromProject);

// Get document processing history
router.get('/history', documentProcessingController.getDocumentHistory);

// Get document details by ID
router.get('/documents/:documentId', documentProcessingController.getDocumentById);

module.exports = router;