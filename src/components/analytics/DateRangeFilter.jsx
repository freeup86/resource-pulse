// src/components/analytics/DateRangeFilter.jsx
import React from 'react';

const DateRangeFilter = ({ startDate, endDate, onStartDateChange, onEndDateChange, onFilterApply }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-medium mb-2">Date Range Filter</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
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