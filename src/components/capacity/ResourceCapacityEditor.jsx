// src/components/capacity/ResourceCapacityEditor.jsx
import React, { useState, useEffect } from 'react';
import { useCapacity } from '../../contexts/CapacityContext';
import { useResources } from '../../contexts/ResourceContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ResourceCapacityEditor = ({ resourceId, startDate, endDate, onClose }) => {
  const { getResourceCapacity, bulkUpdateResourceCapacity } = useCapacity();
  const { resources } = useResources();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [capacityData, setCapacityData] = useState(null);
  const [resource, setResource] = useState(null);
  
  // Load resource capacity data
  useEffect(() => {
    const loadResourceCapacity = async () => {
      try {
        setLoading(true);
        
        // Find resource details
        const resourceObj = resources.find(r => r.id === parseInt(resourceId));
        setResource(resourceObj);
        
        // Format dates for API
        const startDateStr = startDate ? startDate.toISOString().split('T')[0] : undefined;
        const endDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined;
        
        // Get capacity data
        const data = await getResourceCapacity(resourceId, {
          startDate: startDateStr,
          endDate: endDateStr
        });
        
        setCapacityData(data);
        setError('');
      } catch (err) {
        console.error('Error loading resource capacity:', err);
        setError('Failed to load resource capacity');
      } finally {
        setLoading(false);
      }
    };
    
    if (resourceId) {
      loadResourceCapacity();
    }
  }, [resourceId, startDate, endDate]);
  
  // Handle capacity data change
  const handleCapacityChange = (index, field, value) => {
    const updatedData = { ...capacityData };
    updatedData.capacityData[index][field] = parseInt(value) || 0;
    setCapacityData(updatedData);
  };
  
  // Save all capacity data
  const handleSaveAll = async () => {
    try {
      setLoading(true);
      
      // Prepare data for bulk update
      const capacityItems = capacityData.capacityData.map(month => ({
        year: month.year,
        month: month.month,
        availableCapacity: month.availableCapacity,
        plannedTimeOff: month.plannedTimeOff,
        notes: month.notes
      }));
      
      await bulkUpdateResourceCapacity(resourceId, capacityItems);
      onClose();
    } catch (err) {
      console.error('Error saving capacity data:', err);
      setError('Failed to save capacity data');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !capacityData) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Edit Resource Capacity: {resource?.name}
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            &times;
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Set the available capacity and planned time off for each month.
              Available capacity represents the maximum allocation percentage possible for this resource.
            </p>
          </div>
          
          <div className="overflow-y-auto max-h-96">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border border-gray-300">Month</th>
                  <th className="p-2 border border-gray-300">Available Capacity (%)</th>
                  <th className="p-2 border border-gray-300">Planned Time Off (%)</th>
                  <th className="p-2 border border-gray-300">Effective Capacity (%)</th>
                </tr>
              </thead>
              <tbody>
                {capacityData?.capacityData.map((month, index) => (
                  <tr key={`${month.year}-${month.month}`}>
                    <td className="p-2 border border-gray-300">
                      {month.label}
                    </td>
                    <td className="p-2 border border-gray-300">
                      <input
                        type="number"
                        min="0"
                        max="150"
                        value={month.availableCapacity}
                        onChange={(e) => handleCapacityChange(index, 'availableCapacity', e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border border-gray-300">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={month.plannedTimeOff}
                        onChange={(e) => handleCapacityChange(index, 'plannedTimeOff', e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border border-gray-300 text-center">
                      {Math.max(0, month.availableCapacity - month.plannedTimeOff)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceCapacityEditor;