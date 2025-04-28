import React from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../../contexts/ProjectContext';
import { useResources } from '../../contexts/ResourceContext';

const ProjectsList = ({ onEdit }) => {
  const { projects, deleteProject } = useProjects();
  const { resources } = useResources();
  
  const getAssignedResourceCount = (projectId) => {
    return resources.filter(resource => {
      // Check traditional allocation property
      if (resource.allocation && resource.allocation.projectId === projectId) {
        return true;
      }
      
      // Check allocations array if it exists
      if (resource.allocations && resource.allocations.length > 0) {
        return resource.allocations.some(allocation => 
          allocation && allocation.projectId === projectId
        );
      }
      
      return false;
    }).length;
  };
  
  const handleDelete = (id) => {
    // Check if there are resources assigned to this project
    const hasAssignedResources = getAssignedResourceCount(id) > 0;
    
    if (hasAssignedResources) {
      alert('Cannot delete project with assigned resources. Please reassign resources first.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(id);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-gray-50">
        <h2 className="text-lg font-semibold">All Projects</h2>
      </div>
      
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Skills</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resources</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {projects.length > 0 ? (
            projects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    <Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">
                      {project.name}
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {project.client}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {project.requiredSkills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getAssignedResourceCount(project.id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button 
                    onClick={() => onEdit(project)} 
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(project.id)} 
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                No projects found. Add your first project to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsList;