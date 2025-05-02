// src/components/capacity/ScenarioAllocationForm.jsx
import React, { useState, useEffect } from 'react';
import { useCapacity } from '../../contexts/CapacityContext';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { formatDate } from '../../utils/dateUtils';

const ScenarioAllocationForm = ({ 
  scenarioId, 
  onClose, 
  existingAllocation = null,
  onAllocationSaved
}) => {
  const { updateScenarioAllocation, deleteScenarioAllocation } = useCapacity();
  const { resources, loading: resourcesLoading } = useResources();
  const { projects, loading: projectsLoading } = useProjects();
  
  const [formData, setFormData] = useState({
    resourceId: existingAllocation ? existingAllocation.resourceId : '',
    projectId: existingAllocation ? existingAllocation.projectId : '',
    startDate: existingAllocation ? formatDate(new Date(existingAllocation.startDate)) : formatDate(new Date()),
    endDate: existingAllocation ? formatDate(new Date(existingAllocation.endDate)) : formatDate(new Date(new Date().setMonth(new Date().getMonth() + 1))),
    utilization: existingAllocation ? existingAllocation.utilization : 100,
    isTemporary: existingAllocation ? !!existingAllocation.isTemporary : true,
    notes: existingAllocation ? existingAllocation.notes || '' : ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Set available resources and projects
  const [availableResources, setAvailableResources] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  
  // Filter resources and projects
  useEffect(() => {
    if (resources && !resourcesLoading) {
      setAvailableResources(resources);
    }
    
    if (projects && !projectsLoading) {
      setAvailableProjects(projects);
    }
  }, [resources, projects, resourcesLoading, projectsLoading]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.resourceId) {
      setError('Resource is required');
      return;
    }
    
    if (!formData.projectId) {
      setError('Project is required');
      return;
    }
    
    if (!formData.startDate) {
      setError('Start date is required');
      return;
    }
    
    if (!formData.endDate) {
      setError('End date is required');
      return;
    }
    
    if (!formData.utilization || formData.utilization < 1 || formData.utilization > 100) {
      setError('Utilization must be between 1 and 100');
      return;
    }
    
    try {
      setLoading(true);
      
      // Format data for API
      const allocationData = {
        projectId: parseInt(formData.projectId),
        startDate: formData.startDate,
        endDate: formData.endDate,
        utilization: parseInt(formData.utilization),
        isTemporary: formData.isTemporary,
        notes: formData.notes || null
      };
      
      // Update or create allocation
      const updatedAllocation = await updateScenarioAllocation(
        scenarioId,
        formData.resourceId,
        allocationData
      );
      
      // Notify parent
      if (onAllocationSaved) {
        onAllocationSaved(updatedAllocation);
      }
      
      onClose();
    } catch (err) {
      console.error('Error saving allocation:', err);
      setError('Failed to save allocation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!existingAllocation || !existingAllocation.id) return;
    
    if (!window.confirm('Are you sure you want to delete this allocation?')) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteScenarioAllocation(scenarioId, existingAllocation.id);
      onClose();
    } catch (err) {
      console.error('Error deleting allocation:', err);
      setError('Failed to delete allocation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg">
          <h2 className="text-lg font-semibold">
            {existingAllocation ? 'Edit' : 'Add'} Scenario Allocation
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource *
            </label>
            <select
              name="resourceId"
              value={formData.resourceId}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              disabled={!!existingAllocation}
            >
              <option value="">Select a resource</option>
              {availableResources.map(resource => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} - {resource.role}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project *
            </label>
            <select
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              disabled={!!existingAllocation}
            >
              <option value="">Select a project</option>
              {availableProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Utilization Percentage (1-100) *
            </label>
            <input
              type="number"
              name="utilization"
              value={formData.utilization}
              onChange={handleChange}
              min="1"
              max="100"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                name="isTemporary"
                checked={formData.isTemporary}
                onChange={handleChange}
                className="mr-2"
              />
              This is a temporary allocation (what-if scenario)
            </label>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              rows="2"
              placeholder="Notes about this allocation..."
            ></textarea>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="flex justify-between">
            {existingAllocation && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={loading}
              >
                Delete
              </button>
            )}
            
            <div className="flex space-x-3 ml-auto">
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
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScenarioAllocationForm;