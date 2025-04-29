import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResources } from '../../contexts/ResourceContext';
import { formatDate, calculateDaysUntilEnd } from '../../utils/dateUtils';
import UtilizationBar from '../common/UtilizationBar';
import AllocationForm from '../allocations/AllocationForm';

const ProjectDetail = ({ project }) => {
  const { resources } = useResources();
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  
  if (!project) {
    return <div className="text-center p-8">Project not found</div>;
  }
  
  // Get resources allocated to this project - check both allocation and allocations array
  const assignedResources = resources.filter(resource => {
    // Check traditional allocation property
    if (resource.allocation && resource.allocation.projectId === project.id) {
      return true;
    }
    
    // Check allocations array if it exists
    if (resource.allocations && resource.allocations.length > 0) {
      return resource.allocations.some(allocation => 
        allocation && allocation.projectId === project.id
      );
    }
    
    return false;
  });

  // Group assigned resources by role
  const resourcesByRole = {};
  assignedResources.forEach(resource => {
    const roleId = resource.roleId;
    const roleName = resource.roleName || resource.role || 'Unknown Role';
    
    if (!resourcesByRole[roleId]) {
      resourcesByRole[roleId] = {
        id: roleId,
        name: roleName,
        resources: []
      };
    }
    
    resourcesByRole[roleId].resources.push(resource);
  });

  // Calculate role fulfillment
  const roleFulfillment = (project.requiredRoles || []).map(role => {
    const assigned = (resourcesByRole[role.id]?.resources || []).length;
    return {
      ...role,
      assigned,
      fulfilled: assigned >= role.count,
      remaining: Math.max(0, role.count - assigned)
    };
  });

  // When the "Allocate Resources" button is clicked
  const handleAddAllocation = () => {
    setShowAllocationForm(true);
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            <p className="text-gray-600">Client: {project.client}</p>
          </div>
          <div className="flex space-x-2">
            {project.startDate && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Starts: {formatDate(project.startDate)}
              </span>
            )}
            {project.endDate && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Ends: {formatDate(project.endDate)}
              </span>
            )}
          </div>
        </div>
        
        {/* Project dates in more detail if present */}
        {(project.startDate || project.endDate) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-sm text-gray-700">Project Timeline</h3>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div>
                <span className="text-xs text-gray-500">Start Date</span>
                <p className="text-sm">{project.startDate ? formatDate(project.startDate) : 'Not specified'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">End Date</span>
                <p className="text-sm">{project.endDate ? formatDate(project.endDate) : 'Not specified'}</p>
                {project.endDate && (
                  <p className="text-xs text-gray-500">
                    {calculateDaysUntilEnd(project.endDate) <= 0 
                      ? 'Project has ended' 
                      : `${calculateDaysUntilEnd(project.endDate)} days remaining`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {project.description && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900">Description</h3>
            <p className="mt-1 text-gray-600">{project.description}</p>
          </div>
        )}
        
        {/* Required Roles Section */}
        {project.requiredRoles && project.requiredRoles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900">Required Roles</h3>
            <div className="mt-2 grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {roleFulfillment.map((role, idx) => (
                <div 
                  key={idx} 
                  className={`p-2 rounded-lg border ${
                    role.fulfilled ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="font-medium">{role.name}</div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Required:</span>
                    <span>{role.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Assigned:</span>
                    <span className={role.fulfilled ? 'text-green-600' : 'text-yellow-600'}>
                      {role.assigned}
                    </span>
                  </div>
                  {!role.fulfilled && (
                    <div className="text-xs text-yellow-600 mt-1 text-right">
                      Need {role.remaining} more
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900">Required Skills</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {project.requiredSkills.map((skill, idx) => (
              <span key={idx} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {skill}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Allocated Resources</h3>
            <button 
              onClick={() => setShowAllocationForm(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Allocate Resource
            </button>
          </div>
          
          {assignedResources.length > 0 ? (
            <div className="overflow-hidden mt-2">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignedResources.map((resource) => {
                    // Find the allocation for this project
                    const allocationForProject = resource.allocations 
                      ? resource.allocations.find(a => a && a.projectId === project.id)
                      : (resource.allocation && resource.allocation.projectId === project.id 
                          ? resource.allocation 
                          : null);
                    
                    if (!allocationForProject) return null;
                    
                    return (
                      <tr key={resource.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            <Link to={`/resources/${resource.id}`} className="text-blue-600 hover:underline">
                              {resource.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {resource.roleName || resource.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <UtilizationBar percentage={allocationForProject.utilization} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>{formatDate(allocationForProject.endDate)}</div>
                          <div className={`text-xs ${
                            calculateDaysUntilEnd(allocationForProject.endDate) <= 7
                              ? "text-red-600"
                              : calculateDaysUntilEnd(allocationForProject.endDate) <= 14
                              ? "text-yellow-600"
                              : "text-gray-500"
                          }`}>
                            {calculateDaysUntilEnd(allocationForProject.endDate)} days left
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link 
                            to={`/resources/${resource.id}`} 
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg mt-2 text-center">
              <p className="text-gray-500">No resources allocated to this project</p>
            </div>
          )}
        </div>
      </div>
      
      {showAllocationForm && (
        <AllocationForm 
          projectId={project.id}
          onClose={() => setShowAllocationForm(false)}
        />
      )}
    </div>
  );
};

export default ProjectDetail;