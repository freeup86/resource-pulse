// telemetryController.js
const aiTelemetry = require('../services/aiTelemetry');

/**
 * Get AI API usage statistics (Claude)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAIStatistics = (req, res) => {
  try {
    const stats = aiTelemetry.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting AI telemetry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI usage statistics',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

module.exports = {
  getAIStatistics
};