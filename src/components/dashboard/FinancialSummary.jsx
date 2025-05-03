import React, { useMemo } from 'react';
import { useProjects } from '../../contexts/ProjectContext';
import { formatCurrency } from '../../utils/dateUtils';

/**
 * A dashboard widget that displays key financial metrics
 */
const FinancialSummary = () => {
  const { projects } = useProjects();
  
  // Calculate financial metrics from all projects
  const financialMetrics = useMemo(() => {
    if (!projects?.length) return null;
    
    const metrics = projects.reduce((acc, project) => {
      // Skip projects without financial data
      if (!project.financials) return acc;
      
      return {
        totalBudget: acc.totalBudget + (project.financials.budget || 0),
        totalActualCost: acc.totalActualCost + (project.financials.actualCost || 0),
        totalVariance: acc.totalVariance + (project.financials.variance || 0),
        totalBillable: acc.totalBillable + (project.financials.billableAmount || 0),
        totalProfit: acc.totalProfit + (project.financials.profit || 0),
        projectCount: acc.projectCount + 1,
        overBudgetCount: acc.overBudgetCount + (project.financials.budgetUtilizationPercentage > 100 ? 1 : 0),
        approachingBudgetCount: acc.approachingBudgetCount + (
          project.financials.budgetUtilizationPercentage > 85 && 
          project.financials.budgetUtilizationPercentage <= 100 ? 1 : 0
        )
      };
    }, {
      totalBudget: 0,
      totalActualCost: 0,
      totalVariance: 0,
      totalBillable: 0,
      totalProfit: 0,
      projectCount: 0,
      overBudgetCount: 0,
      approachingBudgetCount: 0
    });
    
    // Calculate averages and percentages
    if (metrics.projectCount > 0) {
      metrics.avgBudgetUtilization = (metrics.totalActualCost / metrics.totalBudget) * 100;
      metrics.avgProfitMargin = metrics.totalProfit > 0 ? 
        (metrics.totalProfit / metrics.totalBillable) * 100 : 0;
    }
    
    return metrics;
  }, [projects]);
  
  if (!financialMetrics || financialMetrics.projectCount === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-2">Financial Summary</h3>
        <p className="text-gray-500 text-center p-4">No financial data available</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Financial Summary</h3>
        <p className="text-sm text-gray-500">Across {financialMetrics.projectCount} projects with financial data</p>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Total Budget</h4>
            <p className="text-xl font-semibold">{formatCurrency(financialMetrics.totalBudget)}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Actual Costs</h4>
            <p className="text-xl font-semibold">{formatCurrency(financialMetrics.totalActualCost)}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Variance</h4>
            <p className={`text-xl font-semibold ${
              financialMetrics.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(financialMetrics.totalVariance)}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Total Profit</h4>
            <p className={`text-xl font-semibold ${
              financialMetrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(financialMetrics.totalProfit)}
            </p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Budget Utilization</h4>
            <p className={`text-lg font-semibold ${
              financialMetrics.avgBudgetUtilization > 100 
                ? 'text-red-600' 
                : financialMetrics.avgBudgetUtilization > 85 
                  ? 'text-yellow-600' 
                  : 'text-green-600'
            }`}>
              {financialMetrics.avgBudgetUtilization.toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Profit Margin</h4>
            <p className={`text-lg font-semibold ${
              financialMetrics.avgProfitMargin < 0 
                ? 'text-red-600' 
                : financialMetrics.avgProfitMargin < 15 
                  ? 'text-yellow-600' 
                  : 'text-green-600'
            }`}>
              {financialMetrics.avgProfitMargin.toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Budget Status</h4>
            <div className="flex justify-center items-center gap-2 mt-1">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                <span className="text-sm">{financialMetrics.overBudgetCount} over</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
                <span className="text-sm">{financialMetrics.approachingBudgetCount} nearing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;