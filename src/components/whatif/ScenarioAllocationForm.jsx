// ScenarioAllocationForm.jsx
import React, { useState, useEffect } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useWhatIfScenario } from '../../contexts/WhatIfScenarioContext';
import { useSettings } from '../../contexts/SettingsContext';
import { calculateTotalUtilization } from '../../utils/allocationUtils';

const ScenarioAllocationForm = ({ 
  scenarioId, 
  existingAllocation = null, 
  onClose,
  onAllocationSaved
}) => {
  const { resources } = useResources();
  const { projects } = useProjects();
  const { updateScenarioResource } = useWhatIfScenario();
  const { settings } = useSettings();
  
  // Get system-configured max utilization threshold from settings
  const systemMaxUtilization = settings.maxUtilizationPercentage || 100;
  
  const [formData, setFormData] = useState({
    resourceId: '',
    projectId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    utilization: settings.defaultAllocationPercentage || 100,
    billableRate: '',
    hourlyRate: '',
    totalHours: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Find the current resource
  const resource = formData.resourceId ? resources.find(r => r.id === parseInt(formData.resourceId)) : null;
  
  // Find the selected project to get its dates
  const selectedProject = formData.projectId ? 
    projects.find(p => p.id === parseInt(formData.projectId)) : null;
  
  // Calculate total existing utilization excluding current allocation if editing
  const currentTotalUtilization = resource ? 
    calculateTotalUtilization(resource) - (existingAllocation ? (existingAllocation.utilization || 0) : 0) : 0;
  
  // Set maximum available utilization, allowing overallocation up to the admin-defined threshold
  const availableUtilization = Math.max(0, systemMaxUtilization - currentTotalUtilization);
  
  // Format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    // Create a date object from the string
    const date = new Date(dateString);
    
    // Format the date as YYYY-MM-DD using UTC components to avoid timezone issues
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };
  
  // Default start date using UTC
  const getDefaultStartDate = () => {
    const today = new Date();
    return `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
  };
  
  // If editing an existing allocation, populate the form
  useEffect(() => {
    if (existingAllocation) {
      setFormData({
        resourceId: existingAllocation.resourceId || '',
        projectId: existingAllocation.projectId || '',
        startDate: existingAllocation.startDate ? formatDateForInput(existingAllocation.startDate) : getDefaultStartDate(),
        endDate: existingAllocation.endDate ? formatDateForInput(existingAllocation.endDate) : '',
        utilization: existingAllocation.utilization || (settings.defaultAllocationPercentage || 100),
        billableRate: existingAllocation.billableRate || '',
        hourlyRate: existingAllocation.hourlyRate || '',
        totalHours: existingAllocation.totalHours || '',
        notes: existingAllocation.notes || '',
        id: existingAllocation.id // Save the allocation ID for updates
      });
    }
  }, [existingAllocation, settings]);
  
  // Auto-populate start and end dates from project when project is selected
  useEffect(() => {
    // Only auto-populate when projectId changes and a valid project is selected
    if (formData.projectId && selectedProject && !existingAllocation) {
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
  }, [formData.projectId, selectedProject, existingAllocation]);
  
  // Auto-populate rates from resource when resource is selected
  useEffect(() => {
    if (formData.resourceId && resource && !existingAllocation) {
      setFormData(prev => ({
        ...prev,
        billableRate: prev.billableRate || resource.billableRate || '',
        hourlyRate: prev.hourlyRate || resource.hourlyRate || ''
      }));
    }
  }, [formData.resourceId, resource, existingAllocation]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'utilization' || name === 'totalHours' ? 
        (value === '' ? '' : parseInt(value)) : 
        name === 'billableRate' || name === 'hourlyRate' ? 
          (value === '' ? '' : parseFloat(value)) : 
          value
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
    if (formData.utilization < 1 || formData.utilization > 100) {
      newErrors.utilization = 'Utilization must be between 1 and 100%';
    }
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      setLoading(true);
      
      // Create or update allocation data
      const allocationData = {
        projectId: parseInt(formData.projectId),
        startDate: formData.startDate,
        endDate: formData.endDate,
        utilization: formData.utilization,
        billableRate: formData.billableRate || null,
        hourlyRate: formData.hourlyRate || null,
        totalHours: formData.totalHours || null,
        notes: formData.notes || null,
        skillsRequired: selectedProject?.requiredSkills ? JSON.stringify(selectedProject.requiredSkills) : null,
        rolesRequired: selectedProject?.requiredRoles ? JSON.stringify(selectedProject.requiredRoles) : null
      };
      
      // Include allocation ID if editing an existing one
      if (formData.id) {
        allocationData.id = formData.id;
      }
      
      // Update scenario allocation via what-if service
      await updateScenarioResource(scenarioId, {
        resourceId: parseInt(formData.resourceId),
        allocationData
      });
      
      if (onAllocationSaved) {
        onAllocationSaved();
      }
      
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
    } finally {
      setLoading(false);
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
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg">
          <h2 className="text-lg font-semibold">
            {existingAllocation ? 'Edit Scenario Allocation' : 'Add Resource Allocation to Scenario'}
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
              disabled={!!existingAllocation?.resourceId}
            >
              <option value="">Select a resource</option>
              {resources.map(resource => {
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
              disabled={!!existingAllocation?.projectId}
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
              <span className="ml-1 text-xs text-gray-500">
                {resource && `- Available: ${availableUtilization}%`}
              </span>
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
            {formData.resourceId && (
              <p className="mt-1 text-xs text-gray-500">
                Resource status: {formatAllocationStatus(resources.find(r => r.id === parseInt(formData.resourceId)))}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
              <input
                type="number"
                name="hourlyRate"
                step="0.01"
                min="0"
                value={formData.hourlyRate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Cost rate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billable Rate</label>
              <input
                type="number"
                name="billableRate"
                step="0.01"
                min="0"
                value={formData.billableRate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Bill rate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
              <input
                type="number"
                name="totalHours"
                min="0"
                value={formData.totalHours}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Est. hours"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Optional notes about this allocation"
            ></textarea>
          </div>
          
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {errors.submit}
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : existingAllocation ? 'Update' : 'Add'} Allocation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScenarioAllocationForm;