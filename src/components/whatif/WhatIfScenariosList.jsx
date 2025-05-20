// WhatIfScenariosList.jsx
import React, { useState, useEffect } from 'react';
import { useWhatIfScenario } from '../../contexts/WhatIfScenarioContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ScenarioCheckbox from './ScenarioCheckbox';

const WhatIfScenariosList = ({ 
  onClose, 
  onSelectScenario, 
  onSelectForComparison,
  selectedForComparison = []
}) => {
  const { 
    scenarios, 
    loading, 
    error, 
    fetchScenarios,
    getFormattedMetrics
  } = useWhatIfScenario();
  
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch scenarios on mount
  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);
  
  // Sort and filter scenarios
  const getFilteredAndSortedScenarios = () => {
    // Filter by search term
    let filtered = scenarios;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = scenarios.filter(scenario => 
        scenario.name.toLowerCase().includes(term) || 
        (scenario.description && scenario.description.toLowerCase().includes(term))
      );
    }
    
    // Sort scenarios
    return filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle date fields
      if (['createdAt', 'startDate', 'endDate'].includes(sortField)) {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }
      
      // Compare values
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };
  
  // Handle column sort
  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };
  
  // Handle selection for comparison
  const handleToggleSelection = (scenarioId) => {
    // Toggle the selection
    const isSelected = selectedForComparison.includes(scenarioId);
    onSelectForComparison(scenarioId, !isSelected);
  };
  
  const filteredScenarios = getFilteredAndSortedScenarios();
  
  // Handle row click to open scenario
  const handleRowClick = (e, scenarioId) => {
    onSelectScenario(scenarioId);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
          <h2 className="text-lg font-semibold">What-If Scenarios</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            &times;
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded"
            />
            <div className="absolute left-3 top-2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="p-4 text-red-600">
              {error}
            </div>
          ) : filteredScenarios.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'No scenarios match your search.' : 'No scenarios found.'}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-3 py-3 text-center">
                    <span className="sr-only">Compare</span>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Name {renderSortIndicator('name')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('startDate')}
                  >
                    Period {renderSortIndicator('startDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key Metrics
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created {renderSortIndicator('createdAt')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredScenarios.map(scenario => {
                  // Format metrics if available
                  const metrics = scenario.metricsData 
                    ? getFormattedMetrics(scenario.metricsData)
                    : null;
                    
                  return (
                    <tr
                      key={scenario.id}
                      className="hover:bg-gray-50"
                    >
                      {/* Checkbox cell with absolute positioning to intercept clicks */}
                      <td
                        className="px-3 py-4 whitespace-nowrap text-center relative checkbox-cell"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          return false;
                        }}
                      >
                        {/* Create a completely separate overlay */}
                        <ScenarioCheckbox
                          id={scenario.id}
                          isChecked={selectedForComparison.includes(scenario.id)}
                          onChange={handleToggleSelection}
                        />
                        {/* This is just a placeholder */}
                        <div className="w-4 h-4 opacity-0">□</div>
                      </td>

                      {/* Name column */}
                      <td 
                        className="px-6 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => onSelectScenario(scenario.id)}
                      >
                        <div className="font-medium text-gray-900">{scenario.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {scenario.description || 'No description'}
                        </div>
                      </td>
                      
                      {/* Date range column */}
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                        onClick={() => onSelectScenario(scenario.id)}
                      >
                        {scenario.startDate
                          ? new Date(scenario.startDate).toLocaleDateString()
                          : 'N/A'} to {' '}
                        {scenario.endDate
                          ? new Date(scenario.endDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      
                      {/* Metrics column */}
                      <td 
                        className="px-6 py-4 cursor-pointer"
                        onClick={() => onSelectScenario(scenario.id)}
                      >
                        {metrics ? (
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              metrics.utilization.overall >= 85
                                ? 'bg-red-100 text-red-800'
                                : metrics.utilization.overall >= 70
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {metrics.utilization.overall}% Util
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              metrics.costs.margin >= 30
                                ? 'bg-green-100 text-green-800'
                                : metrics.costs.margin >= 20
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {metrics.costs.margin}% Margin
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              metrics.skillsCoverage.coveragePercentage >= 90
                                ? 'bg-green-100 text-green-800'
                                : metrics.skillsCoverage.coveragePercentage >= 75
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {metrics.skillsCoverage.coveragePercentage}% Skills
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                            Metrics not calculated
                          </span>
                        )}
                      </td>
                      
                      {/* Created date column */}
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                        onClick={() => onSelectScenario(scenario.id)}
                      >
                        {new Date(scenario.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end items-center">
          <div className="mr-auto">
            <span className="text-sm text-gray-600">
              {filteredScenarios.length} scenario{filteredScenarios.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatIfScenariosList;