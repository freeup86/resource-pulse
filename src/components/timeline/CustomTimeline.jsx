import React, { useState } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const CustomTimeline = () => {
  const { resources, loading: resourcesLoading, error: resourcesError } = useResources();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const [timeRange, setTimeRange] = useState(3); // Months to display
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    date: null,
    allocations: []
  });
  
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
  
  // Check if a resource has allocations on a specific date
  const getResourceAllocationsOnDate = (resource, date) => {
    // Check if resource has an allocation property and it's a non-null object
    if (!resource || !resource.allocation) return [];
    
    // For backward compatibility, treat single allocation as an array
    const allocations = Array.isArray(resource.allocations) ? resource.allocations : [resource.allocation];
    
    // Find all allocations that include this date
    return allocations.filter(allocation => {
      if (!allocation) return false;
      
      const allocationStart = new Date(allocation.startDate || new Date());
      const allocationEnd = new Date(allocation.endDate);
      
      return date >= allocationStart && date <= allocationEnd;
    });
  };
  
  // Check if this is the first day of any allocation
  const isFirstDayOfAllocation = (resource, date, allocation) => {
    if (!allocation) return false;
    
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    
    const prevAllocations = getResourceAllocationsOnDate(resource, prevDate);
    
    // Check if this allocation wasn't active on the previous day
    return !prevAllocations.some(prevAlloc => 
      // Safely compare allocations, handling potential missing IDs
      prevAlloc && allocation && 
      ((prevAlloc.id && allocation.id && prevAlloc.id === allocation.id) ||
       // Fallback to comparing by project if IDs aren't available
       (prevAlloc.projectId && allocation.projectId && 
        prevAlloc.projectId === allocation.projectId))
    );
  };
  
  // Show tooltip with allocation details
  const showTooltip = (e, date, allocations) => {
    if (allocations && allocations.length > 0) {
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        date,
        allocations
      });
    }
  };
  
  const hideTooltip = () => {
    setTooltip({
      ...tooltip,
      visible: false
    });
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
                    style={{ width: `${month.days.length * 40}px` }}
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
                    className={`w-[40px] text-center text-xs py-1 ${
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
          {resources.map((resource) => {
            // For backward compatibility, handle both allocation and allocations
            const allocationData = resource.allocations || (resource.allocation ? [resource.allocation] : []);
            
            // Calculate total utilization for the resource
            const totalUtilization = allocationData.reduce((total, alloc) => 
              alloc ? total + (alloc.utilization || 0) : total, 0);
              
            return (
              <div key={resource.id} className="flex border-b border-gray-200">
                <div className="w-48 flex-shrink-0 border-r border-gray-300 p-2">
                  <div className="font-medium">{resource.name}</div>
                  <div className="text-xs text-gray-500">{resource.role}</div>
                  
                  {/* Show total utilization if resource has allocations */}
                  {totalUtilization > 0 && (
                    <div className="mt-1 text-xs">
                      <span className="font-medium">Utilization: </span>
                      {totalUtilization}%
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex">
                    {timelineData.dateArray.map((date, dIndex) => {
                      const allocations = getResourceAllocationsOnDate(resource, date);
                      
                      // If no allocations for this date, render empty cell
                      if (!allocations.length) {
                        return (
                          <div 
                            key={dIndex}
                            className={`w-[40px] h-16 border-r border-gray-100 ${
                              date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''
                            }`}
                          ></div>
                        );
                      }
                      
                      // Sort allocations by utilization (highest first)
                      allocations.sort((a, b) => (b.utilization || 0) - (a.utilization || 0));
                      
                      // Get the primary allocation (highest utilization)
                      const primaryAllocation = allocations[0];
                      
                      // Get project info - handle potential structure differences
                      const projectId = primaryAllocation.projectId || 
                        (primaryAllocation.project ? primaryAllocation.project.id : null);
                      
                      const projectName = primaryAllocation.project?.name || 
                        (projectId ? projects.find(p => p.id === projectId)?.name || 'Unknown Project' : 'Unknown Project');
                      
                      // Check if this is the first day of any allocation
                      const isFirstDay = allocations.some(allocation => 
                        isFirstDayOfAllocation(resource, date, allocation));
                      
                      return (
                        <div 
                          key={dIndex}
                          className={`w-[40px] h-16 border-r border-gray-100 ${
                            date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''
                          }`}
                        >
                          <div 
                            className="h-full w-full relative"
                            style={{
                              backgroundColor: getProjectColor(projectId) + '40', // Add transparency
                              borderLeft: isFirstDay ? `4px solid ${getProjectColor(projectId)}` : 'none'
                            }}
                            onMouseEnter={(e) => showTooltip(e, date, allocations)}
                            onMouseLeave={hideTooltip}
                          >
                            {/* First day of allocation shows project name */}
                            {isFirstDay && (
                              <div className="absolute top-0 left-0 text-xs bg-white bg-opacity-90 p-1 z-10 whitespace-nowrap shadow-sm"
                                   style={{ 
                                     borderLeft: `4px solid ${getProjectColor(projectId)}`,
                                     maxWidth: '200px',
                                     overflow: 'visible'
                                   }}>
                                {projectName}
                                {allocations.length > 1 ? ` +${allocations.length - 1}` : ''}
                              </div>
                            )}
                            
                            {/* Show multiple allocation indicator */}
                            {allocations.length > 1 && (
                              <div className="absolute bottom-1 right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-gray-300">
                                {allocations.length}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          
          {resources.length === 0 && (
            <div className="text-center text-gray-500 p-4 border-t border-gray-200">
              No resources available to display in the timeline.
            </div>
          )}
        </div>
      </div>
      
      {/* Tooltip for allocation details */}
      {tooltip.visible && (
        <div 
          className="fixed bg-white shadow-lg rounded p-2 z-50 border border-gray-200"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`,
            maxWidth: '300px'
          }}
        >
          <h4 className="font-bold text-sm mb-1">Allocations on {formatDate(tooltip.date)}</h4>
          <div className="space-y-2">
            {tooltip.allocations.map((allocation, idx) => {
              // Handle different allocation structures
              const projectId = allocation.projectId || 
                (allocation.project ? allocation.project.id : null);
              
              const projectName = allocation.project?.name || 
                (projectId ? projects.find(p => p.id === projectId)?.name || 'Unknown Project' : 'Unknown Project');
              
              return (
                <div key={idx} className="text-xs border-t pt-1 first:border-0 first:pt-0">
                  <div className="font-medium">{projectName}</div>
                  <div className="flex justify-between">
                    <span>Utilization:</span>
                    <span>{allocation.utilization || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>End Date:</span>
                    <span>{formatDate(allocation.endDate)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTimeline;