import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Get all equipment
export const getEquipment = async () => {
  try {
    const response = await axios.get(`${API_URL}/equipment`);
    return response.data;
  } catch (error) {
    console.error('Error fetching equipment:', error);
    throw error;
  }
};

// Get equipment by ID
export const getEquipmentById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/equipment/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching equipment with ID ${id}:`, error);
    throw error;
  }
};

// Create new equipment
export const createEquipment = async (equipmentData) => {
  try {
    const response = await axios.post(`${API_URL}/equipment`, equipmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating equipment:', error);
    throw error;
  }
};

// Update equipment
export const updateEquipment = async (id, equipmentData) => {
  try {
    const response = await axios.put(`${API_URL}/equipment/${id}`, equipmentData);
    return response.data;
  } catch (error) {
    console.error(`Error updating equipment with ID ${id}:`, error);
    throw error;
  }
};

// Delete equipment
export const deleteEquipment = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/equipment/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting equipment with ID ${id}:`, error);
    throw error;
  }
};

// Get equipment maintenance history
export const getMaintenanceHistory = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/equipment/${id}/maintenance`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching maintenance history for equipment with ID ${id}:`, error);
    throw error;
  }
};

// Add maintenance record
export const addMaintenanceRecord = async (id, maintenanceData) => {
  try {
    const response = await axios.post(`${API_URL}/equipment/${id}/maintenance`, maintenanceData);
    return response.data;
  } catch (error) {
    console.error(`Error adding maintenance record for equipment with ID ${id}:`, error);
    throw error;
  }
};

// Get equipment checkout history
export const getCheckoutHistory = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/equipment/${id}/checkout`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching checkout history for equipment with ID ${id}:`, error);
    throw error;
  }
};

// Checkout equipment
export const checkoutEquipment = async (id, checkoutData) => {
  try {
    const response = await axios.post(`${API_URL}/equipment/${id}/checkout`, checkoutData);
    return response.data;
  } catch (error) {
    console.error(`Error checking out equipment with ID ${id}:`, error);
    throw error;
  }
};

// Check in equipment
export const checkinEquipment = async (id, checkoutId) => {
  try {
    const response = await axios.put(`${API_URL}/equipment/${id}/checkout/${checkoutId}/return`);
    return response.data;
  } catch (error) {
    console.error(`Error checking in equipment with ID ${id}:`, error);
    throw error;
  }
};

// Update equipment status
export const updateEquipmentStatus = async (id, status) => {
  try {
    const response = await axios.put(`${API_URL}/equipment/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Error updating status for equipment with ID ${id}:`, error);
    throw error;
  }
};

// Get course allocations for equipment
export const getEquipmentAllocations = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/equipment/${id}/allocations`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching allocations for equipment with ID ${id}:`, error);
    throw error;
  }
};

// Allocate equipment to a course
export const allocateEquipment = async (id, allocationData) => {
  try {
    const response = await axios.post(`${API_URL}/equipment/${id}/allocations`, allocationData);
    return response.data;
  } catch (error) {
    console.error(`Error allocating equipment with ID ${id}:`, error);
    throw error;
  }
};