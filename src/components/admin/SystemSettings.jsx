// src/components/admin/SystemSettings.jsx
import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Save } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const SystemSettings = () => {
  const { settings, loading, error, updateSettings } = useSettings();
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form data when settings are loaded
  useEffect(() => {
    if (!loading && settings) {
      // Initialize all expected settings with default values to prevent
      // controlled to uncontrolled component warnings
      const initialFormData = {
        appName: '',
        maxUtilizationPercentage: 100,
        defaultEndingSoonDays: 14,
        allowOverallocation: false,
        emailNotifications: false,
        resourceDefaultView: 'list',
        matchingThreshold: 60,
        externalSystemIntegration: false,
        defaultTimelineMonths: 3,
        customFields: []
      };
      
      // Apply actual settings over defaults
      setFormData({
        ...initialFormData,
        ...settings
      });
    }
  }, [settings, loading]);

  // Format form data for inputs to prevent [object Object] errors
  const getInputValue = (name, defaultValue) => {
    if (formData[name] === undefined || formData[name] === null) {
      return defaultValue;
    }
    
    // Handle objects - don't pass objects directly to input values
    if (typeof formData[name] === 'object') {
      return defaultValue;
    }
    
    return formData[name];
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    let newValue;
    if (type === 'checkbox') {
      newValue = checked;
    } else if (type === 'number') {
      // Handle empty string by defaulting to 0
      newValue = value === '' ? 0 : parseFloat(value);
    } else {
      newValue = value;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Reset success/error messages on change
    setSaveSuccess(false);
    setSaveError(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setSaveError(null);
      
      // Update settings through context
      await updateSettings(formData);
      
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">System Settings</h2>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50">
          <h3 className="text-lg font-medium">General Settings</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Application Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Name
            </label>
            <input
              type="text"
              name="appName"
              value={getInputValue("appName", "")}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <p className="mt-1 text-xs text-gray-500">
              This name will be displayed in the application header and browser title
            </p>
          </div>
          
          {/* Resource Settings */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-md font-medium mb-4">Resource Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Utilization (%)
                </label>
                <input
                  type="number"
                  name="maxUtilizationPercentage"
                  min="1"
                  max="200"
                  value={getInputValue("maxUtilizationPercentage", 100)}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  "Ending Soon" Days Threshold
                </label>
                <input
                  type="number"
                  name="defaultEndingSoonDays"
                  min="1"
                  max="90"
                  value={getInputValue("defaultEndingSoonDays", 14)}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <input
                    type="checkbox"
                    name="allowOverallocation"
                    checked={Boolean(getInputValue("allowOverallocation", false))}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Allow Resource Overallocation (&gt;100%)
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  When disabled, resources cannot be allocated beyond their maximum utilization percentage
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Resource View
                </label>
                <select
                  name="resourceDefaultView"
                  value={getInputValue("resourceDefaultView", "list")}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="list">List View</option>
                  <option value="grid">Grid View</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Matching Settings */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-md font-medium mb-4">Matching Settings</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matching Threshold (%)
              </label>
              <input
                type="number"
                name="matchingThreshold"
                min="1"
                max="100"
                value={getInputValue("matchingThreshold", 60)}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum matching score percentage for resource recommendations
              </p>
            </div>
          </div>
          
          {/* Timeline Settings */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-md font-medium mb-4">Timeline Settings</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Timeline Months
              </label>
              <select
                name="defaultTimelineMonths"
                value={getInputValue("defaultTimelineMonths", 3)}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value={1}>1 Month</option>
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
              </select>
            </div>
          </div>
          
          {/* Integration Settings */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-md font-medium mb-4">Integration Settings</h4>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <input
                    type="checkbox"
                    name="externalSystemIntegration"
                    checked={Boolean(getInputValue("externalSystemIntegration", false))}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Enable External System Integration
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  When enabled, the application will sync data with external systems
                </p>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={Boolean(getInputValue("emailNotifications", false))}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Enable Email Notifications
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  Send email notifications for allocation changes and upcoming deadlines
                </p>
              </div>
            </div>
          </div>
          
          {/* Form submission */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            {saveSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
                Settings saved successfully!
              </div>
            )}
            
            {saveError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                {saveError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700 disabled:opacity-50 ml-auto"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;