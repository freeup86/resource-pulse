import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResources } from '../../contexts/ResourceContext';
import { isAllocated } from '../../utils/allocationUtils';
import SkillTag from '../common/SkillTag';
import AllocationForm from './AllocationForm';

const UnallocatedResources = () => {
  const { resources } = useResources();
  const [showForm, setShowForm] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  
  // Correctly identify unallocated resources
  const unallocatedResources = resources.filter(resource => !isAllocated(resource));
  
  const handleAllocate = (resource) => {
    setSelectedResource(resource);
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedResource(null);
  };
  
  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50">
          <h2 className="text-lg font-semibold">Unallocated Resources</h2>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {unallocatedResources.length > 0 ? (
              unallocatedResources.map((resource) => (
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
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {resource.skills.map((skill, idx) => (
                        <SkillTag key={idx} skill={skill} />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => handleAllocate(resource)} 
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No unallocated resources available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {showForm && (
        <AllocationForm
          resourceId={selectedResource?.id}
          onClose={handleCloseForm}
        />
      )}
    </>
  );
};

export default UnallocatedResources;