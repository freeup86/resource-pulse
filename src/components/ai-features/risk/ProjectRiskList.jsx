import React from 'react';

const ProjectRiskList = ({ 
  projects, 
  selectedProjectId, 
  onProjectSelect,
  sortBy,
  sortDirection,
  onSortChange
}) => {
  // Function to determine risk level color
  const getRiskColor = (riskLevel) => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get sort indicator
  const getSortIndicator = (field) => {
    if (sortBy !== field) return null;
    
    return sortDirection === 'asc' 
      ? <span className="ml-1">↑</span> 
      : <span className="ml-1">↓</span>;
  };

  return (
    <div className="overflow-hidden">
      {/* Table header */}
      <div className="bg-gray-50 p-3 border-b">
        <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
          <button 
            className="col-span-5 text-left flex items-center"
            onClick={() => onSortChange('name')}
          >
            Project {getSortIndicator('name')}
          </button>
          <button
            className="col-span-4 text-left flex items-center"
            onClick={() => onSortChange('client')}
          >
            Client {getSortIndicator('client')}
          </button>
          <button
            className="col-span-3 text-left flex items-center"
            onClick={() => onSortChange('riskLevel')}
          >
            Risk {getSortIndicator('riskLevel')}
          </button>
        </div>
      </div>
      
      {/* Empty state */}
      {projects.length === 0 && (
        <div className="p-6 text-center">
          <p className="text-gray-500">No projects found</p>
        </div>
      )}
      
      {/* Project list */}
      <div className="overflow-y-auto max-h-[600px]">
        {projects.map((project) => (
          <div 
            key={project.id}
            className={`border-b last:border-b-0 cursor-pointer transition-colors ${
              selectedProjectId === project.id 
                ? 'bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onProjectSelect(project.id)}
          >
            <div className="p-3 grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <h3 className="font-medium text-gray-900 line-clamp-1">{project.name}</h3>
                <p className="text-xs text-gray-500">
                  {new Date(project.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="col-span-4 overflow-hidden">
                <p className="text-sm text-gray-700 truncate">{project.client}</p>
              </div>
              <div className="col-span-3">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(project.riskLevel)}`}>
                  {project.riskLevel}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectRiskList;