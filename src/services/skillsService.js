import api from './api';

// Get all skills
export const getSkills = async () => {
  try {
    const response = await api.get('/skills');
    return response.data;
  } catch (error) {
    console.error('Error fetching skills:', error);
    throw error;
  }
};

// Get a single skill by ID
export const getSkill = async (id) => {
  try {
    const response = await api.get(`/skills/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching skill ${id}:`, error);
    throw error;
  }
};

// Create a new skill
export const createSkill = async (skillData) => {
  try {
    const response = await api.post('/skills', skillData);
    return response.data;
  } catch (error) {
    console.error('Error creating skill:', error);
    throw error;
  }
};

// Update a skill
export const updateSkill = async (id, skillData) => {
  try {
    const response = await api.put(`/skills/${id}`, skillData);
    return response.data;
  } catch (error) {
    console.error(`Error updating skill ${id}:`, error);
    throw error;
  }
};

// Delete a skill
export const deleteSkill = async (id) => {
  try {
    const response = await api.delete(`/skills/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting skill ${id}:`, error);
    throw error;
  }
};

// Get skill categories
export const getSkillCategories = async () => {
  try {
    const response = await api.get('/skills/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching skill categories:', error);
    throw error;
  }
};

// Get skill proficiency levels
export const getSkillProficiencyLevels = async () => {
  try {
    const response = await api.get('/skills/proficiency-levels');
    return response.data;
  } catch (error) {
    console.error('Error fetching skill proficiency levels:', error);
    throw error;
  }
};

// Get skills gap analysis
export const getSkillsGapAnalysis = async () => {
  try {
    const response = await api.get('/skills/gap-analysis');
    return response.data;
  } catch (error) {
    console.error('Error fetching skills gap analysis:', error);
    throw error;
  }
};

// Create skill certification
export const createSkillCertification = async (certificationData) => {
  try {
    const response = await api.post('/skills/certifications', certificationData);
    return response.data;
  } catch (error) {
    console.error('Error creating skill certification:', error);
    throw error;
  }
};

// Create skill development recommendation
export const createSkillRecommendation = async (recommendationData) => {
  try {
    const response = await api.post('/skills/recommendations', recommendationData);
    return response.data;
  } catch (error) {
    console.error('Error creating skill recommendation:', error);
    throw error;
  }
};