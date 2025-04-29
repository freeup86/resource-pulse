import React, { useState, useMemo } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { formatDate } from '../../utils/dateUtils';
import { calculateTotalUtilization } from '../../utils/allocationUtils';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { ChevronDown, ChevronRight, List, Rows } from 'lucide-react';

const CustomTimeline = () => {
  const { resources, loading: resourcesLoading, error: resourcesError } = useResources();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const [timeRange, setTimeRange] = useState(3); // Months to display
  const [expandedView, setExpandedView] = useState(false); // Toggle between compact and expanded view
  const [expandedResources, setExpandedResources] = useState({}); // Track which resources are expanded
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
  
  // Get project name by ID
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };
  
  // Process resources to create timeline data structure with multiple rows
  const processResourcesForTimeline = useMemo(() => {
    if (loading) return [];
    
    const result = [];
    
    resources.forEach(resource => {
      // Get all allocations for this resource
      const allocations = resource.allocations || (resource.allocation ? [resource.allocation] : []);
      
      // Group allocations by project
      const projectAllocations = {};
      
      allocations.forEach(allocation => {
        if (!allocation) return;
        
        const projectId = allocation.projectId || 
          (allocation.project ? allocation.project.id : null);
        
        if (!projectId) return;
        
        if (!projectAllocations[projectId]) {
          projectAllocations[projectId] = [];
        }
        
        projectAllocations[projectId].push(allocation);
      });
      
      // Create a row for the resource
      const isExpanded = expandedResources[resource.id] || false;
      result.push({
        type: 'resource',
        resource: resource,
        totalUtilization: calculateTotalUtilization(resource),
        projectAllocations: projectAllocations,
        isExpanded: isExpanded
      });
      
      // Add project allocation rows if this resource is expanded
      if (expandedView && isExpanded) {
        Object.entries(projectAllocations).forEach(([projectId, projectAllocs]) => {
          result.push({
            type: 'allocation',
            resource: resource,
            projectId: parseInt(projectId),
            projectName: getProjectName(parseInt(projectId)),
            allocations: projectAllocs,
            color: getProjectColor(parseInt(projectId))
          });
        });
      }
    });
    
    return result;
  }, [resources, projects, loading, expandedResources, expandedView]);
  
  // Check if a resource has allocations on a specific date
  const getResourceAllocationsOnDate = (resource, date) => {
    if (!resource || (!resource.allocations && !resource.allocation)) return [];
    
    // For backward compatibility, treat single allocation as an array
    const allocations = Array.isArray(resource.allocations) && resource.allocations.length > 0
      ? resource.allocations
      : (resource.allocation ? [resource.allocation] : []);
    
    // Find all allocations that include this date
    return allocations.filter(allocation => {
      if (!allocation) return false;
      
      const allocationStart = new Date(allocation.startDate || new Date());
      const allocationEnd = new Date(allocation.endDate);
      
      return date >= allocationStart && date <= allocationEnd;
    });
  };
  
  // Check if a date is within the allocation
  const isDateInAllocation = (allocation, date) => {
    if (!allocation) return false;
    
    const startDate = new Date(allocation.startDate || new Date());
    const endDate = new Date(allocation.endDate);
    
    return date >= startDate && date <= endDate;
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
    if (allocations && (Array.isArray(allocations) ? allocations.length > 0 : allocations)) {
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        date,
        allocations: Array.isArray(allocations) ? allocations : [allocations]
      });
    }
  };
  
  const hideTooltip = () => {
    setTooltip({
      ...tooltip,
      visible: false
    });
  };
  
  // Toggle expansion of a specific resource
  const toggleResourceExpansion = (resourceId) => {
    setExpandedResources(prev => ({
      ...prev,
      [resourceId]: !prev[resourceId]
    }));
  };
  
  // Toggle between compact and expanded view for all resources
  const toggleViewMode = () => {
    setExpandedView(!expandedView);
    
    // If switching to expanded view, expand all resources by default
    if (!expandedView) {
      const newExpandedState = {};
      resources.forEach(resource => {
        newExpandedState[resource.id] = true;
      });
      setExpandedResources(newExpandedState);
    }
  };
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Resource Timeline</h2>
        <div className="flex space-x-4">
          <div className="flex space-x-2">
            {/* View mode toggle */}
            <button 
              onClick={toggleViewMode}
              className="flex items-center px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              title={expandedView ? "Switch to compact view" : "Switch to expanded view"}
            >
              {expandedView ? (
                <>
                  <List className="h-4 w-4 mr-1" />
                  <span className="text-sm">Compact</span>
                </>
              ) : (
                <>
                  <Rows className="h-4 w-4 mr-1" />
                  <span className="text-sm">Expanded</span>
                </>
              )}
            </button>
          </div>
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
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Timeline header with months and days */}
          <div className="flex">
            <div className="w-48 flex-shrink-0 border-r border-gray-300 bg-gray-50 p-2">
              Resource / Project
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
          
          {/* Timeline body with resources and allocations */}
          {processResourcesForTimeline.map((row, rowIndex) => {
            if (row.type === 'resource') {
              // Resource row (header)
              return (
                <div key={`resource-${row.resource.id}`} className="flex border-b border-gray-200 bg-gray-50">
                  <div className="w-48 flex-shrink-0 border-r border-gray-300 p-2">
                    <div className="flex items-center">
                      {/* Expansion toggle if resource has allocations */}
                      {expandedView && Object.keys(row.projectAllocations).length > 0 && (
                        <button 
                          onClick={() => toggleResourceExpansion(row.resource.id)}
                          className="mr-1"
                        >
                          {row.isExpanded ? 
                            <ChevronDown className="h-4 w-4 text-gray-600" /> : 
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                          }
                        </button>
                      )}
                      <div className="font-medium">{row.resource.name}</div>
                    </div>
                    <div className="text-xs text-gray-500 ml-5">{row.resource.role}</div>
                    
                    {/* Show total utilization if resource has allocations */}
                    {row.totalUtilization > 0 && (
                      <div className="mt-1 text-xs ml-5">
                        <span className="font-medium">Utilization: </span>
                        <span className={row.totalUtilization > 100 ? 'text-red-600 font-bold' : ''}>
                          {row.totalUtilization}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* In compact view, show all allocations in this row */}
                  {!expandedView && (
                    <div className="flex-grow">
                      <div className="flex relative">
                        {timelineData.dateArray.map((date, dIndex) => {
                          const allocations = getResourceAllocationsOnDate(row.resource, date);
                          
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
                          
                          // Check if this is the first day of any allocation
                          const isFirstDay = isFirstDayOfAllocation(row.resource, date, primaryAllocation);
                          
                          // Get project color
                          const projectColor = getProjectColor(projectId);
                          
                          return (
                            <div 
                              key={dIndex}
                              className={`w-[40px] h-16 border-r border-gray-100 ${
                                date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''
                              }`}
                            >
                              <div 
                                className="h-full w-full relative cursor-pointer"
                                style={{
                                  backgroundColor: `${projectColor}40`, // Add transparency
                                  borderLeft: isFirstDay ? `4px solid ${projectColor}` : 'none'
                                }}
                                onMouseEnter={(e) => showTooltip(e, date, allocations)}
                                onMouseLeave={hideTooltip}
                              >
                                {/* Show project name for each segment */}
                                {isFirstDay && (
                                  <div 
                                    className="absolute top-0 left-0 text-xs bg-white bg-opacity-90 p-1 z-10 whitespace-nowrap shadow-sm"
                                    style={{ 
                                      borderLeft: `4px solid ${projectColor}`,
                                      maxWidth: '200px',
                                      overflow: 'visible'
                                    }}
                                  >
                                    {getProjectName(projectId)}
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
                  )}
                  
                  {/* If expanded view but this resource row isn't showing allocations, render empty space */}
                  {expandedView && (
                    <div className="flex-grow h-10"></div>
                  )}
                </div>
              );
            } else if (row.type === 'allocation') {
              // Project allocation row (only in expanded view)
              return (
                <div key={`allocation-${row.resource.id}-${row.projectId}-${rowIndex}`} className="flex border-b border-gray-100">
                  <div className="w-48 flex-shrink-0 border-r border-gray-300 p-2 pl-8">
                    <div className="text-sm flex items-center">
                      <div 
                        className="w-3 h-3 mr-2 flex-shrink-0" 
                        style={{ backgroundColor: row.color }}
                      ></div>
                      <span>{row.projectName}</span>
                    </div>
                    
                    {/* Show utilization for this project */}
                    <div className="text-xs text-gray-500 ml-5">
                      {row.allocations.map(a => a.utilization || 0).reduce((sum, val) => sum + val, 0)}% allocated
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex">
                      {timelineData.dateArray.map((date, dIndex) => {
                        // Find if any allocation for this project is active on this date
                        const activeAllocation = row.allocations.find(allocation => 
                          isDateInAllocation(allocation, date)
                        );
                        
                        // If no allocation is active, render empty cell
                        if (!activeAllocation) {
                          return (
                            <div 
                              key={dIndex}
                              className={`w-[40px] h-10 border-r border-gray-100 ${
                                date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''
                              }`}
                            ></div>
                          );
                        }
                        
                        // Check if this is the first day of the allocation
                        const isFirstDay = isFirstDayOfAllocation(row.resource, date, activeAllocation);
                        
                        return (
                          <div 
                            key={dIndex}
                            className={`w-[40px] h-10 border-r border-gray-100 ${
                              date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''
                            }`}
                          >
                            <div 
                              className="h-full w-full relative cursor-pointer"
                              style={{
                                backgroundColor: `${row.color}40`, // Add transparency
                                borderLeft: isFirstDay ? `4px solid ${row.color}` : 'none'
                              }}
                              onMouseEnter={(e) => showTooltip(e, date, activeAllocation)}
                              onMouseLeave={hideTooltip}
                            >
                              {/* Show allocation details on first day */}
                              {isFirstDay && (
                                <div 
                                  className="absolute top-0 left-0 text-xs bg-white bg-opacity-90 p-1 z-10 whitespace-nowrap shadow-sm"
                                  style={{ 
                                    borderLeft: `4px solid ${row.color}`,
                                    maxWidth: '200px',
                                    overflow: 'visible'
                                  }}
                                >
                                  {activeAllocation.utilization || 0}%
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
            }
            return null;
          })}
          
          {processResourcesForTimeline.length === 0 && (
            <div className="text-center text-gray-500 p-4 border-t border-gray-200">
              No resources available to display in the timeline.
            </div>
          )}
        </div>
      </div>
      
      {/* Tooltip for allocation details */}
      {tooltip.visible && tooltip.allocations && (
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
              
              // Get project name
              const projectName = getProjectName(projectId);
              
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