import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import UtilizationBar from '../common/UtilizationBar';
import { formatDate, calculateDaysUntilEnd } from '../../utils/dateUtils';
import AllocationForm from './AllocationForm';

const AllocationsList = () => {
  const { resources } = useResources();
  const { projects } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  
  const allocatedResources = resources.filter(resource => resource.allocation);

  const handleEditAllocation = (resource) => {
    setSelectedResource(resource);
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedResource(null);
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allocatedResources.length > 0 ? (
              allocatedResources.map((resource) => {
                const project = projects.find(p => p.id === resource.allocation.projectId);
                const daysLeft = calculateDaysUntilEnd(resource.allocation.endDate);
                
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
                      {project ? (
                        <Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">
                          {project.name}
                        </Link>
                      ) : (
                        <span className="text-red-500">Invalid Project</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project?.client}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UtilizationBar percentage={resource.allocation.utilization} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>{formatDate(resource.allocation.endDate)}</div>
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
                      <button 
                        onClick={() => handleEditAllocation(resource)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
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
          allocation={selectedResource?.allocation}
          resourceId={selectedResource?.id}
          onClose={handleCloseForm}
        />
      )}
    </>
  );
};

export default AllocationsList;