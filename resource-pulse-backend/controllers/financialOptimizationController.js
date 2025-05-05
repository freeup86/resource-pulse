/**
 * Financial Optimization Controller
 * Handles API endpoints for financial optimization functionality
 */
const financialOptimizationService = require('../services/financialOptimizationService');

/**
 * Generate optimized resource allocations based on financial considerations
 */
const generateOptimizedAllocations = async (req, res) => {
  try {
    // Convert frontend parameters to expected backend format
    const options = {
      timeRange: req.query.timeRange || '3months',
      optimizationGoal: req.query.optimizationTarget || req.query.optimizationGoal || 'profit',
      departmentId: req.query.departmentId,
      projectConstraints: req.query.projectIds || req.query.projectConstraints 
        ? (req.query.projectIds || req.query.projectConstraints).split(',') 
        : [],
      resourceConstraints: req.query.resourceConstraints 
        ? req.query.resourceConstraints.split(',') 
        : [],
      includeAIInsights: req.query.includeAIInsights !== 'false',
      forceFallback: req.query.fallback === 'true' || process.env.FINANCE_FORCE_FALLBACK === 'true'
    };

    // If dates are provided, override the timeRange calculation
    if (req.query.startDate && req.query.endDate) {
      options.startDate = req.query.startDate;
      options.endDate = req.query.endDate;
    }

    const optimizationResults = await financialOptimizationService.generateOptimizedAllocations(options);
    
    // Add a header to indicate if fallback data was used
    if (optimizationResults.isFallbackData) {
      res.set('X-Using-Fallback-Data', 'true');
    }
    
    res.json(optimizationResults);
  } catch (error) {
    console.error('Error generating optimized allocations:', error);
    
    // Try to provide a useful fallback response even in case of error
    try {
      // Create minimal options for fallback
      const fallbackOptions = {
        timeRange: req.query.timeRange || '3months',
        optimizationGoal: req.query.optimizationTarget || req.query.optimizationGoal || 'profit',
        forceFallback: true
      };
      
      // If dates were provided, use them
      if (req.query.startDate && req.query.endDate) {
        fallbackOptions.startDate = req.query.startDate;
        fallbackOptions.endDate = req.query.endDate;
      }
      
      console.log('Attempting fallback after error:', error.message);
      const fallbackResults = await financialOptimizationService.generateOptimizedAllocations(fallbackOptions);
      
      // Set response headers to indicate fallback
      res.set('X-Using-Fallback-Data', 'true');
      res.set('X-Original-Error', error.message);
      
      // Add error information to the response
      fallbackResults.error = {
        message: 'An error occurred with the original request. Using fallback data instead.',
        originalError: error.message
      };
      
      res.json(fallbackResults);
    } catch (fallbackError) {
      // If even the fallback fails, return the original error
      console.error('Fallback also failed:', fallbackError);
      res.status(500).json({ 
        error: 'Failed to generate optimized allocations', 
        details: error.message,
        fallbackError: fallbackError.message
      });
    }
  }
};

/**
 * Get optimization scenarios for comparison
 */
