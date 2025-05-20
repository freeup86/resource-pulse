// Direct API calls without using the regular api instance
// Use this for critical operations where we need to bypass interceptors

import axios from 'axios';
import { API_URL } from '../constants';

/**
 * Makes a direct API request without using the regular api instance
 * 
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} options.endpoint - API endpoint (e.g., '/auth/profile')
 * @param {Object} [options.data] - Request data (for POST, PUT)
 * @param {Object} [options.params] - URL parameters
 * @param {string} [options.token] - Authentication token
 * @returns {Promise<any>} - Response data
 */
export const makeDirectRequest = async ({ 
  method = 'GET', 
  endpoint, 
  data = null, 
  params = {}, 
  token = null 
}) => {
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const requestParams = { 
      ...params, 
      _t: timestamp 
    };
    
    // Build headers
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    // Add authorization if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Make the request
    const response = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      headers,
      params: requestParams,
      data,
      timeout: 30000 // 30 seconds timeout
    });
    
    return response.data;
  } catch (error) {
    // Enhanced error logging
    console.error(`Direct API ${method} request to ${endpoint} failed:`, error);
    
    if (error.response) {
      console.error('Server response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    
    throw error;
  }
};

/**
 * Get user profile directly
 * 
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - User profile
 */
export const getProfileDirect = async (token) => {
  return makeDirectRequest({
    method: 'GET',
    endpoint: '/auth/profile',
    token
  });
};

/**
 * Refresh token directly
 * 
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} - New token data
 */
export const refreshTokenDirect = async (refreshToken) => {
  return makeDirectRequest({
    method: 'POST',
    endpoint: '/auth/refresh-token',
    data: { refreshToken }
  });
};

export default {
  makeDirectRequest,
  getProfileDirect,
  refreshTokenDirect
};