// src/components/analytics/DateRangeFilter.jsx
import React from 'react';

const DateRangeFilter = ({ 
  startDate, 
  endDate, 
  onChange, 
  onFilterApply,
  onStartDateChange,
  onEndDateChange,
  dateRange,
  onDateRangeChange
}) => {
  // Support both dateRange object and individual startDate/endDate props
  const currentStartDate = dateRange?.startDate || startDate;
  const currentEndDate = dateRange?.endDate || endDate;
  
  // Format dates to YYYY-MM-DD for the input elements
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  };
  
  const handleStartDateChange = (e) => {
    const dateValue = e.target.value;
    const newStartDate = new Date(dateValue);
    
    // Support both API patterns
    if (onDateRangeChange) {
      // New pattern: dateRange object with Date objects
      onDateRangeChange({
        startDate: newStartDate,
        endDate: currentEndDate
      });
    } else if (onChange) {
      // Legacy pattern: onChange with object
      onChange({
        startDate: newStartDate,
        endDate: currentEndDate
      });
    } else if (onStartDateChange) {
      // Individual handlers pattern - pass string for AnalyticsDashboard compatibility
      onStartDateChange(dateValue);
    }
  };
  
  const handleEndDateChange = (e) => {
    const dateValue = e.target.value;
    const newEndDate = new Date(dateValue);
    
    // Support both API patterns
    if (onDateRangeChange) {
      // New pattern: dateRange object with Date objects
      onDateRangeChange({
        startDate: currentStartDate,
        endDate: newEndDate
      });
    } else if (onChange) {
      // Legacy pattern: onChange with object
      onChange({
        startDate: currentStartDate,
        endDate: newEndDate
      });
    } else if (onEndDateChange) {
      // Individual handlers pattern - pass string for AnalyticsDashboard compatibility
      onEndDateChange(dateValue);
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-medium mb-2">Date Range Filter</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={formatDateForInput(currentStartDate)}
            onChange={handleStartDateChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={formatDateForInput(currentEndDate)}
            onChange={handleEndDateChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div className="flex items-end">
          <button
            onClick={onFilterApply}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;