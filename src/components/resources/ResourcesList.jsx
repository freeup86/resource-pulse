import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SkillTag from '../common/SkillTag';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import ErrorModal from '../common/ErrorModal';
import { useResources } from '../../contexts/ResourceContext';

const ResourcesList = ({ onEdit, resources }) => {
  const { loading, error, deleteResource } = useResources();
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50">
          <h2 className="text-lg font-semibold">All Resources</h2>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {resources.length > 0 ? (
              resources.map((resource) => (
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
                    <StatusBadge status={resource.allocation ? 'allocated' : 'available'} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No resources found. Add your first resource to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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