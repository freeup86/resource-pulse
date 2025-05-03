import api from './api';

/**
 * Generate AI recommendations for a project's required skills
 * @param {number} projectId - The project ID to generate recommendations for
 * @returns {Promise<Array>} - Array of recommendation objects
 */
export const generateRecommendations = async (projectId) => {
  try {
    const response = await api.get(`/ai/projects/${projectId}/recommendations`);
    return response.data.recommendations;
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    throw error;
  }
};

/**
 * Save an AI-generated recommendation to the database
 * @param {number} projectId - The project ID
 * @param {Object} recommendation - The recommendation object to save
 * @returns {Promise<Object>} - The saved recommendation
 */
export const saveRecommendation = async (projectId, recommendation) => {
  try {
    const response = await api.post(`/projects/${projectId}/skill-recommendations`, recommendation);
    return response.data;
  } catch (error) {
    console.error('Error saving recommendation:', error);
    throw error;
  }
};