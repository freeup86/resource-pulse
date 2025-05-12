import axios from 'axios';

const API_URL = '/api/instructors';

/**
 * Fetches all instructors with optional filtering
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise} Promise object with instructor data
 */
export const getInstructors = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching instructors:', error);
    throw error;
  }
};

/**
 * Fetches a specific instructor by ID
 * @param {string} id - Instructor ID
 * @returns {Promise} Promise object with instructor data
 */
export const getInstructorById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching instructor ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new instructor
 * @param {Object} instructorData - Instructor data object
 * @returns {Promise} Promise object with created instructor data
 */
export const createInstructor = async (instructorData) => {
  try {
    const response = await axios.post(API_URL, instructorData);
    return response.data;
  } catch (error) {
    console.error('Error creating instructor:', error);
    throw error;
  }
};

/**
 * Updates an existing instructor
 * @param {string} id - Instructor ID
 * @param {Object} instructorData - Updated instructor data
 * @returns {Promise} Promise object with updated instructor data
 */
export const updateInstructor = async (id, instructorData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, instructorData);
    return response.data;
  } catch (error) {
    console.error(`Error updating instructor ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes an instructor
 * @param {string} id - Instructor ID
 * @returns {Promise} Promise object with deletion status
 */
export const deleteInstructor = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting instructor ${id}:`, error);
    throw error;
  }
};

/**
 * Get instructor's teaching schedule
 * @param {string} id - Instructor ID
 * @param {Object} params - Query parameters (e.g., date range)
 * @returns {Promise} Promise object with schedule data
 */
export const getInstructorSchedule = async (id, params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/schedule`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching schedule for instructor ${id}:`, error);
    throw error;
  }
};

/**
 * Update instructor availability
 * @param {string} id - Instructor ID
 * @param {Object} availabilityData - Availability data
 * @returns {Promise} Promise object with updated availability
 */
export const updateAvailability = async (id, availabilityData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}/availability`, availabilityData);
    return response.data;
  } catch (error) {
    console.error(`Error updating availability for instructor ${id}:`, error);
    throw error;
  }
};

/**
 * Add certification for an instructor
 * @param {string} id - Instructor ID
 * @param {Object} certificationData - Certification data
 * @returns {Promise} Promise object with updated certifications
 */
export const addCertification = async (id, certificationData) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/certifications`, certificationData);
    return response.data;
  } catch (error) {
    console.error(`Error adding certification for instructor ${id}:`, error);
    throw error;
  }
};

/**
 * Get courses an instructor can teach
 * @param {string} id - Instructor ID
 * @returns {Promise} Promise object with courses data
 */
export const getTeachableCourses = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/courses`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching teachable courses for instructor ${id}:`, error);
    throw error;
  }
};

/**
 * Add a skill to an instructor
 * @param {string} id - Instructor ID
 * @param {Object} skillData - Skill data
 * @returns {Promise} Promise object with updated skills
 */
export const addSkill = async (id, skillData) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/skills`, skillData);
    return response.data;
  } catch (error) {
    console.error(`Error adding skill for instructor ${id}:`, error);
    throw error;
  }
};