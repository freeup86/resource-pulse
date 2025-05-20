// whatIfScenarioService.js
import api from './api';

// Create a new what-if scenario
export const createWhatIfScenario = async (scenarioData) => {
  try {
    const response = await api.post('/whatif/scenarios', scenarioData);
    return response.data;
  } catch (error) {
    console.error('Error creating what-if scenario:', error);
    throw error;
  }
};

// Get all what-if scenarios
export const getWhatIfScenarios = async () => {
  try {
    const response = await api.get('/whatif/scenarios');
    return response.data;
  } catch (error) {
    console.error('Error fetching what-if scenarios:', error);
    throw error;
  }
};

// Get a what-if scenario by ID
export const getWhatIfScenarioById = async (scenarioId) => {
  try {
    const response = await api.get(`/whatif/scenarios/${scenarioId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching what-if scenario details:', error);
    throw error;
  }
};

// Update project timeline in a scenario
export const updateProjectTimeline = async (scenarioId, projectId, timelineData) => {
  try {
    const response = await api.post(`/whatif/scenarios/${scenarioId}/projects/${projectId}/timeline`, timelineData);
    return response.data;
  } catch (error) {
    console.error('Error updating project timeline:', error);
    throw error;
  }
};

// Add or update a resource in a scenario
export const updateScenarioResource = async (scenarioId, resourceData) => {
  try {
    const response = await api.post(`/whatif/scenarios/${scenarioId}/resources`, resourceData);
    return response.data;
  } catch (error) {
    console.error('Error updating scenario resource:', error);
    throw error;
  }
};

// Calculate scenario metrics
export const calculateScenarioMetrics = async (scenarioId) => {
  try {
    const response = await api.post(`/whatif/scenarios/${scenarioId}/calculate-metrics`);
    return response.data;
  } catch (error) {
    console.error('Error calculating scenario metrics:', error);
    throw error;
  }
};

// Compare scenarios
export const compareScenarios = async (compareData) => {
  try {
    const response = await api.post('/whatif/compare', compareData);
    return response.data;
  } catch (error) {
    console.error('Error comparing scenarios:', error);
    throw error;
  }
};

// Promote scenario to production
export const promoteScenario = async (scenarioId) => {
  try {
    const response = await api.post(`/whatif/scenarios/${scenarioId}/promote`);
    return response.data;
  } catch (error) {
    console.error('Error promoting scenario:', error);
    throw error;
  }
};

// Format metrics data for display
export const formatMetricsForDisplay = (metricsData) => {
  if (!metricsData) return null;
  
  try {
    // Parse metrics data if it's a string
    const metrics = typeof metricsData === 'string' ? JSON.parse(metricsData) : metricsData;
    
    return {
      utilization: {
        overall: metrics.utilization?.overall || 0,
        byResource: Object.values(metrics.utilization?.byResource || {})
      },
      costs: {
        totalCost: metrics.costs?.totalCost || 0,
        totalBillable: metrics.costs?.totalBillable || 0,
        margin: metrics.costs?.margin || 0,
        byProject: Object.values(metrics.costs?.byProject || {})
      },
      skillsCoverage: {
        coveragePercentage: metrics.skillsCoverage?.coveragePercentage || 0,
        covered: metrics.skillsCoverage?.covered || [],
        missing: metrics.skillsCoverage?.missing || []
      }
    };
  } catch (error) {
    console.error('Error formatting metrics data:', error);
    return null;
  }
};

export default {
  createWhatIfScenario,
  getWhatIfScenarios,
  getWhatIfScenarioById,
  updateProjectTimeline,
  updateScenarioResource,
  calculateScenarioMetrics,
  compareScenarios,
  promoteScenario,
  formatMetricsForDisplay
};