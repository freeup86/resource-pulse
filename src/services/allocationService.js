import api from './api';

export const updateAllocation = async (resourceId, allocationData) => {
  try {
    const response = await api.put(`/allocations/resource/${resourceId}`, allocationData);
    return response.data;
  } catch (error) {
    console.error(`Error updating allocation for resource ${resourceId}:`, error);
    throw error;
  }
};

export const getResourcesEndingSoon = async (days = 14) => {
  try {
    const response = await api.get(`/allocations/ending-soon?days=${days}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching resources ending soon:', error);
    throw error;
  }
};

export const getResourceMatches = async (projectId = null) => {
  try {
    const url = projectId 
      ? `/allocations/matches?projectId=${projectId}` 
      : '/allocations/matches';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching resource matches:', error);
    throw error;
  }
};