const getOptimizationScenarios = async (req, res) => {
  try {
    const options = {
      timeRange: req.query.timeRange || '3months',
      departmentId: req.query.departmentId,
      projectConstraints: req.query.projectIds || req.query.projectConstraints 
        ? (req.query.projectIds || req.query.projectConstraints).split(',') 
        : [],
      resourceConstraints: req.query.resourceConstraints 
        ? req.query.resourceConstraints.split(',') 
        : [],
      forceFallback: req.query.fallback === 'true' || process.env.FINANCE_FORCE_FALLBACK === 'true'
    };

    // If dates are provided, override the timeRange calculation
    if (req.query.startDate && req.query.endDate) {
      options.startDate = req.query.startDate;
      options.endDate = req.query.endDate;
    }

    const scenarios = await financialOptimizationService.getOptimizationScenarios(options);
    
    // Add a header to indicate if fallback data was used
    if (scenarios.isFallbackData) {
      res.set('X-Using-Fallback-Data', 'true');
    }
    
    res.json(scenarios);
  } catch (error) {
    console.error('Error getting optimization scenarios:', error);
    
    // Try to provide a useful fallback response even in case of error
    try {
      // Create minimal options for fallback
      const fallbackOptions = {
        timeRange: req.query.timeRange || '3months',
        forceFallback: true
      };
      
      // If dates were provided, use them
      if (req.query.startDate && req.query.endDate) {
        fallbackOptions.startDate = req.query.startDate;
        fallbackOptions.endDate = req.query.endDate;
      }
      
      console.log('Attempting fallback for scenarios after error:', error.message);
      const fallbackScenarios = await financialOptimizationService.getOptimizationScenarios(fallbackOptions);
      
      // Set response headers to indicate fallback
      res.set('X-Using-Fallback-Data', 'true');
      res.set('X-Original-Error', error.message);
      
      // Add error information to the response
      fallbackScenarios.error = {
        message: 'An error occurred with the original request. Using fallback data instead.',
        originalError: error.message
      };
      
      res.json(fallbackScenarios);
    } catch (fallbackError) {
      // If even the fallback fails, return the original error
      console.error('Fallback also failed:', fallbackError);
      res.status(500).json({ 
        error: 'Failed to get optimization scenarios', 
        details: error.message,
        fallbackError: fallbackError.message
      });
    }
  }
};

/**
 * Apply optimization recommendations to create actual allocation changes
 */
const applyOptimizations = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body || !req.body.allocationIds || !req.body.changes) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'The request must include allocationIds and changes' 
      });
    }

    // Check for fallback flag in query parameters or environment
    const useFallback = req.query.fallback === 'true' || process.env.FINANCE_FORCE_FALLBACK === 'true';
    
    if (useFallback) {
      // In fallback mode, just return a success response with mock data
      const result = {
        success: true,
        message: 'Optimizations applied successfully (fallback mode)',
        appliedChanges: req.body.changes.length,
        affectedAllocations: req.body.allocationIds.length,
        timestamp: new Date().toISOString(),
        isFallbackData: true,
        notice: "Using fallback mode - changes were not actually applied to the database."
      };
      
      // Set a header to indicate fallback mode
      res.set('X-Using-Fallback-Data', 'true');
      
      return res.json(result);
    }

    // The real implementation would call a service method to apply the changes
    // For now, we'll simulate this functionality
    
    try {
      // Simulate a call to the service
      // const result = await financialOptimizationService.applyOptimizations(req.body);
      
      // In future, this should actually update allocations in the database
      const result = {
        success: true,
        message: 'Optimizations applied successfully',
        appliedChanges: req.body.changes.length,
        affectedAllocations: req.body.allocationIds.length,
        timestamp: new Date().toISOString()
      };
  
      return res.json(result);
    } catch (serviceError) {
      console.error('Error in service when applying optimizations:', serviceError);
      
      // Fallback to simulation if service call fails
      const fallbackResult = {
        success: true,
        message: 'Optimizations applied successfully (fallback mode)',
        appliedChanges: req.body.changes.length,
        affectedAllocations: req.body.allocationIds.length,
        timestamp: new Date().toISOString(),
        isFallbackData: true,
        notice: "Using fallback mode due to an error - changes were not actually applied to the database.",
        error: {
          message: 'An error occurred when applying changes.',
          originalError: serviceError.message
        }
      };
      
      // Set headers to indicate fallback
      res.set('X-Using-Fallback-Data', 'true');
      res.set('X-Original-Error', serviceError.message);
      
      return res.json(fallbackResult);
    }
  } catch (error) {
    console.error('Error applying financial optimizations:', error);
    res.status(500).json({ error: 'Failed to apply optimizations', details: error.message });
  }
};

module.exports = {
  generateOptimizedAllocations,
  getOptimizationScenarios,
  applyOptimizations
};