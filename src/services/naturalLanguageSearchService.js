// src/services/naturalLanguageSearchService.js
import api from './api';

/**
 * Perform a natural language search
 * @param {string} query - Natural language query
 * @param {Object} params - Optional parameters
 * @param {string[]} [params.entityTypes] - Array of entity types to search (e.g., ['resources', 'projects'])
 * @param {number} [params.limit=10] - Maximum number of results to return
 * @returns {Promise<Object>} - Search results
 */
export const search = async (query, params = {}) => {
  try {
    console.log('Search params received:', params);
    
    // Create request config with params object approach instead of URL string
    const requestConfig = {
      params: {
        q: query
      }
    };
    
    // Add limit if present
    if (params.limit) {
      requestConfig.params.limit = params.limit;
    }
    
    // Handle array parameters properly
    if (params.entityTypes && Array.isArray(params.entityTypes)) {
      // Use comma-separated string for entityTypes parameter
      requestConfig.params.types = params.entityTypes.join(',');
    }
    
    // Handle useAI parameter if present
    if (params.useAI !== undefined) {
      requestConfig.params.useAI = params.useAI;
    }
    
    // Always enable fallback mode for now until database issues are resolved
    requestConfig.params.fallback = true;
    
    console.log('Sending search request with config:', requestConfig);
    
    // Make the request with properly formatted parameters
    const response = await api.get('/search', requestConfig);
    
    // Log the entire response for debugging
    console.log('Response from search API:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error performing natural language search:', error);
    
    // Add more detailed error reporting
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    throw error;
  }
};

/**
 * Get suggested search queries
 * @param {string} partialQuery - Partial query string 
 * @returns {Promise<Array>} - Array of suggested queries
 */
export const getSuggestions = async (partialQuery) => {
  try {
    const response = await api.get('/search/suggestions', { 
      params: { q: partialQuery }  // Changed parameter name from 'query' to 'q' to match backend controller
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    throw error;
  }
};

/**
 * Get recent search queries
 * @param {number} [limit=5] - Maximum number of recent searches to return
 * @returns {Promise<Array>} - Array of recent search queries
 */
export const getRecentSearches = async (limit = 5) => {
  try {
    const response = await api.get('/search/recent', { 
      params: { limit } 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent searches:', error);
    throw error;
  }
};