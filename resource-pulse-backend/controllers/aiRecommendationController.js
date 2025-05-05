// aiRecommendationController.js
const { generateSkillRecommendations } = require('../services/aiRecommendationService');

/**
 * Generate AI recommendations for a project's required skills
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateRecommendations = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    
    // Extract optional query parameters for personalized recommendations
    const forceRefresh = req.query.forceRefresh === 'true';
    
    // Build user context from query parameters if provided
    const userContext = {};
    
    if (req.query.experienceLevel) {
      userContext.experienceLevel = req.query.experienceLevel;
    }
    
    if (req.query.learningStyle) {
      userContext.learningStyle = req.query.learningStyle;
    }
    
    if (req.query.maxBudget) {
      userContext.budget = parseFloat(req.query.maxBudget);
    }
    
    if (req.query.maxTimeHours) {
      userContext.timeAvailable = parseInt(req.query.maxTimeHours);
    }
    
    // Log generation request with details
    console.log(`Generating recommendations for project ${projectId}`, {
      forceRefresh,
      userContext: Object.keys(userContext).length > 0 ? userContext : 'None'
    });
    
    // Generate recommendations with options
    const options = {
      forceRefresh,
      userContext: Object.keys(userContext).length > 0 ? userContext : undefined
    };
    
    const recommendations = await generateSkillRecommendations(parseInt(projectId), options);
    
    return res.json({
      success: true,
      meta: {
        count: recommendations.length,
        personalized: Object.keys(userContext).length > 0,
        generated: new Date().toISOString()
      },
      recommendations
    });
  } catch (error) {
    console.error('Error in generate recommendations controller:', error);
    
    // Determine appropriate status code
    let statusCode = 500;
    if (error.message && error.message.includes('not found')) {
      statusCode = 404;
    } else if (error.message && error.message.includes('rate limit')) {
      statusCode = 429;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Save an AI-generated recommendation to the database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const saveRecommendation = async (req, res) => {
  try {
    const { projectId } = req.params;
    const recommendation = req.body;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    
    if (!recommendation || !recommendation.skillId) {
      return res.status(400).json({ message: 'Valid recommendation data is required' });
    }
    
    // Validate required fields
    const requiredFields = ['title', 'description'];
    for (const field of requiredFields) {
      if (!recommendation[field]) {
        return res.status(400).json({ 
          message: `Missing required field: ${field}`,
          success: false
        });
      }
    }
    
    // TODO: Implement saving the recommendation to the database
    // For now, we'll just return success
    
    return res.status(201).json({
      success: true,
      message: 'Recommendation saved successfully',
      recommendation: {
        id: Date.now(), // Placeholder ID until database implementation
        projectId: parseInt(projectId),
        ...recommendation,
        saved: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in save recommendation controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save recommendation',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

module.exports = {
  generateRecommendations,
  saveRecommendation
};