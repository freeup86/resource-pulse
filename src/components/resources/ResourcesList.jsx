import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Square } from 'lucide-react';
import SkillTag from '../common/SkillTag';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import ErrorModal from '../common/ErrorModal';
import BulkActionBar from './BulkActionBar';
import { useResources } from '../../contexts/ResourceContext';

const ResourcesList = ({ onEdit, resources, refreshList }) => {
  const { loading, error, deleteResource } = useResources();
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedResources, setSelectedResources] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await deleteResource(id);
      } catch (err) {
        // Set error message for modal
        if (err.response && err.response.data && err.response.data.message) {
          setErrorMessage(err.response.data.message);
        } else {
          setErrorMessage('Failed to delete resource. It may be allocated to projects.');
        }
        setErrorModalOpen(true);
      }
    }
  };
  
  // Clear selected resources when resource list changes
  useEffect(() => {
    setSelectedResources([]);
    setSelectAll(false);
  }, [resources]);
  
  // Toggle selection of a single resource
  const toggleResourceSelection = (resource) => {
    if (selectedResources.some(r => r.id === resource.id)) {
      setSelectedResources(selectedResources.filter(r => r.id !== resource.id));
    } else {
      setSelectedResources([...selectedResources, resource]);
    }
  };
  
  // Toggle selection of all resources
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedResources([]);
    } else {
      setSelectedResources([...resources]);
    }
    setSelectAll(!selectAll);
  };
  
  // Check if a resource is selected
  const isResourceSelected = (resourceId) => {
    return selectedResources.some(r => r.id === resourceId);
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden relative mb-20">
        <div className="p-4 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold">All Resources</h2>
          <div className="text-sm text-gray-500">
            {resources.length} resource{resources.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="pl-6 pr-3 py-3 text-left text-xs font-medium text-gray-500">
                  <button 
                    onClick={toggleSelectAll}
                    className="flex items-center cursor-pointer"
                  >
                    {selectAll ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resources.length > 0 ? (
                resources.map((resource) => (
                  <tr 
                    key={resource.id}
                    className={`${isResourceSelected(resource.id) ? 'bg-blue-50' : ''} hover:bg-gray-50`}
                  >
                    <td className="pl-6 pr-3 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => toggleResourceSelection(resource)}
                        className="flex items-center cursor-pointer"
                      >
                        {isResourceSelected(resource.id) ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        <Link to={`/resources/${resource.id}`} className="text-blue-600 hover:underline">
                          {resource.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {resource.role}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-1">
                        {resource.skills && resource.skills.length > 0 ? (
                          resource.skills.slice(0, 3).map((skill, idx) => (
                            <SkillTag key={idx} skill={skill} />
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs italic">No skills</span>
                        )}
                        {resource.skills && resource.skills.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            +{resource.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <StatusBadge status={resource.allocation ? 'allocated' : 'available'} />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => onEdit(resource)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No resources found. Add your first resource to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Action Bar - Fixed at bottom of screen when resources are selected */}
      <BulkActionBar 
        selectedResources={selectedResources}
        onClearSelection={() => {
          setSelectedResources([]);
          setSelectAll(false);
        }}
        refreshList={refreshList}
      />

      {/* Error Modal */}
      <ErrorModal
        show={errorModalOpen}
        title="Cannot Delete Resource"
        message={errorMessage}
        onClose={() => setErrorModalOpen(false)}
      />
    </>
  );
};

export default ResourcesList;