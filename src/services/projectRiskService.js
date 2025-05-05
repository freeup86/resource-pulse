// src/services/projectRiskService.js
import api from './api';

/**
 * Get risk analysis for all projects
 * @param {Object} params - Optional query parameters
 * @returns {Promise<Array>} - Array of project risk assessments
 */
export const getAllProjectRisks = async (params = {}) => {
  try {
    const response = await api.get('/risk/projects', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching project risks:', error);
    throw error;
  }
};

/**
 * Get risk analysis for a specific project
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} - Project risk assessment details
 */
export const getProjectRisk = async (projectId) => {
  try {
    const response = await api.get(`/risk/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching risk for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Get risk factors breakdown for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} - Breakdown of risk factors
 */
export const getRiskFactors = async (projectId) => {
  try {
    const response = await api.get(`/risk/projects/${projectId}/factors`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching risk factors for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Get risk mitigation recommendations for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} - Array of mitigation recommendations
 */
export const getRiskMitigations = async (projectId) => {
  try {
    const response = await api.get(`/risk/projects/${projectId}/mitigations`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching risk mitigations for project ${projectId}:`, error);
    throw error;
  }
};