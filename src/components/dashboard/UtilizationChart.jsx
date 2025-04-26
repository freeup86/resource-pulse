import React from 'react';
import { useResources } from '../../contexts/ResourceContext';

const UtilizationChart = () => {
  const { resources, loading } = useResources();
  
  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded"></div>;
  
  // Calculate utilization metrics
  const totalResources = resources.length;
  const allocatedCount = resources.filter(r => r.allocation).length;
  const unallocatedCount = totalResources - allocatedCount;
  
  // Calculate overall utilization
  const totalUtilization = resources.reduce((total, resource) => {
    if (resource.allocation) {
      return total + resource.allocation.utilization;
    }
    return total;
  }, 0);
  
  const averageUtilization = allocatedCount > 0 
    ? Math.round(totalUtilization / allocatedCount) 
    : 0;
  
  // Utilization distribution
  const utilGroups = [
    { label: '0%', count: unallocatedCount },
    { label: '1-50%', count: resources.filter(r => r.allocation && r.allocation.utilization <= 50).length },
    { label: '51-99%', count: resources.filter(r => r.allocation && r.allocation.utilization > 50 && r.allocation.utilization < 100).length },
    { label: '100%', count: resources.filter(r => r.allocation && r.allocation.utilization === 100).length }
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
                  className="bg-blue-600 h-2 rounded-full" 
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