// matchingController.js
const matchingService = require('../services/matchingService');

/**
 * Find best resource matches for a project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const findResourcesForProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    // Validate projectId
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }
    
    // Call matching service
    const matches = await matchingService.findResourcesForProject(
      parseInt(projectId),
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit ? parseInt(limit) : 10
    );
    
    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error finding resources for project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find matching resources',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Find best project matches for a resource
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const findProjectsForResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    // Validate resourceId
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Resource ID is required'
      });
    }
    
    // Call matching service
    const matches = await matchingService.findProjectsForResource(
      parseInt(resourceId),
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit ? parseInt(limit) : 10
    );
    
    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error finding projects for resource:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find matching projects',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Calculate match score between a resource and project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMatchScore = async (req, res) => {
  try {
    const { resourceId, projectId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Validate IDs
    if (!resourceId || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Resource ID and Project ID are required'
      });
    }
    
    // Call matching service
    const match = await matchingService.getSingleMatchScore(
      parseInt(resourceId),
      parseInt(projectId),
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    
    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error('Error calculating match score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate match score',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Find the best matches based on parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const findBestMatches = async (req, res) => {
  try {
    const { projectId, resourceId, startDate, endDate, limit } = req.query;
    
    // Validate at least one ID
    if (!projectId && !resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Either Project ID or Resource ID is required'
      });
    }
    
    // Call matching service
    const matches = await matchingService.findBestMatches({
      projectId: projectId ? parseInt(projectId) : undefined,
      resourceId: resourceId ? parseInt(resourceId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : 10
    });
    
    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error finding best matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find best matches',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Get resource allocations with filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getResourceAllocations = async (req, res) => {
  try {
    const { resourceId, projectId, startDate, endDate, status } = req.query;
    
    // Call matching service
    const allocations = await matchingService.getResourceAllocations({
      resourceId: resourceId ? parseInt(resourceId) : undefined,
      projectId: projectId ? parseInt(projectId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status
    });
    
    res.json({
      success: true,
      data: allocations
    });
  } catch (error) {
    console.error('Error getting resource allocations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get resource allocations',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

module.exports = {
  findResourcesForProject,
  findProjectsForResource,
  getMatchScore,
  findBestMatches,
  getResourceAllocations
};