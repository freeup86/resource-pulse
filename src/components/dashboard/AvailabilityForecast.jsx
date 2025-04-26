import React, { useMemo } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { formatDate } from '../../utils/dateUtils';

const AvailabilityForecast = () => {
  const { resources, loading } = useResources();
  
  // Generate forecast for the next 3 months
  const forecast = useMemo(() => {
    if (loading) return [];
    
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);
    
    // Group resources by end date
    const byEndDate = {};
    
    resources.forEach(resource => {
      if (resource.allocation) {
        const endDate = new Date(resource.allocation.endDate);
        
        // Only include resources ending within the next 3 months
        if (endDate >= today && endDate <= threeMonthsLater) {
          const dateKey = endDate.toISOString().split('T')[0];
          
          if (!byEndDate[dateKey]) {
            byEndDate[dateKey] = [];
          }
          
          byEndDate[dateKey].push(resource);
        }
      }
    });
    
    // Convert to array and sort by date
    return Object.entries(byEndDate)
      .map(([dateStr, resources]) => ({
        date: new Date(dateStr),
        resources
      }))
      .sort((a, b) => a.date - b.date);
  }, [resources, loading]);
  
  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded"></div>;
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Availability</h3>
      
      {forecast.length > 0 ? (
        <div className="space-y-4">
          {forecast.map((forecastItem, index) => (
            <div key={index} className="border-b border-gray-200 pb-3 last:border-0">
              <h4 className="font-medium text-sm text-gray-900">
                {formatDate(forecastItem.date)}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({forecastItem.resources.length} resource{forecastItem.resources.length !== 1 ? 's' : ''})
                </span>
              </h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {forecastItem.resources.map(resource => (
                  <div 
                    key={resource.id} 
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {resource.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 my-8">
          No resources becoming available in the next 3 months.
        </div>
      )}
    </div>
  );
};

export default AvailabilityForecast;