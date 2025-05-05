import api from './api';

/**
 * Generate AI recommendations for a project's required skills
 * @param {number} projectId - The project ID to generate recommendations for
 * @param {Object} options - Optional parameters for the recommendation
 * @param {boolean} options.forceRefresh - Force new AI generation even if recommendations exist
 * @param {Object} options.userContext - User context information for personalized recommendations
 * @returns {Promise<Array>} - Array of recommendation objects
 */
export const generateRecommendations = async (projectId, options = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add optional parameters
    if (options.forceRefresh) {
      queryParams.append('forceRefresh', 'true');
    }
    
    // If user context is provided, build relevant query parameters
    if (options.userContext) {
      if (options.userContext.experienceLevel) {
        queryParams.append('experienceLevel', options.userContext.experienceLevel);
      }
      if (options.userContext.preferredLearningStyle) {
        queryParams.append('learningStyle', options.userContext.preferredLearningStyle);
      }
      if (options.userContext.budget) {
        queryParams.append('maxBudget', options.userContext.budget);
      }
      if (options.userContext.timeAvailable) {
        queryParams.append('maxTimeHours', options.userContext.timeAvailable);
      }
    }
    
    // Build the query string
    const queryString = queryParams.toString();
    const url = `/ai/projects/${projectId}/recommendations${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    
    // Process the response to ensure all recommendations have the necessary fields
    const recommendations = response.data.recommendations || [];
    
    // Add category information if missing
    return recommendations.map(rec => {
      // Extract category from skill name or use the one provided
      let category = rec.category || 
                    (rec.skillName && rec.skillName.includes('Programming') ? 'Programming' : 
                     rec.skillName && rec.skillName.includes('Design') ? 'Design' :
                     rec.skillName && rec.skillName.includes('Data') ? 'Data' :
                     rec.skillName && rec.skillName.includes('Management') ? 'Management' : 'General');
      
      return {
        ...rec,
        category,
        // Ensure these fields exist
        estimatedTimeHours: rec.estimatedTimeHours || 0,
        cost: rec.cost || 0,
        resourceUrl: rec.resourceUrl || '',
      };
    });
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    // Provide more helpful error information
    if (error.response && error.response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few minutes.');
    }
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
    // Ensure the recommendation has all required fields
    const recommendationToSave = {
      skillId: recommendation.skillId,
      title: recommendation.title,
      description: recommendation.description,
      resourceUrl: recommendation.resourceUrl || '',
      estimatedTimeHours: recommendation.estimatedTimeHours || 0,
      cost: recommendation.cost || 0,
      aiGenerated: true
    };
    
    const response = await api.post(`/projects/${projectId}/skill-recommendations`, recommendationToSave);
    return response.data;
  } catch (error) {
    console.error('Error saving recommendation:', error);
    // Provide more helpful error information
    if (error.response && error.response.status === 400) {
      throw new Error(error.response.data.message || 'Invalid recommendation data. Please try again.');
    }
    throw error;
  }
};

/**
 * Get saved recommendations for a project
 * @param {number} projectId - The project ID
 * @returns {Promise<Array>} - Array of saved recommendation objects
 */
export const getProjectRecommendations = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/skill-recommendations`);
    return response.data.recommendations || [];
  } catch (error) {
    console.error('Error fetching project recommendations:', error);
    throw error;
  }
};

/**
 * Delete a saved skill recommendation
 * @param {number} recommendationId - The ID of the recommendation to delete
 * @returns {Promise<Object>} - The response object
 */
export const deleteRecommendation = async (recommendationId) => {
  try {
    const response = await api.delete(`/skill-recommendations/${recommendationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    throw error;
  }
};