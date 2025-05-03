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
    
    console.log(`Generating recommendations for project ${projectId}`);
    const recommendations = await generateSkillRecommendations(parseInt(projectId));
    
    return res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Error in generate recommendations controller:', error);
    return res.status(500).json({
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
    
    // TODO: Implement saving the recommendation to the database
    // For now, we'll just return success
    
    return res.json({
      success: true,
      message: 'Recommendation saved successfully',
      recommendation
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