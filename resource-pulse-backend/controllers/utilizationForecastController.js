/**
 * Utilization Forecast Controller
 * Handles API endpoints for utilization forecasting functionality
 */
const utilizationForecastService = require('../services/utilizationForecastService');

/**
 * Generate forecast for the entire organization
 */
const generateOrganizationForecast = async (req, res) => {
  try {
    const options = {
      timeRange: req.query.timeRange || '3months',
      includeAIInsights: req.query.includeAIInsights !== 'false',
      departmentId: req.query.departmentId,
      detectionThreshold: req.query.detectionThreshold ? parseFloat(req.query.detectionThreshold) : 0.85,
      weeklyBreakdown: req.query.weeklyBreakdown === 'true',
    };

    const forecast = await utilizationForecastService.generateOrganizationForecast(options);
    res.json(forecast);
  } catch (error) {
    console.error('Error generating organization forecast:', error);
    res.status(500).json({ error: 'Failed to generate organization forecast', details: error.message });
  }
};

/**
 * Generate forecast for a specific resource
 */
const generateResourceForecast = async (req, res) => {
  try {
    const resourceId = req.params.resourceId;
    const options = {
      timeRange: req.query.timeRange || '3months',
      includeAIInsights: req.query.includeAIInsights !== 'false',
      weeklyBreakdown: req.query.weeklyBreakdown === 'true',
    };

    const forecast = await utilizationForecastService.generateResourceForecast(resourceId, options);
    res.json(forecast);
  } catch (error) {
    console.error(`Error generating resource forecast for resource ${req.params.resourceId}:`, error);
    res.status(500).json({ error: 'Failed to generate resource forecast', details: error.message });
  }
};

/**
 * Detect bottlenecks in the organization's utilization
 */
const detectBottlenecks = async (req, res) => {
  try {
    const options = {
      timeRange: req.query.timeRange || '3months',
      detectionThreshold: req.query.detectionThreshold ? parseFloat(req.query.detectionThreshold) : 0.85,
      departmentId: req.query.departmentId,
      includeResourceDetails: req.query.includeResourceDetails === 'true',
    };

    const bottlenecks = await utilizationForecastService.detectBottlenecks(options);
    res.json(bottlenecks);
  } catch (error) {
    console.error('Error detecting bottlenecks:', error);
    res.status(500).json({ error: 'Failed to detect bottlenecks', details: error.message });
  }
};

/**
 * Predict bench time for resources
 */
const predictBenchTime = async (req, res) => {
  try {
    const options = {
      timeRange: req.query.timeRange || '3months',
      threshold: req.query.threshold ? parseFloat(req.query.threshold) : 0.2,
      departmentId: req.query.departmentId,
    };

    const benchPredictions = await utilizationForecastService.predictBenchTime(options);
    res.json(benchPredictions);
  } catch (error) {
    console.error('Error predicting bench time:', error);
    res.status(500).json({ error: 'Failed to predict bench time', details: error.message });
  }
};

/**
 * Get allocation adjustment suggestions
 */
const getAllocationSuggestions = async (req, res) => {
  try {
    const options = {
      timeRange: req.query.timeRange || '3months',
      resourceId: req.query.resourceId,
      projectId: req.query.projectId,
      optimizationGoal: req.query.optimizationGoal || 'balance', // 'balance', 'maxUtilization', 'minBurnout'
      includeAIInsights: req.query.includeAIInsights !== 'false',
    };

    const suggestions = await utilizationForecastService.generateAllocationSuggestions(options);
    res.json(suggestions);
  } catch (error) {
    console.error('Error generating allocation suggestions:', error);
    res.status(500).json({ error: 'Failed to generate allocation suggestions', details: error.message });
  }
};

module.exports = {
  generateOrganizationForecast,
  generateResourceForecast,
  detectBottlenecks,
  predictBenchTime,
  getAllocationSuggestions
};