import React from 'react';
import { Link } from 'react-router-dom';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';

const MiniTimeline = () => {
  const { resources, loading } = useResources();
  const { projects } = useProjects();
  
  // Get the next 14 days
  const getDaysArray = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  };
  
  const days = getDaysArray();
  
  // Get top 5 resources with allocations
  const getTopResources = () => {
    return resources
      .filter(r => r.allocation)
      .sort((a, b) => {
        // Sort by end date (ascending)
        const dateA = new Date(a.allocation.endDate);
        const dateB = new Date(b.allocation.endDate);
        return dateA - dateB;
      })
      .slice(0, 5);
  };
  
  // Check if resource is allocated on a date
  const isAllocated = (resource, date) => {
    if (!resource.allocation) return false;
    
    const startDate = new Date(resource.allocation.startDate || new Date());
    const endDate = new Date(resource.allocation.endDate);
    
    return date >= startDate && date <= endDate;
  };
  
  // Get project color
  const getProjectColor = (projectId) => {
    const colors = [
      '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
      '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E'
    ];
    return colors[projectId % colors.length];
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  const topResources = getTopResources();
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Allocation Preview</h3>
        <Link to="/timeline" className="text-sm text-blue-600 hover:underline">
          View Full Timeline
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header */}
          <div className="flex">
            <div className="w-32 flex-shrink-0 p-2 font-medium text-gray-500">Resource</div>
            <div className="flex-grow flex">
              {days.map((day, index) => (
                <div 
                  key={index} 
                  className={`w-6 text-center text-xs ${
                    day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-100' : ''
                  }`}
                >
                  {day.getDate()}
                </div>
              ))}
            </div>
          </div>
          
          {/* Timeline rows */}
          {topResources.map(resource => (
            <div key={resource.id} className="flex border-t border-gray-100">
              <div className="w-32 flex-shrink-0 p-2 truncate">
                <Link to={`/resources/${resource.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                  {resource.name}
                </Link>
              </div>
              <div className="flex-grow flex">
                {days.map((day, index) => {
                  const allocated = isAllocated(resource, day);
                  const project = allocated 
                    ? projects.find(p => p.id === resource.allocation.projectId) 
                    : null;
                  
                  return (
                    <div 
                      key={index} 
                      className={`w-6 h-8 ${
                        day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-50' : ''
                      }`}
                    >
                      {allocated && (
                        <div 
                          className="h-full w-full" 
                          style={{ 
                            backgroundColor: getProjectColor(resource.allocation.projectId) + '40',
                            borderLeft: index === 0 || !isAllocated(resource, days[index-1]) 
                              ? `2px solid ${getProjectColor(resource.allocation.projectId)}` 
                              : 'none'
                          }}
                          title={project ? `${project.name} (${resource.allocation.utilization}%)` : ''}
                        ></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {topResources.length === 0 && (
            <div className="text-center text-gray-500 py-4 border-t border-gray-100">
              No allocated resources to display.
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-3 text-right">
        <Link to="/timeline" className="text-sm text-blue-600 hover:underline">
          View all resources in timeline →
        </Link>
      </div>
    </div>
  );
};

export default MiniTimeline;