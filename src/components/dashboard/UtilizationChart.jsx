import React from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { calculateTotalUtilization } from '../../utils/allocationUtils';

const UtilizationChart = () => {
  const { resources, loading } = useResources();
  
  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded"></div>;
  
  // Calculate utilization metrics with the utility function
  const totalResources = resources.length;
  
  // Get allocated resources and count
  const allocatedResources = resources.filter(r => calculateTotalUtilization(r) > 0);
  const allocatedCount = allocatedResources.length;
  const unallocatedCount = totalResources - allocatedCount;
  
  // Calculate average utilization using the utility function
  const totalUtilization = resources.reduce((total, resource) => 
    total + calculateTotalUtilization(resource), 0);
  
  const averageUtilization = allocatedCount > 0 
    ? Math.round(totalUtilization / allocatedCount) 
    : 0;
  
  // Utilization distribution with improved calculations
  const utilGroups = [
    { label: '0%', count: unallocatedCount },
    { label: '1-50%', count: resources.filter(r => {
      const util = calculateTotalUtilization(r);
      return util > 0 && util <= 50;
    }).length },
    { label: '51-99%', count: resources.filter(r => {
      const util = calculateTotalUtilization(r);
      return util > 50 && util < 100;
    }).length },
    { label: '100%', count: resources.filter(r => calculateTotalUtilization(r) === 100).length },
    { label: '>100%', count: resources.filter(r => calculateTotalUtilization(r) > 100).length }
  ];
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Utilization</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{allocatedCount}</div>
          <div className="text-sm text-gray-500">Allocated Resources</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{averageUtilization}%</div>
          <div className="text-sm text-gray-500">Average Utilization</div>
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Utilization Distribution</h4>
        <div className="space-y-2">
          {utilGroups.map((group, index) => (
            <div key={index}>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{group.label}</span>
                <span>{group.count} resources</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-blue-600 h-2 rounded-full ${
                    group.label === '>100%' ? 'bg-red-600' : 'bg-blue-600'
                  }`}
                  style={{
                    width: totalResources > 0 
                      ? `${(group.count / totalResources) * 100}%` 
                      : '0%'
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UtilizationChart;