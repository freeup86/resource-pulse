import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import ResourceDetail from './ResourceDetail';
import ResourceForm from './ResourceForm';

const ResourceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { resources, deleteResource } = useResources();
  const [showEditForm, setShowEditForm] = useState(false);
  
  const resourceId = parseInt(id);
  const resource = resources.find(r => r.id === resourceId);
  
  const handleEdit = () => {
    setShowEditForm(true);
  };
  
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      deleteResource(resourceId);
      navigate('/resources');
    }
  };
  
  if (!resource) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-gray-700">Resource not found</h2>
        <Link to="/resources" className="text-blue-600 hover:underline mt-4 inline-block">
          &larr; Back to Resources
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4">
        <Link to="/resources" className="text-blue-600 hover:underline">&larr; Back to Resources</Link>
      </div>
      
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold">Resource Details</h2>
        <div className="space-x-2">
          <button 
            onClick={handleEdit}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Edit
          </button>
          <button 
            onClick={handleDelete}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
      
      <ResourceDetail resource={resource} />
      
      {showEditForm && (
        <ResourceForm 
          resource={resource} 
          onClose={() => setShowEditForm(false)} 
        />
      )}
    </div>
  );
};

export default ResourceDetailPage;