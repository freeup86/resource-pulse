import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useResources } from '../../contexts/ResourceContext';
import { calculateTotalUtilization } from '../../utils/allocationUtils';
import { subMonths, addMonths, eachMonthOfInterval, format } from 'date-fns';

const ResourceAvailabilityHeatmap = () => {
  const { resources, loading } = useResources();
  
  // Generate months for the heatmap (3 months before and 6 months after current month)
  const months = useMemo(() => {
    const today = new Date();
    const startDate = subMonths(today, 3);
    const endDate = addMonths(today, 6);
    
    return eachMonthOfInterval({ start: startDate, end: endDate });
  }, []);
  
  // Format month for display
  const formatMonth = (date) => {
    return format(date, 'MMM');
  };
  
  // Calculate availability cell color based on utilization
  const getCellColor = (utilization) => {
    if (utilization >= 100) return 'bg-red-500'; // Fully allocated
    if (utilization >= 80) return 'bg-orange-400'; // Near capacity
    if (utilization >= 50) return 'bg-yellow-300'; // Moderate allocation
    if (utilization >= 20) return 'bg-green-300'; // Low allocation
    return 'bg-green-200'; // Mostly available
  };
  
  // Prepare data for the heatmap
  const heatmapData = useMemo(() => {
    // Only use top 10 resources for the heatmap to avoid overcrowding
    const topResources = resources
      .slice(0, 12) // Get top 12 resources
      .map(resource => {
        const utilization = calculateTotalUtilization(resource);
        
        return {
          id: resource.id,
          name: resource.name,
          role: resource.role,
          utilization: utilization,
          // Generate utilization predictions for future months
          // This is a simple simulation - in a real app, this would use more sophisticated forecasting
          monthlyUtilization: months.map((month, index) => {
            // Current month based on resource's current utilization
            if (index === 3) return utilization;
            
            // Past months slightly different from current
            if (index < 3) {
              return Math.max(0, Math.min(100, utilization + (Math.random() * 20 - 10)));
            }
            
            // Future months with decreasing utilization to simulate project endings
            // Adjust the decay factor to control how quickly utilization drops
            const decayFactor = 0.85; // 15% drop per month forward
            const monthsForward = index - 3;
            let futureUtilization = utilization * Math.pow(decayFactor, monthsForward);
            
            // Add some randomness for realistic variation
            futureUtilization += (Math.random() * 10 - 5);
            
            // Ensure within bounds
            return Math.max(0, Math.min(100, futureUtilization));
          })
        };
      });
      
    return topResources;
  }, [resources, months]);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Resource Availability Heatmap</h3>
        <Link to="/resources" className="text-sm text-blue-600 hover:underline">
          View All Resources
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          {/* Header */}
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Resource</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Current</th>
              {months.map((month, idx) => (
                <th 
                  key={idx} 
                  className={`px-2 py-2 text-center text-xs font-medium text-gray-500 ${
                    idx === 3 ? 'bg-blue-50 border-b-2 border-blue-200' : ''
                  }`}
                >
                  {formatMonth(month)}
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody>
            {heatmapData.length > 0 ? (
              heatmapData.map((resource) => (
                <tr key={resource.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <Link to={`/resources/${resource.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {resource.name}
                    </Link>
                    <div className="text-xs text-gray-500">{resource.role}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm font-medium">{Math.round(resource.utilization)}%</div>
                  </td>
                  {resource.monthlyUtilization.map((util, idx) => (
                    <td key={idx} className="px-1 py-1 text-center">
                      <div 
                        className={`h-6 w-12 rounded ${getCellColor(util)} flex items-center justify-center mx-auto`}
                        title={`${Math.round(util)}% allocated in ${formatMonth(months[idx])}`}
                      >
                        <span className="text-xs font-medium text-gray-800">
                          {Math.round(util)}%
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={months.length + 2} className="px-4 py-4 text-center text-gray-500">
                  No resource data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-red-500 rounded mr-1"></div>
            <span>100%+ (Overallocated)</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-orange-400 rounded mr-1"></div>
            <span>80-99% (Near capacity)</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-yellow-300 rounded mr-1"></div>
            <span>50-79% (Partial)</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-300 rounded mr-1"></div>
            <span>20-49% (Available)</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-200 rounded mr-1"></div>
            <span>0-19% (Open)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceAvailabilityHeatmap;