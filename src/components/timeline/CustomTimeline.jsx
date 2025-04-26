import React, { useState } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const CustomTimeline = () => {
  const { resources, loading: resourcesLoading, error: resourcesError } = useResources();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const [timeRange, setTimeRange] = useState(3); // Months to display
  
  const loading = resourcesLoading || projectsLoading;
  const error = resourcesError || projectsError;
  
  // Generate timeline data
  const generateTimelineData = () => {
    // Create date range
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + timeRange);
    
    // Get all dates in range
    const dateArray = [];
    let currentDate = new Date(today);
    
    while (currentDate <= endDate) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Group dates by month for header
    const months = {};
    dateArray.forEach(date => {
      const monthYearKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!months[monthYearKey]) {
        months[monthYearKey] = {
          name: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
          days: []
        };
      }
      months[monthYearKey].days.push(date);
    });
    
    return {
      dateArray,
      months: Object.values(months)
    };
  };
  
  const timelineData = generateTimelineData();
  
  // Generate colors for projects
  const getProjectColor = (projectId) => {
    const colors = [
      '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
      '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E'
    ];
    return colors[projectId % colors.length];
  };
  
  // Check if a resource is allocated on a specific date
  const isResourceAllocated = (resource, date) => {
    if (!resource.allocation) return false;
    
    const allocationStart = new Date(resource.allocation.startDate || new Date());
    const allocationEnd = new Date(resource.allocation.endDate);
    
    return date >= allocationStart && date <= allocationEnd;
  };
  
  // Get project info for a resource on a specific date
  const getResourceAllocationOnDate = (resource, date) => {
    if (!isResourceAllocated(resource, date)) return null;
    
    const project = projects.find(p => p.id === resource.allocation.projectId);
    return {
      project,
      color: getProjectColor(resource.allocation.projectId),
      utilization: resource.allocation.utilization
    };
  };
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Resource Timeline</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setTimeRange(1)}
            className={`px-3 py-1 rounded ${timeRange === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            1 Month
          </button>
          <button 
            onClick={() => setTimeRange(3)}
            className={`px-3 py-1 rounded ${timeRange === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            3 Months
          </button>
          <button 
            onClick={() => setTimeRange(6)}
            className={`px-3 py-1 rounded ${timeRange === 6 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            6 Months
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Timeline header with months and days */}
          <div className="flex">
            <div className="w-48 flex-shrink-0 border-r border-gray-300 bg-gray-50 p-2">
              Resource
            </div>
            <div className="flex-grow">
              {/* Months header */}
              <div className="flex">
                {timelineData.months.map((month, mIndex) => (
                  <div 
                    key={mIndex}
                    className="border-b border-gray-300 bg-gray-50 font-semibold text-center"
                    style={{ width: `${month.days.length * 30}px` }}
                  >
                    {month.name}
                  </div>
                ))}
              </div>
              
              {/* Days header */}
              <div className="flex border-b border-gray-300 bg-gray-50">
                {timelineData.dateArray.map((date, dIndex) => (
                  <div 
                    key={dIndex}
                    className={`w-[30px] text-center text-xs py-1 ${
                      date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-100' : ''
                    }`}
                  >
                    {date.getDate()}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Timeline body with resources */}
          {resources.map((resource) => (
            <div key={resource.id} className="flex border-b border-gray-200">
              <div className="w-48 flex-shrink-0 border-r border-gray-300 p-2">
                <div className="font-medium">{resource.name}</div>
                <div className="text-xs text-gray-500">{resource.role}</div>
              </div>
              <div className="flex-grow">
                <div className="flex">
                  {timelineData.dateArray.map((date, dIndex) => {
                    const allocation = getResourceAllocationOnDate(resource, date);
                    return (
                      <div 
                        key={dIndex}
                        className={`w-[30px] h-16 border-r border-gray-100 ${
                          date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''
                        }`}
                      >
                        {allocation && (
                          <div 
                            className="h-full w-full flex items-center justify-center"
                            style={{
                              backgroundColor: allocation.color + '40', // Add transparency
                              borderLeft: dIndex === 0 || !getResourceAllocationOnDate(resource, timelineData.dateArray[dIndex-1]) 
                                ? `4px solid ${allocation.color}` 
                                : 'none'
                            }}
                            title={`${allocation.project.name} (${allocation.utilization}%)`}
                          >
                            {/* First day of allocation shows project abbreviation */}
                            {(dIndex === 0 || !getResourceAllocationOnDate(resource, timelineData.dateArray[dIndex-1])) && (
                              <span className="text-xs font-bold">
                                {allocation.project.name.substr(0, 2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {resources.length === 0 && (
            <div className="text-center text-gray-500 p-4 border-t border-gray-200">
              No resources available to display in the timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomTimeline;