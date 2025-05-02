// src/components/capacity/CapacityHeatmap.jsx
import React from 'react';
import { useProjects } from '../../contexts/ProjectContext';

const CapacityHeatmap = ({ capacityData, onResourceCapacityEdit }) => {
  const { projects } = useProjects();
  
  if (!capacityData || !capacityData.resources) {
    return <div className="p-4 text-gray-500">No capacity data available</div>;
  }
  
  // Get color for utilization percentage
  const getUtilizationColor = (utilization, capacity = 100) => {
    const percent = Math.min(100, (utilization / capacity) * 100);
    
    if (percent > 90) return 'bg-red-500'; // Overallocated
    if (percent > 75) return 'bg-orange-400'; // High utilization
    if (percent > 50) return 'bg-yellow-300'; // Medium utilization
    if (percent > 25) return 'bg-green-300'; // Low utilization
    return 'bg-blue-200'; // Very low/no utilization
  };
  
  // Get project color by project ID (for allocation blocks)
  const getProjectColor = (projectId) => {
    const projectColors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500'
    ];
    
    return projectColors[projectId % projectColors.length];
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border border-gray-300 sticky left-0 bg-gray-100 z-10">Resource</th>
            {capacityData.months && capacityData.months.map((month, index) => (
              <th key={index} className="p-2 border border-gray-300 whitespace-nowrap">
                {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {capacityData.resources.map(resource => (
            <tr key={resource.resourceId}>
              <td 
                className="p-2 border border-gray-300 font-medium sticky left-0 bg-white z-10"
                onClick={() => onResourceCapacityEdit && onResourceCapacityEdit(resource.resourceId)}
              >
                <div className="flex flex-col">
                  <span>{resource.name}</span>
                  <span className="text-xs text-gray-500">{resource.role}</span>
                </div>
              </td>
              
              {resource.months.map((month, index) => (
                <td 
                  key={index} 
                  className="p-0 border border-gray-300 relative"
                  style={{ height: '80px', minWidth: '100px' }}
                >
                  {/* Utilization percentage bar */}
                  <div 
                    className={`w-full p-1 text-xs text-center ${month.overallocated ? 'text-white' : ''}`}
                    style={{ 
                      height: `${Math.min(100, (month.totalUtilization / month.effectiveCapacity) * 100)}%`,
                      backgroundColor: month.overallocated ? '#EF4444' : '#10B981',
                      marginTop: 'auto'
                    }}
                  >
                    {month.totalUtilization}%
                  </div>
                  
                  {/* Allocation details on hover */}
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-white bg-opacity-90 p-2 text-xs overflow-y-auto">
                    <div className="font-medium mb-1">{resource.name} - {month.label}</div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className={month.overallocated ? 'text-red-600 font-bold' : ''}>
                        {month.totalUtilization}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Capacity:</span>
                      <span>{month.effectiveCapacity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span>{month.remainingCapacity}%</span>
                    </div>
                    
                    {month.allocations.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium">Projects:</div>
                        {month.allocations.map((allocation, i) => (
                          <div 
                            key={i}
                            className="flex justify-between items-center mt-1"
                          >
                            <span className="truncate flex-1">
                              <span 
                                className={`inline-block w-2 h-2 rounded-full mr-1 ${getProjectColor(allocation.projectId)}`} 
                              ></span>
                              {allocation.projectName}
                              {allocation.isScenario && <span className="text-blue-500 ml-1">(scenario)</span>}
                            </span>
                            <span className="ml-2">{allocation.utilization}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CapacityHeatmap;