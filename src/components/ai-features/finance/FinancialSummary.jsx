import React from 'react';
import { Link } from 'react-router-dom';

const FinancialSummary = ({ data, onProjectSelection, selectedProjects }) => {
  // Helper function to format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper function to format percentage
  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Ensure data.projects is an array before sorting
  // Add debugging info
  console.log('Financial data received:', data);
  const projects = Array.isArray(data.projects) ? data.projects : [];
  
  // Sort projects by profit (lowest profit/biggest losses first, as these need attention)
  const sortedProjects = [...projects].sort((a, b) => {
    const profitA = a.profit || 0;
    const profitB = b.profit || 0;
    
    return profitA - profitB; // Sort by profit (negative/lowest first - most problematic projects)
  });

  // Handle project selection
  const handleProjectCheckboxChange = (projectId) => {
    if (selectedProjects.includes(projectId)) {
      onProjectSelection(selectedProjects.filter(id => id !== projectId));
    } else {
      onProjectSelection([...selectedProjects, projectId]);
    }
  };

  // Handle select all projects
  const handleSelectAllProjects = () => {
    if (selectedProjects.length === projects.length) {
      onProjectSelection([]);
    } else {
      onProjectSelection(projects.map(project => project.id));
    }
  };

  return (
    <div className="space-y-8">
      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(data.summary.totalRevenue)}
          </p>
          {data.summary.revenueTrend > 0 ? (
            <p className="text-sm text-green-600 mt-2">
              ↑ {formatPercentage(data.summary.revenueTrend)} from previous period
            </p>
          ) : (
            <p className="text-sm text-red-600 mt-2">
              ↓ {formatPercentage(Math.abs(data.summary.revenueTrend))} from previous period
            </p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Total Cost</h3>
          <p className="text-3xl font-bold text-red-600">
            {formatCurrency(data.summary.totalCost)}
          </p>
          {data.summary.costTrend > 0 ? (
            <p className="text-sm text-red-600 mt-2">
              ↑ {formatPercentage(data.summary.costTrend)} from previous period
            </p>
          ) : (
            <p className="text-sm text-green-600 mt-2">
              ↓ {formatPercentage(Math.abs(data.summary.costTrend))} from previous period
            </p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Total Profit</h3>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(data.summary.totalProfit)}
          </p>
          {data.summary.profitTrend > 0 ? (
            <p className="text-sm text-green-600 mt-2">
              ↑ {formatPercentage(data.summary.profitTrend)} from previous period
            </p>
          ) : (
            <p className="text-sm text-red-600 mt-2">
              ↓ {formatPercentage(Math.abs(data.summary.profitTrend))} from previous period
            </p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Profit Margin</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {formatPercentage(data.summary.profitMargin)}
          </p>
          {data.summary.marginTrend > 0 ? (
            <p className="text-sm text-green-600 mt-2">
              ↑ {formatPercentage(data.summary.marginTrend)} from previous period
            </p>
          ) : (
            <p className="text-sm text-red-600 mt-2">
              ↓ {formatPercentage(Math.abs(data.summary.marginTrend))} from previous period
            </p>
          )}
        </div>
      </div>
      
      {/* AI Insights */}
      {data.aiInsights && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">AI Financial Insights</h3>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-700">{data.aiInsights.summary}</p>
            
            {data.aiInsights.opportunities && data.aiInsights.opportunities.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">Optimization Opportunities:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {data.aiInsights.opportunities.map((opportunity, index) => (
                    <li key={index} className="text-gray-700">{opportunity}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.aiInsights.risks && data.aiInsights.risks.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">Financial Risks:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {data.aiInsights.risks.map((risk, index) => (
                    <li key={index} className="text-gray-700">{risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Project Financial Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Project Financials</h3>
              <p className="text-xs text-gray-500 mt-1">
                Estimated Revenue = Budget × 1.30 (30% markup). Profit = Est. Revenue - Actual Cost
              </p>
            </div>
            <div className="flex items-center">
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={handleSelectAllProjects}
              >
                {selectedProjects.length === data.projects.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedProjects.length === projects.length && projects.length > 0}
                    onChange={handleSelectAllProjects}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Revenue
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual Cost
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={() => handleProjectCheckboxChange(project.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(project.budget)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {formatCurrency(project.estimatedRevenue || project.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(project.actualCost || project.cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    <span className={project.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(project.profit)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span 
                      className={
                        project.profitMargin >= 0.15 ? 'text-green-600' : 
                        project.profitMargin > 0 ? 'text-yellow-600' : 
                        'text-red-600'
                      }
                    >
                      {formatPercentage(project.profitMargin)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;