import React, { useState } from 'react';
import TabNav from '../layout/TabNav';
import ProjectsList from './ProjectsList';
import ProjectForm from './ProjectForm';

const ProjectsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  const handleAddNew = () => {
    setSelectedProject(null);
    setShowForm(true);
  };
  
  const handleEdit = (project) => {
    setSelectedProject(project);
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedProject(null);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Projects Management</h2>
        <button 
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Project
        </button>
      </div>
      <TabNav />
      <ProjectsList onEdit={handleEdit} />
      
      {showForm && (
        <ProjectForm 
          project={selectedProject} 
          onClose={handleCloseForm} 
        />
      )}
    </div>
  );
};

export default ProjectsPage;