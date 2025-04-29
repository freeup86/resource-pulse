import api from './api';

export const getProjects = async () => {
  try {
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const getProject = async (id) => {
  try {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    throw error;
  }
};

export const createProject = async (projectData) => {
  try {
    const response = await api.post('/projects', projectData);
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const updateProject = async (id, projectData) => {
  try {
    console.log('projectService: Updating project with ID:', id);
    console.log('projectService: Data being sent:', JSON.stringify(projectData, null, 2));
    
    // Make sure requiredRoles are properly formatted
    if (projectData.requiredRoles) {
      console.log('projectService: Required roles:', projectData.requiredRoles);
      
      // Confirm all roleId and count values are numbers
      projectData.requiredRoles = projectData.requiredRoles.map(role => ({
        roleId: parseInt(role.roleId),
        count: parseInt(role.count) || 1
      }));
    }
    
    const response = await api.put(`/projects/${id}`, projectData);
    console.log('projectService: Update successful, response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    
    // Log more details about the error
    if (error.response) {
      console.error('projectService: Error response data:', error.response.data);
      console.error('projectService: Error response status:', error.response.status);
    } else if (error.request) {
      console.error('projectService: No response received:', error.request);
    } else {
      console.error('projectService: Error message:', error.message);
    }
    
    throw error;
  }
};

export const deleteProject = async (id) => {
  try {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    throw error;
  }
};