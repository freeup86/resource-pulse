// src/services/utilizationForecastService.js
import api from './api';

/**
 * Get utilization forecast
 * @param {Object} params - Parameters for forecast
 * @param {string} params.startDate - Start date in ISO format
 * @param {string} params.endDate - End date in ISO format
 * @param {number[]} [params.resourceIds] - Optional array of resource IDs to include
 * @param {number[]} [params.projectIds] - Optional array of project IDs to include
 * @param {number[]} [params.departmentIds] - Optional array of department IDs to include
 * @returns {Promise<Object>} - Forecast data
 */
export const getUtilizationForecast = async (params = {}) => {
  try {
    const response = await api.get('/forecast/utilization', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching utilization forecast:', error);
    throw error;
  }
};

/**
 * Get bottleneck detection
 * @param {Object} params - Parameters for bottleneck detection
 * @param {string} params.startDate - Start date in ISO format
 * @param {string} params.endDate - End date in ISO format
 * @param {number} [params.threshold=90] - Utilization threshold percentage
 * @returns {Promise<Object>} - Bottleneck data
 */
export const getBottleneckDetection = async (params = {}) => {
  try {
    const response = await api.get('/forecast/bottlenecks', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching bottleneck detection:', error);
    throw error;
  }
};

/**
 * Get workload balancing recommendations
 * @param {Object} params - Parameters for workload balancing
 * @param {string} params.startDate - Start date in ISO format
 * @param {string} params.endDate - End date in ISO format
 * @param {number[]} [params.resourceIds] - Optional array of resource IDs to balance
 * @returns {Promise<Object>} - Workload balancing recommendations
 */
export const getWorkloadBalancing = async (params = {}) => {
  try {
    const response = await api.get('/forecast/workload-balancing', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching workload balancing:', error);
    throw error;
  }
};