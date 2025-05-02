// src/components/capacity/ScenariosList.jsx
import React, { useEffect } from 'react';
import { useCapacity } from '../../contexts/CapacityContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ScenariosList = ({ onSelectScenario }) => {
  const { scenarios, loading, error, fetchScenarios } = useCapacity();
  
  // Load scenarios on mount
  useEffect(() => {
    fetchScenarios();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        Error loading scenarios: {error}
      </div>
    );
  }
  
  if (scenarios.length === 0) {
    return (
      <div className="text-gray-500 p-4 text-center">
        No scenarios found. Create a new one to get started with capacity planning.
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {scenarios.map(scenario => (
        <div 
          key={scenario.id}
          className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => onSelectScenario(scenario.id)}
        >
          <div className="font-medium">{scenario.name}</div>
          {scenario.description && (
            <div className="text-sm text-gray-600 truncate mt-1">
              {scenario.description}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">
            Created: {new Date(scenario.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScenariosList;