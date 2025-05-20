// src/components/analytics/AvailabilityForecast.jsx
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate } from '../../utils/dateUtils';

const AvailabilityForecast = ({ resources }) => {
  // Generate forecast data
  const forecastData = useMemo(() => {
    // Get all end dates from allocations
    const allEndDates = [];
    
    resources.forEach(resource => {
      const allocations = resource.allocations || [];
      allocations.forEach(allocation => {
        if (allocation.endDate) {
          allEndDates.push({
            date: new Date(allocation.endDate),
            resourceId: resource.id,
            utilization: allocation.utilization || 0
          });
        }
      });
    });
    
    // Sort end dates
    allEndDates.sort((a, b) => a.date - b.date);
    
    // Only consider future dates
    const today = new Date();
    const futureEndDates = allEndDates.filter(item => item.date >= today);
    
    // Generate date range for next 90 days
    const forecastDays = 90;
    const forecastEnd = new Date();
    forecastEnd.setDate(today.getDate() + forecastDays);
    
    // Create a map of resources and their allocation end dates
    const resourceEndDates = {};
    resources.forEach(resource => {
      const allocations = resource.allocations || [];
      if (allocations.length > 0) {
        // Find the latest end date for this resource
        const latestEndDate = new Date(Math.max(
          ...allocations.map(a => new Date(a.endDate).getTime())
        ));
        resourceEndDates[resource.id] = latestEndDate;
      }
    });
    
    // Generate daily data points
    const dailyData = [];
    let availableCount = resources.filter(r => !(r.allocations && r.allocations.length > 0)).length;
    
    for (let i = 0; i <= forecastDays; i++) {
      const currentDate = new Date();
      currentDate.setDate(today.getDate() + i);
      
      // Check for resources becoming available on this date
      const becomingAvailable = Object.entries(resourceEndDates)
        .filter(([id, endDate]) => {
          const endDateDay = new Date(endDate);
          endDateDay.setHours(0, 0, 0, 0);
          const currentDay = new Date(currentDate);
          currentDay.setHours(0, 0, 0, 0);
          return endDateDay.getTime() === currentDay.getTime();
        })
        .length;
      
      availableCount += becomingAvailable;
      
      dailyData.push({
        date: formatDate(currentDate),
        available: availableCount,
        newlyAvailable: becomingAvailable
      });
    }
    
    return dailyData;
  }, [resources]);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">Resource Availability Forecast</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={forecastData}
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => {
                // Handle string values safely
                if (typeof value === 'string' && value.includes(', ')) {
                  const parts = value.split(', ');
                  return parts[0];
                }
                // Return the value as is if it's not a string with the expected format
                return value;
              }}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="available" name="Available Resources" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AvailabilityForecast;