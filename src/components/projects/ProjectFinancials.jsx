import React, { useState } from 'react';
import { formatCurrency } from '../../utils/dateUtils';

/**
 * Component to display project financial details
 */
const ProjectFinancials = ({ project, currency = 'USD' }) => {
  const [activeTab, setActiveTab] = useState('resources');
  
  if (!project || !project.financials) {
    return <div>No financial data available</div>;
  }

  const { financials } = project;
  const isOverBudget = financials.budgetUtilizationPercentage > 100;
  const isBudgetWarning = financials.budgetUtilizationPercentage > 85 && financials.budgetUtilizationPercentage <= 100;

  // Format budget items for the display
  const budgetItems = (financials.budgetItems || []);
  
  // Format snapshots for display
  const snapshots = (financials.snapshots || []);
  
  // Format allocated resources for display
  const allocatedResources = (project.allocatedResources || []);

  return (
    <div className="project-financials">
      <h3 className="text-xl font-bold mb-4">Project Financials</h3>
      
      {/* Financial Summary */}
      <div className="bg-white rounded-lg shadow-md p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Budget */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Budget</p>
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                {formatCurrency(financials.budget || 0, currency)}
              </span>
            </div>
          </div>
          
          {/* Actual Cost */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Actual Cost</p>
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                {formatCurrency(financials.actualCost || 0, currency)}
              </span>
            </div>
          </div>
          
          {/* Variance */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Variance</p>
            <div className="flex items-center">
              <span className={`text-2xl font-bold ${financials.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {financials.variance >= 0 ? '+' : ''}
                {formatCurrency(financials.variance || 0, currency)}
              </span>
            </div>
          </div>
          
          {/* Budget Utilization */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Budget Utilization</p>
            <div className="flex items-center">
              {(isOverBudget || isBudgetWarning) && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" 
                  strokeWidth={2} style={{color: isOverBudget ? 'red' : 'orange'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <span className={`text-2xl font-bold ${
                isOverBudget ? 'text-red-600' : 
                isBudgetWarning ? 'text-yellow-600' : 
                'text-green-600'
              }`}>
                {financials.budgetUtilizationPercentage?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Budget Utilization Progress Bar */}
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-1">Budget Utilization:</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                isOverBudget ? 'bg-red-600' : 
                isBudgetWarning ? 'bg-yellow-500' : 
                'bg-green-600'
              }`}
              style={{width: `${Math.min(financials.budgetUtilizationPercentage || 0, 100)}%`}}
            ></div>
          </div>
        </div>

        {/* Profit Section */}
        {financials.profit !== null && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Total Billable Amount */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Total Billable Amount</p>
              <div className="flex items-center">
                <span className="text-2xl font-bold">
                  {formatCurrency(financials.billableAmount || 0, currency)}
                </span>
              </div>
            </div>
            
            {/* Profit */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Profit</p>
              <div className="flex items-center">
                <span className={`text-2xl font-bold ${(financials.profit > 0) ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(financials.profit || 0, currency)}
                </span>
              </div>
            </div>
            
            {/* Profit Margin */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Profit Margin</p>
              <div className="flex items-center">
                <span className={`text-2xl font-bold ${(financials.profitMargin > 0) ? 'text-green-600' : 'text-red-600'}`}>
                  {financials.profitMargin?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Tabs for detailed information */}
      <div className="mb-4 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button 
              className={`inline-block py-2 px-4 text-sm font-medium ${
                activeTab === 'resources' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('resources')}
            >
              Resources
            </button>
          </li>
          <li className="mr-2">
            <button 
              className={`inline-block py-2 px-4 text-sm font-medium ${
                activeTab === 'budget-items' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('budget-items')}
            >
              Budget Items
            </button>
          </li>
          <li className="mr-2">
            <button 
              className={`inline-block py-2 px-4 text-sm font-medium ${
                activeTab === 'snapshots' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('snapshots')}
            >
              Financial Snapshots
            </button>
          </li>
        </ul>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allocatedResources.map((resource) => {
                  const totalCost = resource.totalCost || (resource.hourlyRate && resource.totalHours ? resource.hourlyRate * resource.totalHours : 0);
                  const profit = (resource.billableAmount || 0) - (totalCost || 0);
                  
                  return (
                    <tr key={resource.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{resource.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resource.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resource.utilization}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Cost: {formatCurrency(resource.hourlyRate, currency)}</div>
                        <div>Bill: {formatCurrency(resource.billableRate, currency)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resource.totalHours}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(totalCost, currency)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(resource.billableAmount, currency)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(profit, currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {allocatedResources.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                      No resources allocated to this project
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Budget Items Tab */}
        {activeTab === 'budget-items' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budgetItems.map((item) => {
                  const variancePercent = item.plannedAmount ? Math.round((item.variance / item.plannedAmount) * 100) : 0;
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.plannedAmount, currency)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.actualAmount || 0, currency)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={variancePercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(item.variance || 0, currency)} ({variancePercent}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {budgetItems.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No budget items available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Financial Snapshots Tab */}
        {activeTab === 'snapshots' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forecasted Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {snapshots.map((snapshot) => (
                  <tr key={snapshot.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(snapshot.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(snapshot.plannedBudget, currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(snapshot.actualCost || 0, currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(snapshot.forecastedCost || 0, currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(snapshot.variance || 0, currency)}
                    </td>
                  </tr>
                ))}
                {snapshots.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No financial snapshots available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Financial Notes */}
      {financials.financialNotes && (
        <div className="bg-white rounded-lg shadow-md mt-6 p-4">
          <h4 className="text-lg font-medium mb-2">Financial Notes</h4>
          <div className="prose prose-sm">
            <div dangerouslySetInnerHTML={{ __html: financials.financialNotes.replace(/\n/g, '<br/>') }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFinancials;