import React, { useState, useEffect } from 'react';
import { useProjects } from '../../contexts/ProjectContext';

const ProjectForm = ({ project = null, onClose }) => {
  const { addProject, updateProject } = useProjects();
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    requiredSkills: [],
    skillInput: '',
    startDate: '',
    endDate: ''
  });
  const [errors, setErrors] = useState({});

  // If editing an existing project, populate the form
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        client: project.client,
        requiredSkills: [...project.requiredSkills],
        skillInput: '',
        startDate: project.startDate || '',
        endDate: project.endDate || ''
      });
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddSkill = () => {
    if (formData.skillInput.trim()) {
      if (!formData.requiredSkills.includes(formData.skillInput.trim())) {
        setFormData(prev => ({
          ...prev,
          requiredSkills: [...prev.requiredSkills, prev.skillInput.trim()],
          skillInput: ''
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          skillInput: 'This skill already exists'
        }));
      }
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.client.trim()) newErrors.client = 'Client name is required';
    if (formData.requiredSkills.length === 0) newErrors.skills = 'At least one required skill is needed';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Create or update project
    const projectData = {
      name: formData.name,
      client: formData.client,
      requiredSkills: formData.requiredSkills
    };
    
    if (formData.startDate) projectData.startDate = formData.startDate;
    if (formData.endDate) projectData.endDate = formData.endDate;
    
    if (project) {
      updateProject({ ...projectData, id: project.id });
    } else {
      addProject(projectData);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg">
          <h2 className="text-lg font-semibold">{project ? 'Edit Project' : 'Add New Project'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter project name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <input
              type="text"
              name="client"
              value={formData.client}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.client ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter client name"
            />
            {errors.client && <p className="mt-1 text-sm text-red-600">{errors.client}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (Optional)</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
            <div className="flex">
              <input
                type="text"
                name="skillInput"
                value={formData.skillInput}
                onChange={handleChange}
                className={`flex-grow p-2 border rounded-l ${errors.skillInput ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Add a required skill"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {errors.skillInput && <p className="mt-1 text-sm text-red-600">{errors.skillInput}</p>}
            {errors.skills && <p className="mt-1 text-sm text-red-600">{errors.skills}</p>}
            
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.requiredSkills.map((skill, idx) => (
                <div key={idx} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 text-blue-800 hover:text-blue-900 font-bold"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {project ? 'Update' : 'Add'} Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;