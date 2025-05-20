// ProjectTimelineForm.jsx
import React, { useState, useEffect } from 'react';
import { useProjects } from '../../contexts/ProjectContext';
import { useWhatIfScenario } from '../../contexts/WhatIfScenarioContext';

const ProjectTimelineForm = ({ 
  scenarioId, 
  existingTimelineChange = null, 
  onClose, 
  onTimelineSaved 
}) => {
  const { projects } = useProjects();
  const { updateProjectTimeline } = useWhatIfScenario();
  
  const [formData, setFormData] = useState({
    projectId: '',
    newStartDate: '',
    newEndDate: '',
    notes: ''
  });
  
  const [originalDates, setOriginalDates] = useState({
    startDate: '',
    endDate: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
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
  
  // Populate form if editing an existing timeline change
  useEffect(() => {
    if (existingTimelineChange) {
      setFormData({
        projectId: existingTimelineChange.projectId || '',
        newStartDate: existingTimelineChange.newStartDate 
          ? formatDateForInput(existingTimelineChange.newStartDate) 
          : '',
        newEndDate: existingTimelineChange.newEndDate 
          ? formatDateForInput(existingTimelineChange.newEndDate) 
          : '',
        notes: existingTimelineChange.notes || ''
      });
      
      setOriginalDates({
        startDate: existingTimelineChange.originalStartDate 
          ? formatDateForInput(existingTimelineChange.originalStartDate) 
          : '',
        endDate: existingTimelineChange.originalEndDate 
          ? formatDateForInput(existingTimelineChange.originalEndDate) 
          : ''
      });
    }
  }, [existingTimelineChange]);
  
  // Load original project dates when project is selected
  useEffect(() => {
    if (formData.projectId && !existingTimelineChange) {
      const selectedProject = projects.find(p => p.id === parseInt(formData.projectId));
      
      if (selectedProject) {
        const originalStartDate = formatDateForInput(selectedProject.startDate);
        const originalEndDate = formatDateForInput(selectedProject.endDate);
        
        setOriginalDates({
          startDate: originalStartDate,
          endDate: originalEndDate
        });
        
        // Also set as initial values for new dates
        setFormData(prev => ({
          ...prev,
          newStartDate: originalStartDate,
          newEndDate: originalEndDate
        }));
      }
    }
  }, [formData.projectId, projects, existingTimelineChange]);
  
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.projectId) newErrors.projectId = 'Project is required';
    if (!formData.newStartDate) newErrors.newStartDate = 'New start date is required';
    if (!formData.newEndDate) newErrors.newEndDate = 'New end date is required';
    
    if (formData.newStartDate && formData.newEndDate && 
        new Date(formData.newStartDate) > new Date(formData.newEndDate)) {
      newErrors.newEndDate = 'End date must be after start date';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      setLoading(true);
      
      // Update project timeline
      await updateProjectTimeline(
        scenarioId, 
        formData.projectId, 
        {
          newStartDate: formData.newStartDate,
          newEndDate: formData.newEndDate,
          notes: formData.notes
        }
      );
      
      if (onTimelineSaved) {
        onTimelineSaved();
      }
      
      onClose();
    } catch (err) {
      console.error('Error updating project timeline:', err);
      setErrors({
        submit: 'Failed to update project timeline. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate the duration difference between original and new dates
  const calculateDateDifference = () => {
    if (!formData.newStartDate || !formData.newEndDate || 
        !originalDates.startDate || !originalDates.endDate) {
      return null;
    }
    
    const origStart = new Date(originalDates.startDate);
    const origEnd = new Date(originalDates.endDate);
    const newStart = new Date(formData.newStartDate);
    const newEnd = new Date(formData.newEndDate);
    
    // Calculate original duration in days
    const origDuration = Math.round((origEnd - origStart) / (1000 * 60 * 60 * 24));
    
    // Calculate new duration in days
    const newDuration = Math.round((newEnd - newStart) / (1000 * 60 * 60 * 24));
    
    // Calculate differences
    const startDiff = Math.round((newStart - origStart) / (1000 * 60 * 60 * 24));
    const endDiff = Math.round((newEnd - origEnd) / (1000 * 60 * 60 * 24));
    const durationDiff = newDuration - origDuration;
    
    return {
      originalDuration: origDuration,
      newDuration: newDuration,
      startDifference: startDiff,
      endDifference: endDiff,
      durationDifference: durationDiff
    };
  };
  
  // Format the date difference info for display
  const renderDateDifferenceInfo = () => {
    const diff = calculateDateDifference();
    
    if (!diff) return null;
    
    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
        <h4 className="font-medium text-blue-800 mb-1">Timeline Changes</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-600">Start date:</span>
            <span className={`ml-1 font-medium ${
              diff.startDifference > 0 
                ? 'text-red-600' 
                : diff.startDifference < 0 
                  ? 'text-green-600' 
                  : 'text-gray-600'
            }`}>
              {diff.startDifference === 0 
                ? 'No change' 
                : diff.startDifference > 0 
                  ? `${diff.startDifference} days later` 
                  : `${Math.abs(diff.startDifference)} days earlier`}
            </span>
          </div>
          <div>
            <span className="text-gray-600">End date:</span>
            <span className={`ml-1 font-medium ${
              diff.endDifference > 0 
                ? 'text-red-600' 
                : diff.endDifference < 0 
                  ? 'text-green-600' 
                  : 'text-gray-600'
            }`}>
              {diff.endDifference === 0 
                ? 'No change' 
                : diff.endDifference > 0 
                  ? `${diff.endDifference} days later` 
                  : `${Math.abs(diff.endDifference)} days earlier`}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600">Project duration:</span>
            <span className={`ml-1 font-medium ${
              diff.durationDifference > 0 
                ? 'text-red-600' 
                : diff.durationDifference < 0 
                  ? 'text-green-600' 
                  : 'text-gray-600'
            }`}>
              {diff.durationDifference === 0 
                ? 'No change' 
                : diff.durationDifference > 0 
                  ? `Extended by ${diff.durationDifference} days` 
                  : `Shortened by ${Math.abs(diff.durationDifference)} days`}
            </span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg">
          <h2 className="text-lg font-semibold">
            {existingTimelineChange ? 'Edit Project Timeline' : 'Modify Project Timeline'}
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
              disabled={!!existingTimelineChange}
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
          
          {formData.projectId && (
            <>
              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Original Timeline</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                    <div className="p-2 border border-gray-300 rounded bg-white">
                      {originalDates.startDate || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <div className="p-2 border border-gray-300 rounded bg-white">
                      {originalDates.endDate || 'Not set'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">New Timeline</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Start Date</label>
                    <input
                      type="date"
                      name="newStartDate"
                      value={formData.newStartDate}
                      onChange={handleChange}
                      className={`w-full p-2 border rounded ${errors.newStartDate ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.newStartDate && <p className="mt-1 text-sm text-red-600">{errors.newStartDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New End Date</label>
                    <input
                      type="date"
                      name="newEndDate"
                      value={formData.newEndDate}
                      onChange={handleChange}
                      className={`w-full p-2 border rounded ${errors.newEndDate ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.newEndDate && <p className="mt-1 text-sm text-red-600">{errors.newEndDate}</p>}
                  </div>
                </div>
              </div>
              
              {renderDateDifferenceInfo()}
            </>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Reason for timeline change"
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
              disabled={loading || !formData.projectId}
            >
              {loading ? 'Saving...' : 'Update Timeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectTimelineForm;