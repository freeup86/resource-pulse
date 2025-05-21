import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import { useResources } from '../../contexts/ResourceContext';
import { calculateTotalUtilization, getAllocations } from '../../utils/allocationUtils';
import { useProjects } from '../../contexts/ProjectContext';
import { formatDate } from '../../utils/dateUtils';

const OverallocationAlerts = () => {
  const { resources, loading } = useResources();
  const { projects } = useProjects();
  
  // Get overallocated resources and their projects
  const overallocationData = useMemo(() => {
    if (!resources || !projects) return [];
    
    return resources
      .filter(resource => {
        const utilization = calculateTotalUtilization(resource);
        return utilization > 105; // Consider >105% as overallocated to account for rounding
      })
      .map(resource => {
        const allocations = getAllocations(resource)
          .map(allocation => {
            const project = projects.find(p => p.id === allocation.projectId);
            return {
              ...allocation,
              projectName: project?.name || 'Unknown Project',
              clientName: project?.client || 'Unknown Client'
            };
          });
          
        return {
          ...resource,
          totalUtilization: calculateTotalUtilization(resource),
          allocations
        };
      })
      .sort((a, b) => b.totalUtilization - a.totalUtilization);
  }, [resources, projects]);
  
  // Get impending deadline alerts (resources with allocations ending in 7 days)
  const endingSoonData = useMemo(() => {
    if (!resources || !projects) return [];
    
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    return resources
      .filter(resource => {
        const allocations = getAllocations(resource);
        return allocations.some(allocation => {
          const endDate = new Date(allocation.endDate);
          return endDate >= today && endDate <= sevenDaysFromNow;
        });
      })
      .map(resource => {
        const allocations = getAllocations(resource)
          .filter(allocation => {
            const endDate = new Date(allocation.endDate);
            return endDate >= today && endDate <= sevenDaysFromNow;
          })
          .map(allocation => {
            const project = projects.find(p => p.id === allocation.projectId);
            return {
              ...allocation,
              projectName: project?.name || 'Unknown Project',
              clientName: project?.client || 'Unknown Client',
              daysRemaining: Math.ceil((new Date(allocation.endDate) - today) / (1000 * 60 * 60 * 24))
            };
          })
          .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
          
        return {
          ...resource,
          allocations
        };
      });
  }, [resources, projects]);
  
  // Get total alert count
  const totalAlerts = overallocationData.length + endingSoonData.length;
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  if (totalAlerts === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-gray-400" />
            Resource Alerts
          </h3>
          <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-1 rounded-full">
            All Clear
          </span>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No resource alerts detected</p>
          <p className="text-sm mt-1">All resources are properly allocated</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
          Resource Alerts
        </h3>
        <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
          {totalAlerts} {totalAlerts === 1 ? 'Alert' : 'Alerts'}
        </span>
      </div>
      
      <div className="space-y-4">
        {/* Overallocation Alerts */}
        {overallocationData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" />
              Overallocated Resources
            </h4>
            
            <div className="space-y-2">
              {overallocationData.slice(0, 3).map(resource => (
                <div key={resource.id} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                  <div className="flex justify-between">
                    <Link to={`/resources/${resource.id}`} className="font-medium text-blue-600 hover:underline">
                      {resource.name}
                    </Link>
                    <span className="font-bold text-red-600">{Math.round(resource.totalUtilization)}%</span>
                  </div>
                  
                  <div className="mt-1 text-xs text-gray-500">
                    <div className="flex flex-col gap-1">
                      {resource.allocations.map((allocation, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{allocation.projectName}</span>
                          <span>{allocation.utilization}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {overallocationData.length > 3 && (
                <div className="text-right mt-1">
                  <Link to="/allocations" className="text-xs text-blue-600 hover:underline">
                    View {overallocationData.length - 3} more overallocated resources →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Ending Soon Alerts */}
        {endingSoonData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 flex items-center mb-2">
              <Clock className="h-4 w-4 mr-1 text-yellow-500" />
              Allocations Ending Soon
            </h4>
            
            <div className="space-y-2">
              {endingSoonData.slice(0, 3).map(resource => (
                <div key={resource.id} className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                  <Link to={`/resources/${resource.id}`} className="font-medium text-blue-600 hover:underline">
                    {resource.name}
                  </Link>
                  
                  <div className="mt-1 text-xs text-gray-600">
                    <div className="flex flex-col gap-1">
                      {resource.allocations.map((allocation, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span>{allocation.projectName}</span>
                          <div className="flex items-center">
                            <span className="text-yellow-700">
                              {allocation.daysRemaining} {allocation.daysRemaining === 1 ? 'day' : 'days'} left
                            </span>
                            <span className="text-gray-400 mx-1">|</span>
                            <span>{formatDate(allocation.endDate)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {endingSoonData.length > 3 && (
                <div className="text-right mt-1">
                  <Link to="/ending-soon" className="text-xs text-blue-600 hover:underline">
                    View {endingSoonData.length - 3} more ending allocations →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverallocationAlerts;