import React, { useState, useEffect } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useSettings } from '../../contexts/SettingsContext';
import { calculateTotalUtilization } from '../../utils/allocationUtils';

const AllocationForm = ({ 
  resourceId = null, 
  projectId = null, 
  allocation = null, 
  maxUtilization = null, 
  onClose 
}) => {
  const { resources, updateAllocation } = useResources();
  const { projects } = useProjects();
  const { settings } = useSettings();
  
  // Get system-configured max utilization threshold from settings directly
  const systemMaxUtilization = settings.maxUtilizationPercentage || 100;
  
  // Create a properly formatted date string using our formatDateForInput helper
  const getDefaultStartDate = () => {
    const today = new Date();
    return `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    resourceId: resourceId || '',
    projectId: projectId || '',
    startDate: getDefaultStartDate(),
    endDate: '',
    utilization: settings.defaultAllocationPercentage || 100
  });
  const [errors, setErrors] = useState({});

  // Find the current resource
  const resource = resourceId ? resources.find(r => r.id === parseInt(resourceId)) : null;
  
  // Find the selected project to get its dates
  const selectedProject = formData.projectId ? 
    projects.find(p => p.id === parseInt(formData.projectId)) : null;
  
  // Calculate total existing utilization excluding current allocation if editing
  const currentTotalUtilization = resource ? 
    calculateTotalUtilization(resource) - (allocation ? (allocation.utilization || 0) : 0) : 0;
  
  // Set maximum available utilization, allowing overallocation up to the admin-defined threshold
  const availableUtilization = maxUtilization !== null ? 
    maxUtilization : 
    Math.max(0, systemMaxUtilization - currentTotalUtilization);

  // Format date for input without adding a day
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';

    // Create a date object from the string
    const date = new Date(dateString);

    // Format the date as YYYY-MM-DD using UTC components to avoid timezone issues
    const year = date.getUTCFullYear();
    // getUTCMonth() is 0-indexed, so add 1
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // If editing an existing allocation, populate the form
  useEffect(() => {
    if (allocation) {
      setFormData({
        resourceId: resourceId || '',
        projectId: allocation.projectId || (allocation.project ? allocation.project.id : ''),
        startDate: allocation.startDate ? formatDateForInput(allocation.startDate) : getDefaultStartDate(),
        endDate: allocation.endDate ? formatDateForInput(allocation.endDate) : '',
        utilization: allocation.utilization || (settings.defaultAllocationPercentage || 100),
        id: allocation.id // Save the allocation ID for updates
      });
    } else if (resourceId || projectId) {
      // Initialize with provided resourceId or projectId
      setFormData(prev => ({
        ...prev,
        resourceId: resourceId || prev.resourceId,
        projectId: projectId || prev.projectId,
        utilization: Math.min(prev.utilization, availableUtilization)
      }));
    }
  }, [allocation, resourceId, projectId, availableUtilization, settings]);

  // Auto-populate start and end dates from project when project is selected
  useEffect(() => {
    // Only auto-populate when projectId changes and a valid project is selected
    if (formData.projectId && selectedProject) {
      // Don't overwrite dates if we're editing an existing allocation
      if (!allocation) {
        setFormData(prev => ({
          ...prev,
          // Only update start date if project has one and form is empty or default
          startDate: selectedProject.startDate &&
            (!prev.startDate || prev.startDate === getDefaultStartDate()) ?
            formatDateForInput(selectedProject.startDate) :
            prev.startDate,
          // Only update end date if project has one and form is empty
          endDate: selectedProject.endDate ? 
            formatDateForInput(selectedProject.endDate) : 
            prev.endDate
        }));
      }
    }
  }, [formData.projectId, selectedProject, allocation]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.resourceId) newErrors.resourceId = 'Resource is required';
    if (!formData.projectId) newErrors.projectId = 'Project is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    
    // Validate utilization against the system-defined threshold
    if (formData.utilization < 1 || formData.utilization > availableUtilization) {
      newErrors.utilization = `Utilization must be between 1 and ${availableUtilization}`;
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
    
    // Include allocation ID if we're editing an existing one
    if (formData.id) {
      allocationData.id = formData.id;
    }
    
    try {
      // Update resource allocation
      await updateAllocation(parseInt(formData.resourceId), allocationData);
      onClose();
    } catch (err) {
      console.error('Error in allocation form submission:', err);
      if (err.response && err.response.status === 400) {
        setErrors({
          submit: err.response.data?.message || `Failed to allocate resource. Allocation would exceed ${systemMaxUtilization}% utilization.`
        });
      } else {
        setErrors({
          submit: 'An error occurred. Please try again.'
        });
      }
    }
  };

  const handleRemoveAllocation = async () => {
    if (!allocation || !allocation.id) {
      console.error('Cannot remove allocation: No allocation ID found');
      setErrors({ submit: 'Failed to remove allocation: No allocation ID found' });
      return;
    }

    if (window.confirm('Are you sure you want to remove this allocation?')) {
      try {
        // The server expects a different format for removal
        const removalData = {
          id: allocation.id,
          projectId: null
        };

        await updateAllocation(parseInt(formData.resourceId), removalData);
        onClose();
      } catch (err) {
        console.error('Error in removal callback:', err);
        setErrors({ 
          submit: err.response?.data?.message || 'Failed to remove allocation. Please try again.' 
        });
      }
    }
  };

  // Format allocation status for display
  const formatAllocationStatus = (resource) => {
    if (!resource) return 'Unknown';
    
    const totalUtilization = calculateTotalUtilization(resource);
    const allocations = resource.allocations || [];
    
    if (allocations.length === 0) {
      return 'Unallocated';
    } else if (totalUtilization > systemMaxUtilization) {
      return `${allocations.length} allocation${allocations.length !== 1 ? 's' : ''} (${totalUtilization}% total - Overallocated)`;
    } else {
      return `${allocations.length} allocation${allocations.length !== 1 ? 's' : ''} (${totalUtilization}% total)`;
    }
  };

  // Get all resources - no filtering so fully allocated resources are included
  const availableResources = resources;

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
              {availableResources.map(resource => {
                const utilization = calculateTotalUtilization(resource);
                return (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} - {resource.role} 
                    {utilization >= systemMaxUtilization 
                      ? ` (${utilization}% - Overallocated)` 
                      : utilization >= 100 
                        ? ` (${utilization}% - Fully Allocated)` 
                        : ` (${utilization}% allocated)`}
                  </option>
                );
              })}
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
              disabled={!!projectId}
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
              {resourceId && (
                <span className="ml-1 text-xs">
                  - Available: {availableUtilization}%
                </span>
              )}
            </label>
            <input
              type="number"
              name="utilization"
              min="1"
              max={resourceId ? availableUtilization : systemMaxUtilization}
              value={formData.utilization}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.utilization ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.utilization && <p className="mt-1 text-sm text-red-600">{errors.utilization}</p>}
            {formData.resourceId && !resourceId && (
              <p className="mt-1 text-xs text-gray-500">
                Selected resource: {formatAllocationStatus(resources.find(r => r.id === parseInt(formData.resourceId)))}
              </p>
            )}
            {systemMaxUtilization > 100 && (
              <p className="mt-1 text-xs text-yellow-600">
                Note: System allows overallocation up to {systemMaxUtilization}%
              </p>
            )}
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