import React, { useState, useEffect } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { formatDate } from '../../utils/dateUtils';

const AllocationForm = ({ allocation = null, resourceId = null, onClose }) => {
  const { resources, updateAllocation } = useResources();
  const { projects } = useProjects();
  const [formData, setFormData] = useState({
    resourceId: resourceId || '',
    projectId: '',
    startDate: new Date().toISOString().split('T')[0], // Today
    endDate: '',
    utilization: 100
  });
  const [errors, setErrors] = useState({});

  // If editing an existing allocation, populate the form
  useEffect(() => {
    if (allocation && allocation.projectId) {
      setFormData({
        resourceId: resourceId || '',
        projectId: allocation.projectId,
        startDate: allocation.startDate || new Date().toISOString().split('T')[0],
        endDate: allocation.endDate || '',
        utilization: allocation.utilization || 100
      });
    }
  }, [allocation, resourceId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'utilization' ? parseInt(value) : value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.resourceId) newErrors.resourceId = 'Resource is required';
    if (!formData.projectId) newErrors.projectId = 'Project is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.utilization < 1 || formData.utilization > 100) {
      newErrors.utilization = 'Utilization must be between 1 and 100';
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Create allocation object
    const allocationData = {
      projectId: parseInt(formData.projectId),
      startDate: formData.startDate,
      endDate: formData.endDate,
      utilization: formData.utilization
    };
    
    // Update resource allocation
    updateAllocation(parseInt(formData.resourceId), allocationData);
    onClose();
  };

  const handleRemoveAllocation = () => {
    if (window.confirm('Are you sure you want to remove this allocation?')) {
      updateAllocation(parseInt(formData.resourceId), null);
      onClose();
    }
  };

  // Filter out resources that already have allocations (except for the current one being edited)
  const availableResources = resourceId 
    ? resources
    : resources.filter(r => !r.allocation);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg">
          <h2 className="text-lg font-semibold">
            {allocation ? 'Edit Resource Allocation' : 'Allocate Resource to Project'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
            <select
              name="resourceId"
              value={formData.resourceId}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.resourceId ? 'border-red-500' : 'border-gray-300'}`}
              disabled={!!resourceId}
            >
              <option value="">Select a resource</option>
              {availableResources.map(resource => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} - {resource.role}
                </option>
              ))}
            </select>
            {errors.resourceId && <p className="mt-1 text-sm text-red-600">{errors.resourceId}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.projectId ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.client}
                </option>
              ))}
            </select>
            {errors.projectId && <p className="mt-1 text-sm text-red-600">{errors.projectId}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Utilization (%)
            </label>
            <input
              type="number"
              name="utilization"
              min="1"
              max="100"
              value={formData.utilization}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.utilization ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.utilization && <p className="mt-1 text-sm text-red-600">{errors.utilization}</p>}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            {allocation && (
              <button
                type="button"
                onClick={handleRemoveAllocation}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove Allocation
              </button>
            )}
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
              {allocation ? 'Update' : 'Create'} Allocation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllocationForm;