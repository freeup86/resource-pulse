import React, { useState } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useSettings } from '../../contexts/SettingsContext';
import { formatDate, calculateDaysUntilEnd } from '../../utils/dateUtils';
import { calculateTotalUtilization } from '../../utils/allocationUtils';
import UtilizationBar from '../common/UtilizationBar';
import AllocationForm from './AllocationForm';

const AllocationList = ({ resource }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const { projects } = useProjects();
  const { settings } = useSettings();
  
  // Calculate total utilization using the utility function
  const totalUtilization = calculateTotalUtilization(resource);
  
  // Check if allocation is allowed based on settings
  const systemMaxUtilization = settings.maxUtilizationPercentage || 100;
  const allowOverallocation = settings.allowOverallocation;
  const canAddAllocation = allowOverallocation ? 
    totalUtilization < systemMaxUtilization : 
    totalUtilization < 100;
  
  // Get all allocations
  const allocations = resource.allocations || [];
  
  const handleAddAllocation = () => {
    setSelectedAllocation(null);
    setShowForm(true);
  };
  
  const handleEditAllocation = (allocation) => {
    setSelectedAllocation(allocation);
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedAllocation(null);
  };
  
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Allocations</h3>
        <button 
          onClick={handleAddAllocation}
          className={`bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 ${
            totalUtilization >= 100 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={totalUtilization >= 100}
        >
          Add Allocation
        </button>
      </div>
      
      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">Total Utilization</span>
          <span className="text-sm font-medium">{totalUtilization}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              totalUtilization > 100 ? 'bg-red-600' : 'bg-blue-600'
            }`}
            style={{width: `${Math.min(totalUtilization, 100)}%`}}
          ></div>
        </div>
        {totalUtilization > 100 && (
          <p className="text-sm text-red-600 mt-1">
            Warning: Total utilization exceeds 100%
          </p>
        )}
      </div>
      
      {allocations.length > 0 ? (
        <div className="mt-4 space-y-4">
          {allocations.map((allocation, index) => {
            const project = projects.find(p => p.id === allocation.projectId) || { name: 'Unknown Project' };
            const projectName = allocation.projectName || project.name;
            
            return (
              <div key={`${allocation.id || index}`} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{projectName}</h4>
                    <p className="text-sm text-gray-500">
                      {formatDate(allocation.startDate)} - {formatDate(allocation.endDate)}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleEditAllocation(allocation)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Edit
                  </button>
                </div>
                
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Utilization</span>
                    <span>{allocation.utilization}%</span>
                  </div>
                  <UtilizationBar percentage={allocation.utilization} />
                </div>
                
                <div className="mt-2 text-sm">
                  <span className={`${
                    calculateDaysUntilEnd(allocation.endDate) <= 7 ? 'text-red-600' :
                    calculateDaysUntilEnd(allocation.endDate) <= 14 ? 'text-yellow-600' :
                    'text-gray-500'
                  }`}>
                    {calculateDaysUntilEnd(allocation.endDate)} days remaining
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg mt-2 text-center">
          <p className="text-gray-500">This resource is currently unallocated</p>
          {canAddAllocation && (
            <button 
              onClick={handleAddAllocation}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Assign to Project
            </button>
          )}
        </div>
      )}
      
      {showForm && (
        <AllocationForm 
          resourceId={resource.id}
          allocation={selectedAllocation}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default AllocationList;