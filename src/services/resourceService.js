import api from './api';

export const getResources = async () => {
  try {
    const response = await api.get('/resources');
    return response.data;
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};

export const getResource = async (id) => {
  try {
    const response = await api.get(`/resources/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching resource ${id}:`, error);
    throw error;
  }
};

export const createResource = async (resourceData) => {
  try {
    const response = await api.post('/resources', resourceData);
    return response.data;
  } catch (error) {
    console.error('Error creating resource:', error);
    throw error;
  }
};

export const updateResource = async (id, resourceData) => {
  try {
    const response = await api.put(`/resources/${id}`, resourceData);
    return response.data;
  } catch (error) {
    console.error(`Error updating resource ${id}:`, error);
    throw error;
  }
};

export const deleteResource = async (id) => {
  try {
    const response = await api.delete(`/resources/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting resource ${id}:`, error);
    throw error;
  }
};

// New bulk operation endpoints
export const bulkUpdateResources = async (resourcesData) => {
  try {
    const response = await api.post('/resources/bulk-update', { resources: resourcesData });
    return response.data;
  } catch (error) {
    console.error('Error performing bulk update on resources:', error);
    throw error;
  }
};

export const bulkDeleteResources = async (resourceIds) => {
  try {
    const response = await api.post('/resources/bulk-delete', { ids: resourceIds });
    return response.data;
  } catch (error) {
    console.error('Error performing bulk delete on resources:', error);
    throw error;
  }
};

export const bulkAddSkills = async (resourceIds, skills) => {
  try {
    const response = await api.post('/resources/bulk-add-skills', {
      resourceIds,
      skills
    });
    return response.data;
  } catch (error) {
    console.error('Error adding skills to multiple resources:', error);
    throw error;
  }
};

export const bulkUpdateUtilization = async (resourceIds, utilizationPercentage) => {
  try {
    const response = await api.post('/resources/bulk-update-utilization', {
      resourceIds,
      utilizationPercentage
    });
    return response.data;
  } catch (error) {
    console.error('Error updating utilization for multiple resources:', error);
    throw error;
  }
};