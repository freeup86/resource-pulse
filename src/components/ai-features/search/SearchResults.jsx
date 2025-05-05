import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SkillTag from '../../common/SkillTag';
import StatusBadge from '../../common/StatusBadge';
import UtilizationBar from '../../common/UtilizationBar';

const SearchResults = ({ results }) => {
  const [activeTab, setActiveTab] = useState('all');
  
  // Validate results object structure
  const validResults = results && typeof results === 'object';
  
  // Check for results at both top level and within results property
  // This handles both direct API response and processed format
  const resources = results?.resources || results?.results?.resources || [];
  const projects = results?.projects || results?.results?.projects || [];
  const skills = results?.skills || results?.results?.skills || [];
  const allocations = results?.allocations || results?.results?.allocations || [];
  
  console.log('Results structure:', {
    hasTopLevelResults: !!(results?.resources || results?.projects || results?.skills || results?.allocations),
    hasNestedResults: !!(results?.results?.resources || results?.results?.projects || 
                        results?.results?.skills || results?.results?.allocations),
    resourcesLength: resources?.length || 0,
    projectsLength: projects?.length || 0,
    skillsLength: skills?.length || 0,
    allocationsLength: allocations?.length || 0
  });
  
  const hasResults = validResults && (
    resources.length > 0 || projects.length > 0 || skills.length > 0 || allocations.length > 0
  );
  
  // Count results by type using our normalized variables
  const resultCounts = {
    all: resources.length + projects.length + skills.length + allocations.length,
    resources: resources.length || 0,
    projects: projects.length || 0,
    skills: skills.length || 0,
    allocations: allocations.length || 0
  };
  
  // Function to get the proper link for each entity type
  const getEntityLink = (type, item) => {
    switch (type) {
      case 'resources':
        return `/resources/${item.id}`;
      case 'projects':
        return `/projects/${item.id}`;
      case 'allocations':
        return `/allocations#${item.id}`;
      case 'skills':
        return `/skills/${item.id}`;
      default:
        return '#';
    }
  };

  // Render resource item
  const renderResourceItem = (resource) => (
    <div className="p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <div>
          <Link to={`/resources/${resource.id}`} className="text-blue-600 hover:underline font-medium">
            {resource.name}
          </Link>
          <p className="text-sm text-gray-600">{resource.title}</p>
        </div>
        <StatusBadge status={resource.status} />
      </div>
      
      {resource.skills && resource.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {resource.skills.map((skill, index) => (
            <SkillTag key={index} skill={skill} />
          ))}
        </div>
      )}
      
      <div className="mt-3">
        <div className="text-xs text-gray-500 mb-1">Utilization</div>
        <UtilizationBar utilization={resource.utilization} />
      </div>
      
      {resource.highlight && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-sm">
          <span className="font-medium text-yellow-800">AI Match:</span> {resource.highlight}
        </div>
      )}
    </div>
  );

  // Render project item
  const renderProjectItem = (project) => (
    <div className="p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <div>
          <Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline font-medium">
            {project.name}
          </Link>
          <p className="text-sm text-gray-600">{project.client}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
        <div>
          <span className="text-gray-500">Start:</span> {new Date(project.startDate).toLocaleDateString()}
        </div>
        <div>
          <span className="text-gray-500">End:</span> {new Date(project.endDate).toLocaleDateString()}
        </div>
      </div>
      
      {project.highlight && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-sm">
          <span className="font-medium text-yellow-800">AI Match:</span> {project.highlight}
        </div>
      )}
    </div>
  );

  // Render allocation item
  const renderAllocationItem = (allocation) => (
    <div className="p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium">{allocation.resourceName} → {allocation.projectName}</p>
          <p className="text-sm text-gray-600">{allocation.percentage}% allocation</p>
        </div>
        <div className="text-sm">
          {new Date(allocation.startDate).toLocaleDateString()} - {new Date(allocation.endDate).toLocaleDateString()}
        </div>
      </div>
      
      <div className="mt-2 flex gap-2">
        <Link to={`/resources/${allocation.resourceId}`} className="text-blue-600 hover:underline text-sm">
          View Resource
        </Link>
        <span className="text-gray-300">|</span>
        <Link to={`/projects/${allocation.projectId}`} className="text-blue-600 hover:underline text-sm">
          View Project
        </Link>
      </div>
      
      {allocation.highlight && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-sm">
          <span className="font-medium text-yellow-800">AI Match:</span> {allocation.highlight}
        </div>
      )}
    </div>
  );

  // Render skill item
  const renderSkillItem = (skill) => (
    <div className="p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium">{skill.name}</p>
          <p className="text-sm text-gray-600">{skill.category}</p>
        </div>
        <SkillTag skill={skill} />
      </div>
      
      {skill.resources && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">Resources with this skill: {skill.resources.length}</p>
        </div>
      )}
      
      {skill.highlight && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-sm">
          <span className="font-medium text-yellow-800">AI Match:</span> {skill.highlight}
        </div>
      )}
    </div>
  );

  // Function to render results based on active tab
  const renderResults = () => {
    if (activeTab === 'all') {
      return (
        <div className="space-y-8">
          {/* Resources */}
          {resources.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.slice(0, 4).map((resource, index) => (
                  <div key={index}>{renderResourceItem(resource)}</div>
                ))}
              </div>
              {resources.length > 4 && (
                <div className="mt-2 text-right">
                  <button 
                    className="text-blue-600 hover:underline text-sm"
                    onClick={() => setActiveTab('resources')}
                  >
                    View all {resources.length} resources →
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.slice(0, 4).map((project, index) => (
                  <div key={index}>{renderProjectItem(project)}</div>
                ))}
              </div>
              {projects.length > 4 && (
                <div className="mt-2 text-right">
                  <button 
                    className="text-blue-600 hover:underline text-sm"
                    onClick={() => setActiveTab('projects')}
                  >
                    View all {projects.length} projects →
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Allocations */}
          {allocations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Allocations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allocations.slice(0, 4).map((allocation, index) => (
                  <div key={index}>{renderAllocationItem(allocation)}</div>
                ))}
              </div>
              {allocations.length > 4 && (
                <div className="mt-2 text-right">
                  <button 
                    className="text-blue-600 hover:underline text-sm"
                    onClick={() => setActiveTab('allocations')}
                  >
                    View all {allocations.length} allocations →
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Skills</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {skills.slice(0, 6).map((skill, index) => (
                  <div key={index}>{renderSkillItem(skill)}</div>
                ))}
              </div>
              {skills.length > 6 && (
                <div className="mt-2 text-right">
                  <button 
                    className="text-blue-600 hover:underline text-sm"
                    onClick={() => setActiveTab('skills')}
                  >
                    View all {skills.length} skills →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    } else if (activeTab === 'resources' && resources.length > 0) {
      return (
        <div>
          <h3 className="text-lg font-semibold mb-3">Resources ({resources.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((resource, index) => (
              <div key={index}>{renderResourceItem(resource)}</div>
            ))}
          </div>
        </div>
      );
    } else if (activeTab === 'projects' && projects.length > 0) {
      return (
        <div>
          <h3 className="text-lg font-semibold mb-3">Projects ({projects.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project, index) => (
              <div key={index}>{renderProjectItem(project)}</div>
            ))}
          </div>
        </div>
      );
    } else if (activeTab === 'allocations' && allocations.length > 0) {
      return (
        <div>
          <h3 className="text-lg font-semibold mb-3">Allocations ({allocations.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allocations.map((allocation, index) => (
              <div key={index}>{renderAllocationItem(allocation)}</div>
            ))}
          </div>
        </div>
      );
    } else if (activeTab === 'skills' && skills.length > 0) {
      return (
        <div>
          <h3 className="text-lg font-semibold mb-3">Skills ({skills.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {skills.map((skill, index) => (
              <div key={index}>{renderSkillItem(skill)}</div>
            ))}
          </div>
        </div>
      );
    }
    
    return <div className="text-center p-8 text-gray-500">No results found</div>;
  };

  // If we don't have valid results or no results found, show a message
  if (!validResults || !hasResults) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
          <p className="text-gray-500">Try modifying your search or using different keywords.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Notice or AI Analysis Summary */}
      {results?.notice && (
        <div className="p-6 border-b bg-yellow-50">
          <h2 className="text-lg font-semibold mb-2">Notice</h2>
          <p className="text-gray-700">{results.notice}</p>
          {results.errors && results.errors.length > 0 && (
            <div className="mt-2 text-sm text-amber-700">
              <p>Some errors occurred during search:</p>
              <ul className="list-disc pl-5 mt-1">
                {results.errors.map((error, index) => (
                  <li key={index}>{error.message || error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {results?.aiAnalysis && !results?.notice && (
        <div className="p-6 border-b bg-blue-50">
          <h2 className="text-lg font-semibold mb-2">AI Analysis</h2>
          <p className="text-gray-700">{results.aiAnalysis}</p>
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b">
        <div className="flex overflow-x-auto">
          <button
            className={`px-4 py-3 whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All Results ({resultCounts.all})
          </button>
          {resultCounts.resources > 0 && (
            <button
              className={`px-4 py-3 whitespace-nowrap ${
                activeTab === 'resources'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('resources')}
            >
              Resources ({resultCounts.resources})
            </button>
          )}
          {resultCounts.projects > 0 && (
            <button
              className={`px-4 py-3 whitespace-nowrap ${
                activeTab === 'projects'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('projects')}
            >
              Projects ({resultCounts.projects})
            </button>
          )}
          {resultCounts.allocations > 0 && (
            <button
              className={`px-4 py-3 whitespace-nowrap ${
                activeTab === 'allocations'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('allocations')}
            >
              Allocations ({resultCounts.allocations})
            </button>
          )}
          {resultCounts.skills > 0 && (
            <button
              className={`px-4 py-3 whitespace-nowrap ${
                activeTab === 'skills'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('skills')}
            >
              Skills ({resultCounts.skills})
            </button>
          )}
        </div>
      </div>
      
      {/* Results content */}
      <div className="p-6">
        {renderResults()}
      </div>
    </div>
  );
};

export default SearchResults;