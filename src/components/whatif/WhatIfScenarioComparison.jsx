// WhatIfScenarioComparison.jsx
import React, { useState, useEffect } from 'react';
import { useWhatIfScenario } from '../../contexts/WhatIfScenarioContext';
import LoadingSpinner from '../common/LoadingSpinner';

const WhatIfScenarioComparison = ({ scenarioIds, onClose }) => {
  const { 
    scenarios, 
    loading, 
    error, 
    compareScenarios,
    getFormattedMetrics
  } = useWhatIfScenario();
  
  const [comparisonData, setComparisonData] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState(['utilization', 'costs', 'skills']);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  
  // Initialize the comparison on mount
  useEffect(() => {
    if (scenarioIds && scenarioIds.length >= 2) {
      runComparison();
    }
  }, [scenarioIds]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Run the comparison
  const runComparison = async () => {
    setIsLoading(true);
    setLocalError(null);
    
    try {
      const compareData = {
        scenarioIds,
        metrics: selectedMetrics,
        name: 'Temporary Comparison'
      };
      
      const result = await compareScenarios(compareData);
      setComparisonData(result);
    } catch (err) {
      console.error('Error comparing scenarios:', err);
      setLocalError('Failed to compare scenarios. Please ensure all selected scenarios have metrics calculated.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle metric selection change
  const handleMetricChange = (metric) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(prev => prev.filter(m => m !== metric));
    } else {
      setSelectedMetrics(prev => [...prev, metric]);
    }
  };
  
  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Get scenario details by ID
  const getScenarioById = (id) => {
    return scenarios.find(s => s.id === id) || { name: `Scenario ${id}` };
  };
  
  // Render the utilization comparison
  const renderUtilizationComparison = () => {
    if (!comparisonData || !comparisonData.comparisons || !comparisonData.comparisons.utilization) {
      return null;
    }
    
    const utilData = comparisonData.comparisons.utilization;
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Resource Utilization Comparison</h3>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scenario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall Utilization
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fully Allocated Resources
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Underutilized Resources
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {utilData.map((scenario) => {
                // Count resource categories
                const resourceStats = {
                  total: Object.keys(scenario.byResource).length,
                  fullyAllocated: 0,
                  underutilized: 0
                };
                
                Object.values(scenario.byResource).forEach(resource => {
                  if (resource.totalUtilization >= 90) {
                    resourceStats.fullyAllocated++;
                  } else if (resource.totalUtilization < 70) {
                    resourceStats.underutilized++;
                  }
                });
                
                return (
                  <tr key={scenario.scenarioId}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{scenario.scenarioName}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium rounded-full px-2 py-1 inline-block ${
                        scenario.overall >= 85 
                          ? 'bg-red-100 text-red-800' 
                          : scenario.overall >= 70 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {scenario.overall}%
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {resourceStats.fullyAllocated} of {resourceStats.total} resources
                        ({Math.round((resourceStats.fullyAllocated / resourceStats.total) * 100) || 0}%)
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {resourceStats.underutilized} of {resourceStats.total} resources
                        ({Math.round((resourceStats.underutilized / resourceStats.total) * 100) || 0}%)
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Render the financial comparison
  const renderFinancialComparison = () => {
    if (!comparisonData || !comparisonData.comparisons || !comparisonData.comparisons.costs) {
      return null;
    }
    
    const costsData = comparisonData.comparisons.costs;
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Financial Metrics Comparison</h3>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scenario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {costsData.map((scenario) => (
                <tr key={scenario.scenarioId}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{scenario.scenarioName}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm">{formatCurrency(scenario.totalCost)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm">{formatCurrency(scenario.totalBillable)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium rounded-full px-2 py-1 inline-block ${
                      scenario.margin >= 30 
                        ? 'bg-green-100 text-green-800' 
                        : scenario.margin >= 20 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {scenario.margin}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Financial chart placeholder */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center text-gray-500">
          Financial comparison chart would be displayed here
        </div>
      </div>
    );
  };
  
  // Render the skills coverage comparison
  const renderSkillsComparison = () => {
    if (!comparisonData || !comparisonData.comparisons || !comparisonData.comparisons.skills) {
      return null;
    }
    
    const skillsData = comparisonData.comparisons.skills;
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Skills Coverage Comparison</h3>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scenario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coverage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Covered Skills
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Missing Skills
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {skillsData.map((scenario) => (
                <tr key={scenario.scenarioId}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{scenario.scenarioName}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium rounded-full px-2 py-1 inline-block ${
                      scenario.coveragePercentage >= 90 
                        ? 'bg-green-100 text-green-800' 
                        : scenario.coveragePercentage >= 75 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {scenario.coveragePercentage}%
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm">{scenario.covered} skills</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm">{scenario.missing} skills</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Skills chart placeholder */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center text-gray-500">
          Skills coverage chart would be displayed here
        </div>
      </div>
    );
  };
  
  // Render the scenario details card
  const renderScenarioCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {scenarioIds.map(id => {
          const scenario = getScenarioById(id);
          
          // Get metrics data for this scenario
          const metricsData = typeof scenario.metricsData === 'string'
            ? JSON.parse(scenario.metricsData)
            : scenario.metricsData;
            
          const formattedMetrics = metricsData ? getFormattedMetrics(metricsData) : null;
          
          return (
            <div key={id} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-medium text-lg mb-2">{scenario.name}</h3>
              <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                {scenario.description || 'No description'}
              </div>
              
              <div className="text-xs text-gray-500 mb-3">
                Period: {scenario.startDate 
                  ? new Date(scenario.startDate).toLocaleDateString() 
                  : 'N/A'} to {scenario.endDate 
                  ? new Date(scenario.endDate).toLocaleDateString() 
                  : 'N/A'}
              </div>
              
              {formattedMetrics ? (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className={`p-2 rounded text-center ${
                    formattedMetrics.utilization.overall >= 85 
                      ? 'bg-red-100' 
                      : formattedMetrics.utilization.overall >= 70 
                        ? 'bg-yellow-100' 
                        : 'bg-green-100'
                  }`}>
                    <div className="font-medium">Utilization</div>
                    <div>{formattedMetrics.utilization.overall}%</div>
                  </div>
                  <div className={`p-2 rounded text-center ${
                    formattedMetrics.costs.margin >= 30 
                      ? 'bg-green-100' 
                      : formattedMetrics.costs.margin >= 20 
                        ? 'bg-yellow-100' 
                        : 'bg-red-100'
                  }`}>
                    <div className="font-medium">Margin</div>
                    <div>{formattedMetrics.costs.margin}%</div>
                  </div>
                  <div className={`p-2 rounded text-center ${
                    formattedMetrics.skillsCoverage.coveragePercentage >= 90 
                      ? 'bg-green-100' 
                      : formattedMetrics.skillsCoverage.coveragePercentage >= 75 
                        ? 'bg-yellow-100' 
                        : 'bg-red-100'
                  }`}>
                    <div className="font-medium">Skills</div>
                    <div>{formattedMetrics.skillsCoverage.coveragePercentage}%</div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 p-2 rounded text-center text-xs">
                  <div className="font-medium">Metrics</div>
                  <div>Not calculated</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
          <h2 className="text-lg font-semibold">Compare Scenarios</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            &times;
          </button>
        </div>
        
        <div className="bg-gray-100 p-4 border-b">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium">Compare metrics:</span>
            <label className="flex items-center bg-white px-3 py-1 rounded border cursor-pointer">
              <input
                type="checkbox"
                checked={selectedMetrics.includes('utilization')}
                onChange={() => handleMetricChange('utilization')}
                className="mr-2"
              />
              <span className="text-sm">Utilization</span>
            </label>
            <label className="flex items-center bg-white px-3 py-1 rounded border cursor-pointer">
              <input
                type="checkbox"
                checked={selectedMetrics.includes('costs')}
                onChange={() => handleMetricChange('costs')}
                className="mr-2"
              />
              <span className="text-sm">Financials</span>
            </label>
            <label className="flex items-center bg-white px-3 py-1 rounded border cursor-pointer">
              <input
                type="checkbox"
                checked={selectedMetrics.includes('skills')}
                onChange={() => handleMetricChange('skills')}
                className="mr-2"
              />
              <span className="text-sm">Skills</span>
            </label>
            
            <button
              onClick={runComparison}
              disabled={isLoading || selectedMetrics.length === 0}
              className={`ml-auto px-3 py-1 rounded ${
                isLoading || selectedMetrics.length === 0
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Comparing...' : 'Update Comparison'}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {(loading || isLoading) ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (error || localError) ? (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
              {error || localError}
            </div>
          ) : comparisonData ? (
            <>
              {/* Scenarios being compared */}
              {renderScenarioCards()}
              
              {/* Metrics comparisons */}
              {selectedMetrics.includes('utilization') && renderUtilizationComparison()}
              {selectedMetrics.includes('costs') && renderFinancialComparison()}
              {selectedMetrics.includes('skills') && renderSkillsComparison()}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select metrics and click "Update Comparison" to compare scenarios
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end">
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

export default WhatIfScenarioComparison;