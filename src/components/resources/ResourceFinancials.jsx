import React from 'react';
import { formatCurrency } from '../../utils/dateUtils';

/**
 * Component to display resource financial details
 */
const ResourceFinancials = ({ resource, allocations, financialSummary, currency = 'USD' }) => {
  if (!resource) {
    return <div>No resource data available</div>;
  }

  // Format allocations for display
  const formattedAllocations = (allocations || []);
  
  // Calculate utilization metrics
  const currentUtilization = financialSummary?.currentUtilization || 0;
  const billableUtilization = financialSummary?.currentBillableUtilization || 0;
  const nonBillableUtilization = currentUtilization - billableUtilization;

  // Calculate markup percentage
  const markupPercentage = resource.hourlyRate && resource.billableRate 
    ? ((resource.billableRate / resource.hourlyRate) - 1) * 100 
    : 0;

  return (
    <div className="resource-financials">
      <h3 className="text-xl font-bold mb-4">Financial Information</h3>

      {/* Rates Information */}
      <div className="bg-white rounded-lg shadow-md p-5 mb-6">
        <h4 className="text-lg font-medium mb-3">Rate Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Hourly Cost Rate */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Hourly Cost Rate</p>
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                {formatCurrency(resource.hourlyRate || 0, resource.currency || currency)}
              </span>
            </div>
          </div>
          
          {/* Billable Rate */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Billable Rate</p>
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                {formatCurrency(resource.billableRate || 0, resource.currency || currency)}
              </span>
            </div>
          </div>
          
          {/* Markup */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Markup</p>
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                {markupPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      {financialSummary && (
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <h4 className="text-lg font-medium mb-3">Financial Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Hours */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Total Hours</p>
              <div className="flex items-center">
                <span className="text-2xl font-bold">
                  {financialSummary.totalAllocatedHours || 0} hrs
                </span>
              </div>
            </div>
            
            {/* Total Cost */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Total Cost</p>
              <div className="flex items-center">
                <span className="text-2xl font-bold">
                  {formatCurrency(financialSummary.totalCost || 0, currency)}
                </span>
              </div>
            </div>
            
            {/* Total Billable */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Total Billable</p>
              <div className="flex items-center">
                <span className="text-2xl font-bold">
                  {formatCurrency(financialSummary.totalBillableAmount || 0, currency)}
                </span>
              </div>
            </div>
            
            {/* Total Profit */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Total Profit</p>
              <div className="flex items-center">
                <span className={`text-2xl font-bold ${
                  financialSummary.totalProfit > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(financialSummary.totalProfit || 0, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Utilization Breakdown */}
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Current Utilization:</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-3">
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div 
                      style={{width: `${billableUtilization}%`}} 
                      className="bg-green-500 h-full"
                    ></div>
                    <div 
                      style={{width: `${nonBillableUtilization}%`}} 
                      className="bg-yellow-500 h-full"
                    ></div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-600">{currentUtilization}%</span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-1">
                <div className="text-sm">
                  <div className="flex items-center">
                    <span className="inline-block w-3 h-3 mr-1 bg-green-500 rounded-full"></span>
                    <span>Billable: {billableUtilization}%</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="inline-block w-3 h-3 mr-1 bg-yellow-500 rounded-full"></span>
                    <span>Non-billable: {nonBillableUtilization}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Breakdown by Project */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h4 className="text-lg font-medium mb-3">Financial Breakdown by Project</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billable</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billable</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formattedAllocations.map((allocation) => {
                const profit = 
                  (allocation.financials?.billableAmount || 0) - 
                  (allocation.financials?.totalCost || 0);
                
                const profitMargin = allocation.financials?.billableAmount 
                  ? Math.round((profit / allocation.financials.billableAmount) * 100) 
                  : 0;
                
                return (
                  <tr key={allocation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {allocation.project.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Start: {new Date(allocation.startDate).toLocaleDateString()}</div>
                      <div>End: {new Date(allocation.endDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {allocation.utilization}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {allocation.financials?.isBillable ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Cost: {formatCurrency(allocation.financials?.hourlyRate, currency)}</div>
                      <div>Bill: {formatCurrency(allocation.financials?.billableRate, currency)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {allocation.financials?.totalHours || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(allocation.financials?.totalCost, currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(allocation.financials?.billableAmount, currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="group relative">
                        <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(profit, currency)}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute z-10 bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                          Profit Margin: {profitMargin}%
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {formattedAllocations.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                    No allocations available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResourceFinancials;