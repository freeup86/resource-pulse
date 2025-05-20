// src/services/financialOptimizationService.js
import api from './api';

/**
 * Get financial optimization recommendations
 * @param {Object} params - Parameters for optimization
 * @param {string} params.startDate - Start date in ISO format
 * @param {string} params.endDate - End date in ISO format
 * @param {number[]} [params.projectIds] - Optional array of project IDs to optimize
 * @param {string} [params.optimizationTarget='profit'] - Optimization target ('profit', 'revenue', 'cost')
 * @returns {Promise<Object>} - Optimization recommendations
 */
export const getOptimizationRecommendations = async (params = {}) => {
  try {
    const response = await api.get('/financial/optimization', { params });
    
    // Ensure the response has the expected structure
    const responseData = response.data || {};
    
    // Make sure recommendations is always an array
    if (!responseData.recommendations || !Array.isArray(responseData.recommendations)) {
      responseData.recommendations = [];
    }
    
    // Ensure other properties have default values
    return {
      recommendations: responseData.recommendations,
      optimizationGoal: responseData.optimizationGoal || 'profit',
      financialImpact: responseData.financialImpact || {
        revenueChange: 0,
        costChange: 0,
        profitChange: 0
      },
      dateRange: responseData.dateRange || {
        startDate: params.startDate,
        endDate: params.endDate
      },
      aiInsights: responseData.aiInsights || null,
      isFallbackData: responseData.isFallbackData || false,
      notice: responseData.notice || null
    };
  } catch (error) {
    console.error('Error fetching financial optimization recommendations:', error);
    
    // Return a valid default structure in case of error
    return {
      recommendations: [],
      optimizationGoal: params.optimizationTarget || 'profit',
      financialImpact: {
        revenueChange: 0,
        costChange: 0,
        profitChange: 0
      },
      dateRange: {
        startDate: params.startDate,
        endDate: params.endDate
      },
      error: error.message || 'Failed to fetch optimization data'
    };
  }
};

/**
 * Get cost vs revenue analysis
 * @param {Object} params - Parameters for analysis
 * @param {string} params.startDate - Start date in ISO format
 * @param {string} params.endDate - End date in ISO format
 * @param {number[]} [params.projectIds] - Optional array of project IDs to analyze
 * @returns {Promise<Object>} - Cost vs revenue analysis
 */
export const getCostRevenueAnalysis = async (params = {}) => {
  try {
    // Add cache buster to ensure fresh data
    const paramsWithCacheBuster = {
      ...params,
      _t: Date.now()
    };
    console.log('Calling cost-revenue API with params:', paramsWithCacheBuster);
    const response = await api.get('/financial/cost-revenue', { params: paramsWithCacheBuster });
    
    // Log the response for debugging
    console.log('Cost-revenue API response:', response.data);
    
    // Ensure the response has the expected structure
    const responseData = response.data || {};
    
    // Make sure projects is always an array
    if (!responseData.projects || !Array.isArray(responseData.projects)) {
      responseData.projects = [];
    }
    
    // Make sure summary exists
    if (!responseData.summary) {
      responseData.summary = {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        profitMargin: 0,
        revenueTrend: 0,
        costTrend: 0,
        profitTrend: 0,
        marginTrend: 0
      };
    }
    
    // Make sure timeSeries exists with empty arrays for each timeframe
    if (!responseData.timeSeries) {
      responseData.timeSeries = {
        monthly: [],
        quarterly: [],
        yearly: []
      };
    } else {
      // Ensure each timeframe exists
      if (!responseData.timeSeries.monthly) responseData.timeSeries.monthly = [];
      if (!responseData.timeSeries.quarterly) responseData.timeSeries.quarterly = [];
      if (!responseData.timeSeries.yearly) responseData.timeSeries.yearly = [];
    }
    
    return responseData;
  } catch (error) {
    console.error('Error fetching cost vs revenue analysis:', error);
    
    // Return a valid default structure in case of error
    return {
      projects: [],
      summary: {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        profitMargin: 0,
        revenueTrend: 0,
        costTrend: 0,
        profitTrend: 0,
        marginTrend: 0
      },
      timeSeries: {
        monthly: [],
        quarterly: [],
        yearly: []
      },
      error: error.message || 'Failed to fetch financial data'
    };
  }
};

/**
 * Apply optimization recommendations
 * @param {Object} optimizationData - Optimization data to apply
 * @param {number[]} optimizationData.allocationIds - Array of allocation IDs to modify
 * @param {Object[]} optimizationData.changes - Array of changes to make
 * @returns {Promise<Object>} - Result of applying optimizations
 */
export const applyOptimizations = async (optimizationData) => {
  try {
    const response = await api.post('/financial/optimization/apply', optimizationData);
    return response.data;
  } catch (error) {
    console.error('Error applying financial optimizations:', error);
    throw error;
  }
};