import axios from 'axios';

const API_URL = '/api/parents';

/**
 * Fetches all parents with optional filtering
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise} Promise object with parent data
 */
export const getParents = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching parents:', error);
    throw error;
  }
};

/**
 * Fetches a specific parent by ID
 * @param {string} id - Parent ID
 * @returns {Promise} Promise object with parent data
 */
export const getParentById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching parent ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new parent
 * @param {Object} parentData - Parent data object
 * @returns {Promise} Promise object with created parent data
 */
export const createParent = async (parentData) => {
  try {
    const response = await axios.post(API_URL, parentData);
    return response.data;
  } catch (error) {
    console.error('Error creating parent:', error);
    throw error;
  }
};

/**
 * Updates an existing parent
 * @param {string} id - Parent ID
 * @param {Object} parentData - Updated parent data
 * @returns {Promise} Promise object with updated parent data
 */
export const updateParent = async (id, parentData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, parentData);
    return response.data;
  } catch (error) {
    console.error(`Error updating parent ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a parent
 * @param {string} id - Parent ID
 * @returns {Promise} Promise object with deletion status
 */
export const deleteParent = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting parent ${id}:`, error);
    throw error;
  }
};

/**
 * Get payment history for a parent
 * @param {string} id - Parent ID
 * @returns {Promise} Promise object with payment history data
 */
export const getPaymentHistory = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/payments`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching payment history for parent ${id}:`, error);
    throw error;
  }
};

/**
 * Add communication log entry for a parent
 * @param {string} id - Parent ID
 * @param {Object} logData - Communication log data
 * @returns {Promise} Promise object with updated communication log
 */
export const addCommunicationLog = async (id, logData) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/communication`, logData);
    return response.data;
  } catch (error) {
    console.error(`Error adding communication log for parent ${id}:`, error);
    throw error;
  }
};

/**
 * Get linked students for a parent
 * @param {string} id - Parent ID
 * @returns {Promise} Promise object with linked students data
 */
export const getLinkedStudents = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/students`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching linked students for parent ${id}:`, error);
    throw error;
  }
};

/**
 * Link a student to a parent
 * @param {string} parentId - Parent ID
 * @param {string} studentId - Student ID
 * @returns {Promise} Promise object with updated linked students
 */
export const linkStudent = async (parentId, studentId) => {
  try {
    const response = await axios.post(`${API_URL}/${parentId}/students`, { studentId });
    return response.data;
  } catch (error) {
    console.error(`Error linking student ${studentId} to parent ${parentId}:`, error);
    throw error;
  }
};