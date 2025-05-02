// src/contexts/CapacityContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as capacityService from '../services/capacityService';

// Create context
const CapacityContext = createContext();

// Provider component
export const CapacityProvider = ({ children }) => {
  const [scenarios, setScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [capacityForecast, setCapacityForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch scenarios on mount
  useEffect(() => {
    fetchScenarios();
  }, []);

  // Fetch all scenarios
  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const data = await capacityService.getScenarios();
      setScenarios(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch scenarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific scenario
  const fetchScenarioById = async (scenarioId) => {
    try {
      setLoading(true);
      const data = await capacityService.getScenarioById(scenarioId);
      setCurrentScenario(data);
      setError(null);
      return data;
    } catch (err) {
      setError('Failed to fetch scenario');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create a new scenario
  const createScenario = async (scenarioData) => {
    try {
      setLoading(true);
      const data = await capacityService.createScenario(scenarioData);
      await fetchScenarios(); // Refresh the list
      setError(null);
      return data;
    } catch (err) {
      setError('Failed to create scenario');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update a scenario
  const updateScenario = async (scenarioId, scenarioData) => {
    try {
      setLoading(true);
      const data = await capacityService.updateScenario(scenarioId, scenarioData);
      
      // Update local scenarios list
      setScenarios(scenarios.map(scenario => 
        scenario.id === parseInt(scenarioId) ? { ...scenario, ...data } : scenario
      ));
      
      // Update current scenario if that's the one being edited
      if (currentScenario && currentScenario.id === parseInt(scenarioId)) {
        setCurrentScenario({ ...currentScenario, ...data });
      }
      
      setError(null);
      return data;
    } catch (err) {
      setError('Failed to update scenario');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update a scenario allocation
  const updateScenarioAllocation = async (scenarioId, resourceId, allocationData) => {
    try {
      setLoading(true);
      const data = await capacityService.updateScenarioAllocation(
        scenarioId,
        resourceId,
        allocationData
      );
      
      // Update current scenario if this is the one we're viewing
      if (currentScenario && currentScenario.id === parseInt(scenarioId)) {
        // Find and replace the allocations for this resource
        const updatedAllocations = currentScenario.allocations.filter(
          a => a.resourceId !== parseInt(resourceId) || a.projectId !== allocationData.projectId
        );
        
        setCurrentScenario({
          ...currentScenario,
          allocations: [...updatedAllocations, ...data]
        });
      }
      
      setError(null);
      return data;
    } catch (err) {
      setError('Failed to update allocation');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a scenario allocation
  const deleteScenarioAllocation = async (scenarioId, allocationId) => {
    try {
      setLoading(true);
      await capacityService.deleteScenarioAllocation(scenarioId, allocationId);
      
      // Update current scenario if this is the one we're viewing
      if (currentScenario && currentScenario.id === parseInt(scenarioId)) {
        setCurrentScenario({
          ...currentScenario,
          allocations: currentScenario.allocations.filter(
            a => a.id !== parseInt(allocationId)
          )
        });
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to delete allocation');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Apply a scenario to real allocations
  const applyScenario = async (scenarioId) => {
    try {
      setLoading(true);
      await capacityService.applyScenario(scenarioId);
      setError(null);
    } catch (err) {
      setError('Failed to apply scenario');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get capacity forecast
  const getCapacityForecast = async (params) => {
    try {
      setLoading(true);
      const data = await capacityService.getCapacityForecast(params);
      setCapacityForecast(data);
      setError(null);
      return data;
    } catch (err) {
      setError('Failed to fetch capacity forecast');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get resource capacity
  const getResourceCapacity = async (resourceId, params) => {
    try {
      setLoading(true);
      const data = await capacityService.getResourceCapacity(resourceId, params);
      setError(null);
      return data;
    } catch (err) {
      setError('Failed to fetch resource capacity');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update resource capacity
  const updateResourceCapacity = async (resourceId, capacityData) => {
    try {
      setLoading(true);
      const data = await capacityService.updateResourceCapacity(resourceId, capacityData);
      setError(null);
      return data;
    } catch (err) {
      setError('Failed to update resource capacity');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Bulk update resource capacity
  const bulkUpdateResourceCapacity = async (resourceId, capacityData) => {
    try {
      setLoading(true);
      const data = await capacityService.bulkUpdateResourceCapacity(resourceId, capacityData);
      setError(null);
      return data;
    } catch (err) {
      setError('Failed to update resource capacity');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear errors
  const clearError = () => {
    setError(null);
  };

  return (
    <CapacityContext.Provider
      value={{
        scenarios,
        currentScenario,
        capacityForecast,
        loading,
        error,
        fetchScenarios,
        fetchScenarioById,
        createScenario,
        updateScenario,
        updateScenarioAllocation,
        deleteScenarioAllocation,
        applyScenario,
        getCapacityForecast,
        getResourceCapacity,
        updateResourceCapacity,
        bulkUpdateResourceCapacity,
        clearError
      }}
    >
      {children}
    </CapacityContext.Provider>
  );
};

// Custom hook for using the capacity context
export const useCapacity = () => {
  const context = useContext(CapacityContext);
  if (!context) {
    throw new Error('useCapacity must be used within a CapacityProvider');
  }
  return context;
};