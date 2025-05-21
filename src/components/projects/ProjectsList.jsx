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
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
      } catch (err) {
        // Show the specific error message from the backend
        const errorMessage = err.message || 'Failed to delete project';
        alert(errorMessage);
      }
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-gray-50">
        <h2 className="text-lg font-semibold">All Projects</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Owner</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Skills</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Roles</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Resources</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {projects.length > 0 ? (
            projects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {project.projectNumber || <span className="text-gray-400">-</span>}
                </td>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {project.projectOwner || <span className="text-gray-400">-</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {project.requiredSkills && project.requiredSkills.length > 0 ? (
                      project.requiredSkills.length <= 3 ? (
                        project.requiredSkills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <>
                          {project.requiredSkills.slice(0, 2).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {skill}
                            </span>
                          ))}
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            +{project.requiredSkills.length - 2} more
                          </span>
                        </>
                      )
                    ) : (
                      <span className="text-xs text-gray-500">None specified</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {project.requiredRoles && project.requiredRoles.length > 0 ? (
                      project.requiredRoles.length <= 3 ? (
                        project.requiredRoles.map((role, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            {role.name} ({role.count})
                          </span>
                        ))
                      ) : (
                        <>
                          {project.requiredRoles.slice(0, 2).map((role, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                              {role.name} ({role.count})
                            </span>
                          ))}
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            +{project.requiredRoles.length - 2} more
                          </span>
                        </>
                      )
                    ) : (
                      <span className="text-xs text-gray-500">None specified</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                  {getAssignedResourceCount(project.id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => onEdit(project)}
                    className="text-blue-600 hover:text-blue-900 cursor-pointer mr-4 bg-transparent border-none p-0"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-red-600 hover:text-red-900 cursor-pointer bg-transparent border-none p-0"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                No projects found. Add your first project to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default ProjectsList;