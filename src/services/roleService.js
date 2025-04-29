// src/services/roleService.js
import api from './api';

export const getRoles = async () => {
  try {
    const response = await api.get('/roles');
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

export const createRole = async (roleData) => {
  try {
    const response = await api.post('/roles', roleData);
    return response.data;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

export const getRole = async (id) => {
  try {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching role ${id}:`, error);
    throw error;
  }
};