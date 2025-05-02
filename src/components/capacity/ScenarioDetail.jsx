// src/components/capacity/ScenarioDetail.jsx
import React, { useState, useEffect } from 'react';
import { useCapacity } from '../../contexts/CapacityContext';
import ScenarioAllocationForm from './ScenarioAllocationForm';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const ScenarioDetail = ({ scenarioId, onClose, onApply }) => {
  const { 
    fetchScenarioById, 
    currentScenario, 
    loading, 
    error, 
    clearError,
    applyScenario
  } = useCapacity();
  
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  
  // Load scenario details
  useEffect(() => {
    if (scenarioId) {
      loadScenarioDetails();
    }
  }, [scenarioId]);
  
  const loadScenarioDetails = async () => {
    try {
      await fetchScenarioById(scenarioId);
    } catch (err) {
      console.error('Error loading scenario details:', err);
    }
  };
  
  const handleAddAllocation = () => {
    setSelectedAllocation(null);
    setShowAllocationForm(true);
  };
  
  const handleEditAllocation = (allocation) => {
    setSelectedAllocation(allocation);
    setShowAllocationForm(true);
  };
  
  const handleCloseForm = () => {
    setShowAllocationForm(false);
    setSelectedAllocation(null);
  };
  
  const handleAllocationSaved = () => {
    // Refresh scenario details
    loadScenarioDetails();
  };
  
  const handleApplyScenario = async () => {
    if (!window.confirm(
      'Are you sure you want to apply this scenario? This will convert all temporary allocations to real allocations.'
    )) {
      return;
    }
    
    try {
      await applyScenario(scenarioId);
      if (onApply) {
        onApply();
      }
    } catch (err) {
      console.error('Error applying scenario:', err);
    }
  };
  
  // Group allocations by resource
  const groupedAllocations = {};
  if (currentScenario && currentScenario.allocations) {
    currentScenario.allocations.forEach(allocation => {
      if (!groupedAllocations[allocation.resourceId]) {
        groupedAllocations[allocation.resourceId] = {
          resourceId: allocation.resourceId,
          resourceName: allocation.resourceName,
          allocations: []
        };
      }
      
      groupedAllocations[allocation.resourceId].allocations.push(allocation);
    });
  }
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {currentScenario ? currentScenario.name : 'Scenario Details'}
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            &times;
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {error && <ErrorMessage message={error} onDismiss={clearError} />}
          
          {loading && !currentScenario ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : currentScenario ? (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-medium">Scenario Details</h3>
                <p className="text-gray-600 mt-2">
                  {currentScenario.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Resource Allocations</h3>
                <button 
                  onClick={handleAddAllocation}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Add Allocation
                </button>
              </div>
              
              {Object.values(groupedAllocations).length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No allocations in this scenario. Click "Add Allocation" to create one.
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.values(groupedAllocations).map(group => (
                    <div key={group.resourceId} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 font-medium">
                        {group.resourceName}
                      </div>
                      <div className="divide-y">
                        {group.allocations.map(allocation => (
                          <div 
                            key={allocation.id} 
                            className="p-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleEditAllocation(allocation)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{allocation.projectName}</div>
                                <div className="text-sm text-gray-600">
                                  {new Date(allocation.startDate).toLocaleDateString()} to {new Date(allocation.endDate).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                  {allocation.utilization}%
                                </span>
                                {allocation.isTemporary && (
                                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium ml-2 px-2.5 py-0.5 rounded">
                                    Temporary
                                  </span>
                                )}
                              </div>
                            </div>
                            {allocation.notes && (
                              <div className="mt-2 text-sm text-gray-600">
                                {allocation.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Scenario not found or could not be loaded.
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-between">
          <button
            onClick={handleApplyScenario}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            disabled={loading || !currentScenario || !currentScenario.allocations?.length}
          >
            Apply Scenario
          </button>
          
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
      
      {showAllocationForm && (
        <ScenarioAllocationForm 
          scenarioId={scenarioId}
          existingAllocation={selectedAllocation}
          onClose={handleCloseForm}
          onAllocationSaved={handleAllocationSaved}
        />
      )}
    </div>
  );
};

export default ScenarioDetail;