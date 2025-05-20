// WhatIfScenarioForm.jsx
import React, { useState, useEffect } from 'react';
import { useWhatIfScenario } from '../../contexts/WhatIfScenarioContext';
import { useSettings } from '../../contexts/SettingsContext';

const WhatIfScenarioForm = ({ onClose, onScenarioCreated, editScenario = null }) => {
  const { createScenario, scenarios } = useWhatIfScenario();
  const { settings } = useSettings();
  
  const defaultMonths = parseInt(settings.whatIfDefaultPeriodMonths) || 12;
  
  const [formData, setFormData] = useState({
    name: editScenario ? editScenario.name : '',
    description: editScenario ? editScenario.description : '',
    baseScenarioId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + defaultMonths)).toISOString().split('T')[0],
    cloneFromBaseScenario: false
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Set end date when start date changes
  useEffect(() => {
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + defaultMonths);
      
      setFormData(prev => ({
        ...prev,
        endDate: endDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.startDate, defaultMonths]);
  
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
    if (!formData.name.trim()) {
      setError('Scenario name is required');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      setError('Start and end dates are required');
      return;
    }
    
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('End date must be after start date');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create new scenario
      const newScenario = await createScenario({
        name: formData.name,
        description: formData.description,
        baseScenarioId: formData.baseScenarioId ? parseInt(formData.baseScenarioId) : null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        cloneFromBaseScenario: formData.cloneFromBaseScenario
      });
      
      if (onScenarioCreated) {
        onScenarioCreated(newScenario.id);
      }
      
      onClose();
    } catch (err) {
      console.error('Error creating scenario:', err);
      setError('Failed to create scenario. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg">
          <h2 className="text-lg font-semibold">Create What-If Scenario</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scenario Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Q3 Resource Planning"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              rows="3"
              placeholder="Planning scenario for Q3 resource allocations with new project timeline changes..."
            ></textarea>
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
              Base Scenario (Optional)
            </label>
            <select
              name="baseScenarioId"
              value={formData.baseScenarioId}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">None (Start from scratch)</option>
              {scenarios.map(scenario => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </div>
          
          {formData.baseScenarioId && (
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="cloneFromBaseScenario"
                  checked={formData.cloneFromBaseScenario}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 mr-2"
                />
                <span className="text-sm text-gray-700">
                  Clone allocations and changes from base scenario
                </span>
              </label>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
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
              {loading ? 'Creating...' : 'Create Scenario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhatIfScenarioForm;