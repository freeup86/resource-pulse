// src/components/capacity/CapacityPlanningPage.jsx
import React, { useState, useEffect } from 'react';
import { useCapacity } from '../../contexts/CapacityContext';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import LoadingSpinner from '../common/LoadingSpinner';
import DateRangeFilter from '../analytics/DateRangeFilter';
import ErrorMessage from '../common/ErrorMessage';
import CapacityHeatmap from './CapacityHeatmap';
import ScenarioForm from './ScenarioForm';
import ScenariosList from './ScenariosList';
import ScenarioDetail from './ScenarioDetail';
import ResourceCapacityEditor from './ResourceCapacityEditor';

const CapacityPlanningPage = () => {
  const { 
    capacityForecast, 
    scenarios, 
    loading, 
    error, 
    getCapacityForecast, 
    fetchScenarios,
    clearError
  } = useCapacity();
  
  const { resources, loading: resourcesLoading } = useResources();
  const { projects, loading: projectsLoading } = useProjects();
  
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)) // 6 months ahead
  });
  const [selectedResources, setSelectedResources] = useState([]);
  const [showScenarioForm, setShowScenarioForm] = useState(false);
  const [showScenariosList, setShowScenariosList] = useState(false);
  const [showScenarioDetail, setShowScenarioDetail] = useState(false);
  const [selectedScenarioForDetail, setSelectedScenarioForDetail] = useState(null);
  const [showCapacityEditor, setShowCapacityEditor] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  
  // Load capacity forecast on mount and when filters change
  useEffect(() => {
    loadCapacityForecast();
  }, [selectedScenarioId, dateRange]);
  
  const loadCapacityForecast = async () => {
    try {
      const params = {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0],
        scenarioId: selectedScenarioId,
        resourceIds: selectedResources.length > 0 ? selectedResources.join(',') : undefined
      };
      
      await getCapacityForecast(params);
    } catch (err) {
      console.error('Error loading capacity forecast:', err);
    }
  };
  
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };
  
  const handleScenarioChange = (e) => {
    setSelectedScenarioId(e.target.value === '' ? null : Number(e.target.value));
  };
  
  const handleOpenScenariosList = () => {
    setShowScenariosList(true);
  };
  
  const handleSelectScenario = (scenarioId) => {
    setSelectedScenarioForDetail(scenarioId);
    setShowScenarioDetail(true);
    setShowScenariosList(false);
  };
  
  const handleCloseScenarioDetail = () => {
    setShowScenarioDetail(false);
    setSelectedScenarioForDetail(null);
  };
  
  const handleScenarioCreated = (scenarioId) => {
    setSelectedScenarioId(scenarioId);
    loadCapacityForecast();
  };
  
  const handleApplyScenario = () => {
    setShowScenarioDetail(false);
    setSelectedScenarioForDetail(null);
    // Refresh data after applying scenario
    loadCapacityForecast();
  };
  
  const handleResourceSelection = (resourceId) => {
    if (selectedResources.includes(resourceId)) {
      setSelectedResources(selectedResources.filter(id => id !== resourceId));
    } else {
      setSelectedResources([...selectedResources, resourceId]);
    }
  };

  const applyResourceFilter = () => {
    loadCapacityForecast();
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Resource Capacity Planning</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowScenarioForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Scenario
          </button>
          <button 
            onClick={handleOpenScenariosList}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Manage Scenarios
          </button>
        </div>
      </div>
      
      {error && <ErrorMessage message={error} onDismiss={clearError} />}
      
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-medium mb-4">Capacity Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scenario
            </label>
            <select
              value={selectedScenarioId || ''}
              onChange={handleScenarioChange}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="">None (Show actual allocations)</option>
              {scenarios.map(scenario => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <DateRangeFilter 
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={handleDateRangeChange}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Resources
          </label>
          <div className="border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
            {resourcesLoading ? (
              <p className="text-gray-500">Loading resources...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {resources.map(resource => (
                  <div key={resource.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`resource-${resource.id}`}
                      checked={selectedResources.includes(resource.id)}
                      onChange={() => handleResourceSelection(resource.id)}
                      className="mr-2"
                    />
                    <label htmlFor={`resource-${resource.id}`} className="text-sm">
                      {resource.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={applyResourceFilter}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              disabled={loading}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-medium mb-4">Capacity Forecast</h3>
        
        {loading ? (
          <div className="flex justify-center my-8">
            <LoadingSpinner />
          </div>
        ) : capacityForecast ? (
          <div className="relative overflow-x-auto">
            <CapacityHeatmap 
              capacityData={capacityForecast}
              onResourceCapacityEdit={(resourceId) => {
                setSelectedResourceId(resourceId);
                setShowCapacityEditor(true);
              }}
            />
          </div>
        ) : (
          <div className="text-center text-gray-500 my-8">
            No capacity data available. Adjust filters or create a scenario.
          </div>
        )}
      </div>
      
      {/* Modal forms */}
      {showScenarioForm && (
        <ScenarioForm 
          onClose={() => setShowScenarioForm(false)}
          onScenarioCreated={handleScenarioCreated}
        />
      )}
      
      {showScenariosList && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
              <h2 className="text-lg font-semibold">Capacity Planning Scenarios</h2>
              <button 
                onClick={() => setShowScenariosList(false)}
                className="text-white hover:text-gray-200"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6">
              <ScenariosList onSelectScenario={handleSelectScenario} />
            </div>
            
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setShowScenariosList(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showScenarioDetail && selectedScenarioForDetail && (
        <ScenarioDetail 
          scenarioId={selectedScenarioForDetail}
          onClose={handleCloseScenarioDetail}
          onApply={handleApplyScenario}
        />
      )}
      
      {showCapacityEditor && selectedResourceId && (
        <ResourceCapacityEditor
          resourceId={selectedResourceId}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onClose={() => {
            setShowCapacityEditor(false);
            setSelectedResourceId(null);
            loadCapacityForecast();
          }}
        />
      )}
    </div>
  );
};

export default CapacityPlanningPage;