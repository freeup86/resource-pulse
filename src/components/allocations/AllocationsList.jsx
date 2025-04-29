import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import UtilizationBar from '../common/UtilizationBar';
import { formatDate, calculateDaysUntilEnd } from '../../utils/dateUtils';
import { calculateTotalUtilization } from '../../utils/allocationUtils';
import AllocationForm from './AllocationForm';

const AllocationsList = () => {
  const { resources } = useResources();
  const { projects } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  
  // Resources with at least one allocation
  const allocatedResources = resources.filter(resource => 
    resource.allocations && resource.allocations.length > 0
  );

  const handleEditAllocation = (resource, allocation) => {
    setSelectedResource(resource);
    setSelectedAllocation(allocation);
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedResource(null);
    setSelectedAllocation(null);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow mb-4 overflow-hidden">
        <div className="p-4 bg-gray-50">
          <h2 className="text-lg font-semibold">Current Allocations</h2>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Projects</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allocatedResources.length > 0 ? (
              allocatedResources.map((resource) => {
                // Calculate total utilization from all allocations
                const totalUtilization = calculateTotalUtilization(resource);
                
                // Get all allocations
                const resourceAllocations = resource.allocations || [];
                
                // Get primary allocation for display (still show one project in the list)
                const primaryAllocation = resourceAllocations[0];
                
                // Only proceed if there's at least one allocation
                if (!primaryAllocation) return null;
                
                const primaryProject = projects.find(p => p.id === primaryAllocation.projectId);
                const daysLeft = calculateDaysUntilEnd(primaryAllocation.endDate);
                
                return (
                  <tr key={resource.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        <Link to={`/resources/${resource.id}`} className="text-blue-600 hover:underline">
                          {resource.name}
                        </Link>
                      </div>
                      <div className="text-sm text-gray-500">{resource.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {resourceAllocations.map((allocation, idx) => {
                        const project = projects.find(p => p.id === allocation.projectId);
                        return (
                          <div key={`project-${idx}`}>
                            {project ? (
                              <Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">
                                {project.name} ({allocation.utilization}%)
                              </Link>
                            ) : (
                              <span className="text-red-500">Invalid Project</span>
                            )}
                          </div>
                        );
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {resourceAllocations.map((allocation, idx) => {
                        const project = projects.find(p => p.id === allocation.projectId);
                        return (
                          <div key={`client-${idx}`}>
                            {project?.client}
                          </div>
                        );
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UtilizationBar percentage={totalUtilization} />
                      {resourceAllocations.length > 1 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Multiple allocations: {resourceAllocations.length}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>{formatDate(primaryAllocation.endDate)}</div>
                      <div className={`text-xs ${
                        daysLeft <= 7
                          ? "text-red-600"
                          : daysLeft <= 14
                          ? "text-yellow-600"
                          : "text-gray-500"
                      }`}>
                        {daysLeft} days left
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link to={`/resources/${resource.id}`} className="text-blue-600 hover:text-blue-900">
                        View All
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No allocated resources found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {showForm && (
        <AllocationForm
          allocation={selectedAllocation}
          resourceId={selectedResource?.id}
          onClose={handleCloseForm}
        />
      )}
    </>
  );
};

export default AllocationsList;