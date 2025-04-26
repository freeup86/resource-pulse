import React, { useState, useEffect } from 'react';
import { useResources } from '../../contexts/ResourceContext';

const ResourceForm = ({ resource = null, onClose }) => {
  const { addResource, updateResource } = useResources();
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    skills: [],
    skillInput: ''
  });
  const [errors, setErrors] = useState({});

  // If editing an existing resource, populate the form
  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name,
        role: resource.role,
        skills: [...resource.skills],
        skillInput: ''
      });
    }
  }, [resource]);

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
      if (!formData.skills.includes(formData.skillInput.trim())) {
        setFormData(prev => ({
          ...prev,
          skills: [...prev.skills, prev.skillInput.trim()],
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
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.role.trim()) newErrors.role = 'Role is required';
    if (formData.skills.length === 0) newErrors.skills = 'At least one skill is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Create or update resource
    const resourceData = {
      name: formData.name,
      role: formData.role,
      skills: formData.skills,
      allocation: resource?.allocation || null
    };
    
    if (resource) {
      updateResource({ ...resourceData, id: resource.id });
    } else {
      addResource(resourceData);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg">
          <h2 className="text-lg font-semibold">{resource ? 'Edit Resource' : 'Add New Resource'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter resource name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter resource role"
            />
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <div className="flex">
              <input
                type="text"
                name="skillInput"
                value={formData.skillInput}
                onChange={handleChange}
                className={`flex-grow p-2 border rounded-l ${errors.skillInput ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Add a skill"
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
              {formData.skills.map((skill, idx) => (
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
              {resource ? 'Update' : 'Add'} Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceForm;