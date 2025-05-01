// src/services/syncService.js
import api from './api';

export const syncResources = async () => {
  try {
    const response = await api.post('/sync/resources');
    return response.data;
  } catch (error) {
    console.error('Error syncing resources:', error);
    throw error;
  }
};

export const syncProjects = async () => {
  try {
    const response = await api.post('/sync/projects');
    return response.data;
  } catch (error) {
    console.error('Error syncing projects:', error);
    throw error;
  }
};

export const syncAllocations = async () => {
  try {
    const response = await api.post('/sync/allocations');
    return response.data;
  } catch (error) {
    console.error('Error syncing allocations:', error);
    throw error;
  }
};

export const syncAll = async () => {
  try {
    const response = await api.post('/sync/all');
    return response.data;
  } catch (error) {
    console.error('Error running full sync:', error);
    throw error;
  }
};