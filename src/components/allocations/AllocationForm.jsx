import React, { useState, useEffect } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';

const AllocationForm = ({ resourceId, maxUtilization = 100, allocation = null, onClose }) => {
  const { addAllocation, updateAllocation } = useResources();
  const { projects } = useProjects();
  const [formData, setFormData] = useState({
    projectId: '',
    startDate: new Date().toISOString().split('T')[0], // Today
    endDate: '',
    utilization: Math.min(maxUtilization, 100)
  });
  const [errors, setErrors] = useState({});

  // If editing an existing allocation, populate the form
  useEffect(() => {
    if (allocation) {
      setFormData({
        projectId: allocation.projectId ? allocation.projectId.toString() : '',
        startDate: allocation.startDate ? new Date(allocation.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: allocation.endDate ? new Date(allocation.endDate).toISOString().split('T')[0] : '',
        utilization: allocation.utilization || Math.min(maxUtilization, 100)
      });
    }
  }, [allocation, maxUtilization]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'utilization' ? parseInt(value, 10) : value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.projectId) newErrors.projectId = 'Project is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.utilization < 1) {
      newErrors.utilization = 'Utilization must be at least 1%';
    } else if (formData.utilization > maxUtilization) {
      newErrors.utilization = `Utilization cannot exceed ${maxUtilization}%`;
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      // Ensure project ID is a number
      const allocationData = {
        projectId: parseInt(formData.projectId, 10),
        startDate: formData.startDate,
        endDate: formData.endDate,
        utilization: formData.utilization
      };
      
      // Include ID if updating an existing allocation
      if (allocation) {
        allocationData.id = allocation.id;
        await updateAllocation(resourceId, allocationData);
      } else {
        // This is a new allocation
        await addAllocation(resourceId, allocationData);
      }
      
      onClose();
    } catch (err) {
      console.error('Error handling allocation:', err);
      
      // Check if error response exists and has a message
      const errorMessage = err.response?.data?.message || 
                           err.message || 
                           'An error occurred. Please try again.';
      
      setErrors({ 
        submit: errorMessage 
      });
    }
  };

  const handleDelete = async () => {
    if (!allocation) return;
    
    if (window.confirm('Are you sure you want to remove this allocation?')) {
      try {
        await updateAllocation(resourceId, { 
          id: allocation.id,
          projectId: null
        });
        onClose();
      } catch (err) {
        console.error('Error removing allocation:', err);
        setErrors({ 
          submit: err.response?.data?.message || 'Failed to remove allocation' 
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg">
          <h2 className="text-lg font-semibold">
            {allocation ? 'Edit Allocation' : 'Add New Allocation'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
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
              Utilization (%) - Maximum: {maxUtilization}%
            </label>
            <input
              type="number"
              name="utilization"
              min="1"
              max={maxUtilization}
              value={formData.utilization}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.utilization ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.utilization && <p className="mt-1 text-sm text-red-600">{errors.utilization}</p>}
          </div>
          
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {errors.submit}
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            {allocation && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
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
              {allocation ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllocationForm;