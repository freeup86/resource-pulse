import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SatisfactionOverview = ({ 
  predictions, 
  selectedProjectId, 
  onProjectSelect, 
  onFilterChange, 
  currentFilter 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ensure predictions is an array
  const predictionsArray = Array.isArray(predictions.predictions) 
    ? predictions.predictions 
    : (Array.isArray(predictions) ? predictions : []);
  
  // Calculate satisfaction statistics
  const atRiskCount = predictionsArray.filter(p => p.status === 'at_risk').length;
  const needsAttentionCount = predictionsArray.filter(p => p.status === 'needs_attention').length;
  const satisfiedCount = predictionsArray.filter(p => p.status === 'satisfied').length;
  const totalCount = predictionsArray.length;
  
  // Satisfaction score percentages for chart
  const atRiskPercentage = (atRiskCount / totalCount) * 100 || 0;
  const needsAttentionPercentage = (needsAttentionCount / totalCount) * 100 || 0;
  const satisfiedPercentage = (satisfiedCount / totalCount) * 100 || 0;
  
  // Filter projects based on search and filter
  const filteredProjects = predictionsArray.filter(project => {
    const searchMatch = searchTerm === '' || 
      (project.name && project.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.client && project.client.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const statusMatch = currentFilter === 'all' || project.status === currentFilter;
    
    return searchMatch && statusMatch;
  });
  
  // Sort projects by satisfaction score (ascending)
  const sortedProjects = [...filteredProjects].sort((a, b) => 
    (a.satisfactionScore || 0) - (b.satisfactionScore || 0)
  );
  
  // Function to get color class based on status
  const getStatusColor = (status) => {
    switch(status) {
      case 'at_risk':
        return 'bg-red-100 text-red-800';
      case 'needs_attention':
        return 'bg-yellow-100 text-yellow-800';
      case 'satisfied':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Function to get badge label based on status
  const getStatusLabel = (status) => {
    switch(status) {
      case 'at_risk':
        return 'At Risk';
      case 'needs_attention':
        return 'Needs Attention';
      case 'satisfied':
        return 'Satisfied';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Satisfaction Summary Cards */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Satisfaction Overview</h2>
        
        <div className="flex mb-4 h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="bg-red-500"
            style={{ width: `${atRiskPercentage}%` }}
            title={`At Risk: ${atRiskCount} projects (${atRiskPercentage.toFixed(1)}%)`}
          ></div>
          <div 
            className="bg-yellow-500"
            style={{ width: `${needsAttentionPercentage}%` }}
            title={`Needs Attention: ${needsAttentionCount} projects (${needsAttentionPercentage.toFixed(1)}%)`}
          ></div>
          <div 
            className="bg-green-500"
            style={{ width: `${satisfiedPercentage}%` }}
            title={`Satisfied: ${satisfiedCount} projects (${satisfiedPercentage.toFixed(1)}%)`}
          ></div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-red-600">{atRiskCount}</div>
            <div className="text-xs text-gray-500">At Risk</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{needsAttentionCount}</div>
            <div className="text-xs text-gray-500">Needs Attention</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{satisfiedCount}</div>
            <div className="text-xs text-gray-500">Satisfied</div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              currentFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => onFilterChange('all')}
          >
            All
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              currentFilter === 'at_risk' 
                ? 'bg-red-600 text-white' 
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
            onClick={() => onFilterChange('at_risk')}
          >
            At Risk
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              currentFilter === 'needs_attention' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
            onClick={() => onFilterChange('needs_attention')}
          >
            Needs Attention
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              currentFilter === 'satisfied' 
                ? 'bg-green-600 text-white' 
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
            onClick={() => onFilterChange('satisfied')}
          >
            Satisfied
          </button>
        </div>
      </div>
      
      {/* Projects List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Projects</h3>
            <span className="text-sm text-gray-500">
              {filteredProjects.length} of {predictionsArray.length} projects
            </span>
          </div>
        </div>
        
        {filteredProjects.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No projects match your search criteria.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
            {sortedProjects.map((project) => (
              <div 
                key={project.id}
                className={`p-4 cursor-pointer ${
                  selectedProjectId === project.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => onProjectSelect(project.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-900">
                        {project.name}
                      </h4>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{project.client}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-lg">
                      {project.satisfactionScore}/100
                    </div>
                    <div className="text-xs text-gray-500">satisfaction score</div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        project.satisfactionScore >= 70 ? 'bg-green-500' :
                        project.satisfactionScore >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${project.satisfactionScore}%` }}
                    ></div>
                  </div>
                </div>
                
                {project.keyInsight && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{project.keyInsight}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SatisfactionOverview;