// src/services/capacityService.js
import api from './api';

// Scenario management
export const getScenarios = async () => {
  try {
    const response = await api.get('/capacity/scenarios');
    return response.data;
  } catch (error) {
    console.error('Error fetching capacity scenarios:', error);
    throw error;
  }
};

export const getScenarioById = async (scenarioId) => {
  try {
    const response = await api.get(`/capacity/scenarios/${scenarioId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching scenario ${scenarioId}:`, error);
    throw error;
  }
};

export const createScenario = async (scenarioData) => {
  try {
    const response = await api.post('/capacity/scenarios', scenarioData);
    return response.data;
  } catch (error) {
    console.error('Error creating scenario:', error);
    throw error;
  }
};

export const updateScenario = async (scenarioId, scenarioData) => {
  try {
    const response = await api.put(`/capacity/scenarios/${scenarioId}`, scenarioData);
    return response.data;
  } catch (error) {
    console.error(`Error updating scenario ${scenarioId}:`, error);
    throw error;
  }
};

// Scenario allocations
export const updateScenarioAllocation = async (scenarioId, resourceId, allocationData) => {
  try {
    const response = await api.post(
      `/capacity/scenarios/${scenarioId}/resources/${resourceId}`,
      allocationData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating scenario allocation:', error);
    throw error;
  }
};

export const deleteScenarioAllocation = async (scenarioId, allocationId) => {
  try {
    const response = await api.delete(
      `/capacity/scenarios/${scenarioId}/allocations/${allocationId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting scenario allocation:', error);
    throw error;
  }
};

export const applyScenario = async (scenarioId) => {
  try {
    const response = await api.post(`/capacity/scenarios/${scenarioId}/apply`);
    return response.data;
  } catch (error) {
    console.error(`Error applying scenario ${scenarioId}:`, error);
    throw error;
  }
};

// Capacity forecasting
export const getCapacityForecast = async (params) => {
  try {
    const response = await api.get('/capacity/forecast', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching capacity forecast:', error);
    throw error;
  }
};

// Resource capacity management
export const getResourceCapacity = async (resourceId, params) => {
  try {
    const response = await api.get(`/capacity/resources/${resourceId}/capacity`, { 
      params 
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching resource ${resourceId} capacity:`, error);
    throw error;
  }
};

export const updateResourceCapacity = async (resourceId, capacityData) => {
  try {
    const response = await api.put(
      `/capacity/resources/${resourceId}/capacity`,
      capacityData
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating resource ${resourceId} capacity:`, error);
    throw error;
  }
};

export const bulkUpdateResourceCapacity = async (resourceId, capacityData) => {
  try {
    const response = await api.put(
      `/capacity/resources/${resourceId}/capacity/bulk`,
      { capacityData }
    );
    return response.data;
  } catch (error) {
    console.error(`Error bulk updating resource ${resourceId} capacity:`, error);
    throw error;
  }
};