import api from './api';

export const updateAllocation = async (resourceId, allocationData) => {
  try {
    console.log('Updating allocation:', {
      resourceId,
      allocationData
    });

    // If projectId is null, use a special remove method
    if (allocationData.projectId === null) {
      const response = await api.post('/allocations/remove', { 
        resourceId, 
        allocationId: allocationData.id 
      });
      
      console.log('Allocation removal response:', response.data);
      return response.data;
    }

    const response = await api.put(`/allocations/resource/${resourceId}`, allocationData);
    
    console.log('Allocation update response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error(`Error updating allocation for resource ${resourceId}:`, error);
    
    // Log more detailed error information
    if (error.response) {
      console.error('Error response:', {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers
      });
    }
    
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