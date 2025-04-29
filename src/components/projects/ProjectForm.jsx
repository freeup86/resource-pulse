import React, { useState, useEffect } from 'react';
import { useProjects } from '../../contexts/ProjectContext';
import { useRoles } from '../../contexts/RoleContext';

const ProjectForm = ({ project = null, onClose }) => {
  const { addProject, updateProject } = useProjects();
  const { roles } = useRoles();
  
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    description: '',
    requiredSkills: [],
    skillInput: '',
    requiredRoles: [], // Array of {roleId, count} objects
    roleInput: { roleId: '', count: 1 },
    startDate: '',
    endDate: ''
  });
  const [errors, setErrors] = useState({});

  // If editing an existing project, populate the form
  useEffect(() => {
    if (project) {
      // Important: Transform role data from {id, name, count} to {roleId, name, count}
      const formattedRoles = project.requiredRoles ? project.requiredRoles.map(role => ({
        roleId: parseInt(role.id), // Map from id to roleId and ensure it's an integer
        count: parseInt(role.count) || 1, // Ensure count is an integer
        name: role.name
      })) : [];
      
      setFormData({
        name: project.name,
        client: project.client,
        description: project.description || '',
        requiredSkills: [...project.requiredSkills],
        skillInput: '',
        requiredRoles: formattedRoles,
        roleInput: { roleId: '', count: 1 },
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
  
  // Handle adding roles
  const handleAddRole = () => {
    if (formData.roleInput.roleId) {
      const roleIdInt = parseInt(formData.roleInput.roleId);
      const countInt = parseInt(formData.roleInput.count) || 1;
      
      // Check if role already exists in the list
      if (!formData.requiredRoles.some(r => parseInt(r.roleId) === roleIdInt)) {
        const selectedRole = roles.find(r => r.id === roleIdInt);
        setFormData(prev => ({
          ...prev,
          requiredRoles: [
            ...prev.requiredRoles, 
            { 
              roleId: roleIdInt, 
              count: countInt,
              name: selectedRole ? selectedRole.name : 'Unknown Role'
            }
          ],
          roleInput: { roleId: '', count: 1 }
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          roleInput: 'This role is already in the list'
        }));
      }
    }
  };
  
  // Handle removing roles
  const handleRemoveRole = (roleIdToRemove) => {
    setFormData(prev => ({
      ...prev,
      requiredRoles: prev.requiredRoles.filter(r => parseInt(r.roleId) !== parseInt(roleIdToRemove))
    }));
  };
  
  // Handle role input changes
  const handleRoleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      roleInput: { 
        ...prev.roleInput, 
        [name]: name === 'count' ? (parseInt(value) || 1) : value 
      }
    }));
    
    // Clear error when field is edited
    if (errors.roleInput) {
      setErrors(prev => ({ ...prev, roleInput: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.client.trim()) newErrors.client = 'Client name is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Format required roles to ensure they have the proper format for the API
    const formattedRoles = formData.requiredRoles.map(role => ({
      roleId: parseInt(role.roleId),
      count: parseInt(role.count) || 1
    }));
    
    // Log the formatted roles for debugging
    console.log('Required Roles (formatted):', formattedRoles);
    
    // Create project object
    const projectData = {
      name: formData.name,
      client: formData.client,
      description: formData.description || null,
      requiredSkills: formData.requiredSkills,
      requiredRoles: formattedRoles,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      status: 'Active' // Make sure status is included
    };
    
    // Log the project data for debugging
    console.log('Project data for submission:', projectData);
    
    try {
      if (project) {
        console.log('Updating project with ID:', project.id);
        updateProject({ ...projectData, id: project.id });
      } else {
        console.log('Creating new project');
        addProject(projectData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting project:', error);
      setErrors({
        form: 'Failed to save project. Please try again.'
      });
    }
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
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter project description"
              rows="3"
            ></textarea>
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
          
          {/* Required Roles Section */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Roles</label>
            <div className="flex space-x-2">
              <select
                name="roleId"
                value={formData.roleInput.roleId}
                onChange={handleRoleInputChange}
                className={`flex-grow p-2 border rounded-l ${errors.roleInput ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select a role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="count"
                min="1"
                placeholder="Count"
                value={formData.roleInput.count}
                onChange={handleRoleInputChange}
                className="w-20 p-2 border border-gray-300"
              />
              <button
                type="button"
                onClick={handleAddRole}
                className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {errors.roleInput && <p className="mt-1 text-sm text-red-600">{errors.roleInput}</p>}
            
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.requiredRoles.map((role) => (
                <div key={role.roleId} className="flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                  {role.name} ({role.count})
                  <button
                    type="button"
                    onClick={() => handleRemoveRole(role.roleId)}
                    className="ml-1 text-purple-800 hover:text-purple-900 font-bold"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {errors.form && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {errors.form}
            </div>
          )}
          
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