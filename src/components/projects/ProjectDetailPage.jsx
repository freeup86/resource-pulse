import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../../contexts/ProjectContext';
import { useResources } from '../../contexts/ResourceContext';
import ProjectDetail from './ProjectDetail';
import ProjectForm from './ProjectForm';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, deleteProject } = useProjects();
  const { resources } = useResources();
  const [showEditForm, setShowEditForm] = useState(false);
  
  const projectId = parseInt(id);
  const project = projects.find(p => p.id === projectId);
  
  const handleEdit = () => {
    setShowEditForm(true);
  };
  
  const handleDelete = () => {
    // Check if there are resources assigned to this project
    const hasAssignedResources = resources.some(
      resource => resource.allocation && resource.allocation.projectId === projectId
    );
    
    if (hasAssignedResources) {
      alert('Cannot delete project with assigned resources. Please reassign resources first.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId);
      navigate('/projects');
    }
  };
  
  if (!project) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-gray-700">Project not found</h2>
        <Link to="/projects" className="text-blue-600 hover:underline mt-4 inline-block">
          &larr; Back to Projects
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4">
        <Link to="/projects" className="text-blue-600 hover:underline">&larr; Back to Projects</Link>
      </div>
      
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold">Project Details</h2>
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
      
      <ProjectDetail project={project} />
      
      {showEditForm && (
        <ProjectForm 
          project={project} 
          onClose={() => setShowEditForm(false)} 
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;