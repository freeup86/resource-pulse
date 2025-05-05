/**
 * Document Processing Controller
 * Handles API endpoints for document processing functionality
 */
const documentProcessingService = require('../services/documentProcessingService');

/**
 * Handle resume document upload and processing
 */
const processResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please upload a resume document' 
      });
    }
    
    // Process the resume
    const options = {
      extractSkills: req.body.extractSkills !== 'false',
      resourceId: req.body.resourceId || null
    };
    
    const result = await documentProcessingService.processResume(req.file, options);
    
    // If a resource ID was provided, extract and save skills
    if (options.extractSkills && options.resourceId && result.resumeData) {
      try {
        const skills = await documentProcessingService.extractSkillsFromResume(
          result.resumeData,
          options.resourceId
        );
        
        result.extractedSkills = skills;
      } catch (skillError) {
        console.error('Error extracting skills from resume:', skillError);
        result.skillExtractionError = skillError.message;
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({ 
      error: 'Resume processing failed',
      message: error.message
    });
  }
};

/**
 * Handle project document upload and processing
 */
const processProjectDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please upload a project document' 
      });
    }
    
    // Process the project document
    const options = {
      extractRequirements: req.body.extractRequirements !== 'false',
      projectId: req.body.projectId || null
    };
    
    const result = await documentProcessingService.processProjectDocument(req.file, options);
    
    // If a project ID was provided, extract and save requirements
    if (options.extractRequirements && options.projectId && result.projectData) {
      try {
        const requirements = await documentProcessingService.extractRequirementsFromProject(
          result.projectData,
          options.projectId
        );
        
        result.extractedRequirements = requirements;
      } catch (reqError) {
        console.error('Error extracting requirements from project document:', reqError);
        result.requirementExtractionError = reqError.message;
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error processing project document:', error);
    res.status(500).json({ 
      error: 'Project document processing failed',
      message: error.message
    });
  }
};

/**
 * Extract skills from resume data
 */
const extractSkillsFromResume = async (req, res) => {
  try {
    const { resumeData, resourceId } = req.body;
    
    if (!resumeData) {
      return res.status(400).json({ 
        error: 'Missing resume data',
        message: 'Resume data is required' 
      });
    }
    
    const skills = await documentProcessingService.extractSkillsFromResume(resumeData, resourceId);
    
    res.json({
      skills,
      count: skills.length,
      matchedCount: skills.filter(s => s.matched).length,
      extractedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error extracting skills from resume:', error);
    res.status(500).json({ 
      error: 'Skill extraction failed',
      message: error.message
    });
  }
};

/**
 * Extract requirements from project document data
 */
const extractRequirementsFromProject = async (req, res) => {
  try {
    const { projectData, projectId } = req.body;
    
    if (!projectData) {
      return res.status(400).json({ 
        error: 'Missing project data',
        message: 'Project data is required' 
      });
    }
    
    const requirements = await documentProcessingService.extractRequirementsFromProject(projectData, projectId);
    
    res.json({
      requirements,
      count: requirements.length,
      matchedCount: requirements.filter(r => r.matched).length,
      extractedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error extracting requirements from project:', error);
    res.status(500).json({ 
      error: 'Requirement extraction failed',
      message: error.message
    });
  }
};

/**
 * Get document processing history
 */
const getDocumentHistory = async (req, res) => {
  try {
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
      documentType: req.query.documentType,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const history = await documentProcessingService.getDocumentHistory(options);
    
    res.json({
      history,
      count: history.length,
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting document history:', error);
    res.status(500).json({ 
      error: 'Failed to get document history',
      message: error.message
    });
  }
};

/**
 * Get document details by ID
 */
const getDocumentById = async (req, res) => {
  try {
    const documentId = req.params.documentId;
    
    if (!documentId) {
      return res.status(400).json({ 
        error: 'Missing document ID',
        message: 'Document ID is required' 
      });
    }
    
    const document = await documentProcessingService.getDocumentById(documentId);
    
    res.json(document);
  } catch (error) {
    console.error(`Error getting document ${req.params.documentId}:`, error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: 'Failed to get document',
      message: error.message
    });
  }
};

/**
 * Upload middleware configuration
 */
const uploadMiddleware = {
  resume: documentProcessingService.upload.single('resume'),
  project: documentProcessingService.upload.single('project')
};

module.exports = {
  processResume,
  processProjectDocument,
  extractSkillsFromResume,
  extractRequirementsFromProject,
  getDocumentHistory,
  getDocumentById,
  uploadMiddleware
};