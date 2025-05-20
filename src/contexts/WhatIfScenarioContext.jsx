// WhatIfScenarioContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as whatIfScenarioService from '../services/whatIfScenarioService';

// Create context
const WhatIfScenarioContext = createContext();

// Custom hook for using the context
export const useWhatIfScenario = () => useContext(WhatIfScenarioContext);

// Provider component
export const WhatIfScenarioProvider = ({ children }) => {
  const [scenarios, setScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear any error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch all what-if scenarios
  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await whatIfScenarioService.getWhatIfScenarios();
      setScenarios(data);
      return data;
    } catch (err) {
      setError('Error fetching what-if scenarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a specific scenario by ID
  const fetchScenarioById = useCallback(async (scenarioId) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await whatIfScenarioService.getWhatIfScenarioById(scenarioId);
      setCurrentScenario(data);
      return data;
    } catch (err) {
      setError('Error fetching scenario details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new what-if scenario
  const createScenario = useCallback(async (scenarioData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newScenario = await whatIfScenarioService.createWhatIfScenario(scenarioData);
      setScenarios(prev => [newScenario, ...prev]);
      return newScenario;
    } catch (err) {
      setError('Error creating scenario');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update project timeline in a scenario
  const updateProjectTimeline = useCallback(async (scenarioId, projectId, timelineData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await whatIfScenarioService.updateProjectTimeline(scenarioId, projectId, timelineData);
      
      // Update current scenario if this is the one being viewed
      if (currentScenario && currentScenario.id === parseInt(scenarioId)) {
        const updatedTimelineChanges = currentScenario.timelineChanges.filter(
          change => change.projectId !== parseInt(projectId)
        );
        
        setCurrentScenario({
          ...currentScenario,
          timelineChanges: [...updatedTimelineChanges, result]
        });
      }
      
      return result;
    } catch (err) {
      setError('Error updating project timeline');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentScenario]);

  // Add or update a resource in a scenario
  const updateScenarioResource = useCallback(async (scenarioId, resourceData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await whatIfScenarioService.updateScenarioResource(scenarioId, resourceData);

      // Update current scenario if this is the one being viewed
      if (currentScenario && currentScenario.id === parseInt(scenarioId)) {
        // Handle allocation case
        if (resourceData.allocationData) {
          // This is an allocation update, not a resource change
          // We'll need to refresh the scenario data completely
          // The full refresh will be triggered by the component after allocation is saved
          return result;
        }

        // Handle resource change case
        let updatedResourceChanges;

        if (resourceData.resourceId) {
          // Update or remove existing resource
          updatedResourceChanges = currentScenario.resourceChanges.filter(
            change => change.resourceId !== resourceData.resourceId
          );
        } else {
          // Adding a new resource (no resourceId)
          updatedResourceChanges = [...currentScenario.resourceChanges];
        }

        setCurrentScenario({
          ...currentScenario,
          resourceChanges: [...updatedResourceChanges, result]
        });
      }

      return result;
    } catch (err) {
      setError('Error updating scenario resource');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentScenario]);

  // Calculate scenario metrics
  const calculateMetrics = useCallback(async (scenarioId) => {
    setLoading(true);
    setError(null);
    
    try {
      const metricsData = await whatIfScenarioService.calculateScenarioMetrics(scenarioId);
      
      // Update current scenario if this is the one being viewed
      if (currentScenario && currentScenario.id === parseInt(scenarioId)) {
        setCurrentScenario({
          ...currentScenario,
          metricsData
        });
      }
      
      return metricsData;
    } catch (err) {
      setError('Error calculating scenario metrics');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentScenario]);

  // Compare multiple scenarios
  const compareScenarios = useCallback(async (compareData) => {
    setLoading(true);
    setError(null);
    
    try {
      const comparison = await whatIfScenarioService.compareScenarios(compareData);
      setComparisonData(comparison);
      return comparison;
    } catch (err) {
      setError('Error comparing scenarios');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Promote scenario to production
  const promoteScenario = useCallback(async (scenarioId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await whatIfScenarioService.promoteScenario(scenarioId);
      
      // Update scenarios list after promotion
      await fetchScenarios();
      
      // Clear current scenario if it was the one promoted
      if (currentScenario && currentScenario.id === parseInt(scenarioId)) {
        setCurrentScenario(null);
      }
      
      return result;
    } catch (err) {
      setError('Error promoting scenario');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentScenario, fetchScenarios]);

  // Format metrics for display
  const getFormattedMetrics = useCallback((metricsData) => {
    return whatIfScenarioService.formatMetricsForDisplay(metricsData);
  }, []);

  // Value to be provided by context
  const value = {
    scenarios,
    currentScenario,
    comparisonData,
    loading,
    error,
    clearError,
    fetchScenarios,
    fetchScenarioById,
    createScenario,
    updateProjectTimeline,
    updateScenarioResource,
    calculateMetrics,
    compareScenarios,
    promoteScenario,
    getFormattedMetrics
  };

  return (
    <WhatIfScenarioContext.Provider value={value}>
      {children}
    </WhatIfScenarioContext.Provider>
  );
};

export default WhatIfScenarioContext;