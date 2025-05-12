import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Get all schools
export const getSchools = async () => {
  try {
    const response = await axios.get(`${API_URL}/schools`);
    return response.data;
  } catch (error) {
    console.error('Error fetching schools:', error);
    throw error;
  }
};

// Get a school by ID
export const getSchoolById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/schools/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching school with ID ${id}:`, error);
    throw error;
  }
};

// Create a new school
export const createSchool = async (schoolData) => {
  try {
    const response = await axios.post(`${API_URL}/schools`, schoolData);
    return response.data;
  } catch (error) {
    console.error('Error creating school:', error);
    throw error;
  }
};

// Update a school
export const updateSchool = async (id, schoolData) => {
  try {
    const response = await axios.put(`${API_URL}/schools/${id}`, schoolData);
    return response.data;
  } catch (error) {
    console.error(`Error updating school with ID ${id}:`, error);
    throw error;
  }
};

// Delete a school
export const deleteSchool = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/schools/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting school with ID ${id}:`, error);
    throw error;
  }
};

// Get school classes history
export const getSchoolClassesHistory = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/schools/${id}/classes`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching classes for school with ID ${id}:`, error);
    throw error;
  }
};

// Get school contacts
export const getSchoolContacts = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/schools/${id}/contacts`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching contacts for school with ID ${id}:`, error);
    throw error;
  }
};

// Add a contact to a school
export const addSchoolContact = async (id, contactData) => {
  try {
    const response = await axios.post(`${API_URL}/schools/${id}/contacts`, contactData);
    return response.data;
  } catch (error) {
    console.error(`Error adding contact to school with ID ${id}:`, error);
    throw error;
  }
};

// Update school partnership details
export const updatePartnership = async (id, partnershipData) => {
  try {
    const response = await axios.put(`${API_URL}/schools/${id}/partnership`, partnershipData);
    return response.data;
  } catch (error) {
    console.error(`Error updating partnership for school with ID ${id}:`, error);
    throw error;
  }
};

// Get programs offered at a school
export const getSchoolPrograms = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/schools/${id}/programs`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching programs for school with ID ${id}:`, error);
    throw error;
  }
};

// Add a program to a school
export const addSchoolProgram = async (id, programData) => {
  try {
    const response = await axios.post(`${API_URL}/schools/${id}/programs`, programData);
    return response.data;
  } catch (error) {
    console.error(`Error adding program to school with ID ${id}:`, error);
    throw error;
  }
};