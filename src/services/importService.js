import api from './api';

export const importResources = async (resources) => {
  try {
    const response = await api.post('/import/resources', { resources });
    return response.data;
  } catch (error) {
    console.error('Error importing resources:', error);
    throw error;
  }
};

export const importProjects = async (projects) => {
  try {
    const response = await api.post('/import/projects', { projects });
    return response.data;
  } catch (error) {
    console.error('Error importing projects:', error);
    throw error;
  }
};

export const importAllocations = async (allocations) => {
  try {
    const response = await api.post('/import/allocations', { allocations });
    return response.data;
  } catch (error) {
    console.error('Error importing allocations:', error);
    throw error;
  }
};