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
  
  // Get resources allocated to this project
  const assignedResources = resources.filter(
    resource => resource.allocation && resource.allocation.projectId === project.id
  );
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            <p className="text-gray-600">Client: {project.client}</p>
          </div>
          {project.startDate && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Starts: {formatDate(project.startDate)}
            </span>
          )}
        </div>
        
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
                  {assignedResources.map((resource) => (
                    <tr key={resource.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          <Link to={`/resources/${resource.id}`} className="text-blue-600 hover:underline">
                            {resource.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resource.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <UtilizationBar percentage={resource.allocation.utilization} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>{formatDate(resource.allocation.endDate)}</div>
                        <div className={`text-xs ${
                          calculateDaysUntilEnd(resource.allocation.endDate) <= 7
                            ? "text-red-600"
                            : calculateDaysUntilEnd(resource.allocation.endDate) <= 14
                            ? "text-yellow-600"
                            : "text-gray-500"
                        }`}>
                          {calculateDaysUntilEnd(resource.allocation.endDate)} days left
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
                  ))}
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
          onClose={() => setShowAllocationForm(false)}
        />
      )}
    </div>
  );
};

export default ProjectDetail;