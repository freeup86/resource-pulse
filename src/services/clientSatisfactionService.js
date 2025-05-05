// src/services/clientSatisfactionService.js
import api from './api';

/**
 * Get client satisfaction predictions for all projects
 * @param {Object} params - Optional query parameters
 * @returns {Promise<Array>} - Array of client satisfaction predictions
 */
export const getAllClientSatisfactionPredictions = async (params = {}) => {
  try {
    const response = await api.get('/satisfaction/predictions', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching client satisfaction predictions:', error);
    throw error;
  }
};

/**
 * Get client satisfaction prediction for a specific project
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} - Client satisfaction prediction details
 */
export const getProjectSatisfactionPrediction = async (projectId) => {
  try {
    const response = await api.get(`/satisfaction/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching satisfaction prediction for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Get client satisfaction prediction factors for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} - Breakdown of prediction factors
 */
export const getSatisfactionFactors = async (projectId) => {
  try {
    const response = await api.get(`/satisfaction/projects/${projectId}/factors`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching satisfaction factors for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Get resource-client pairing recommendations
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} - Array of resource pairing recommendations
 */
export const getResourcePairingRecommendations = async (projectId) => {
  try {
    const response = await api.get(`/satisfaction/projects/${projectId}/pairings`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching resource pairing recommendations for project ${projectId}:`, error);
    throw error;
  }
};