import React, { useState } from 'react';

const OptimizationRecommendations = ({ recommendations = [], onApplyOptimizations }) => {
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  
  // Helper function to format currency
  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper function to format percentage
  const formatPercentage = (value) => {
    if (typeof value !== 'number') return '0%';
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // Handle recommendation selection
  const handleRecommendationSelect = (index) => {
    setSelectedRecommendation(selectedRecommendation === index ? null : index);
  };
  
  // Handle apply recommendation
  const handleApplyRecommendation = (recommendation) => {
    if (!onApplyOptimizations) return;
    
    // Prepare data for API call based on our backend structure
    const optimizationData = {
      recommendationId: recommendation.projectId || recommendation.resourceId || 'general',
      changes: [{
        type: recommendation.type,
        description: recommendation.description,
        projectId: recommendation.projectId,
        resourceId: recommendation.resourceId,
        suggestedAction: recommendation.suggestedAction
      }],
      allocationIds: recommendation.projectId ? [recommendation.projectId] : []
    };
    
    onApplyOptimizations(optimizationData);
  };
  
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <div className="mb-4">
            <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Optimization Recommendations</h3>
          <p className="text-gray-500">
            No optimization opportunities were found for the selected time period and parameters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recommendations Summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Financial Optimization Recommendations</h3>
          <p className="text-gray-600 mt-1">
            {recommendations.length} optimization {recommendations.length === 1 ? 'opportunity' : 'opportunities'} identified
          </p>
        </div>
        
        <div className="divide-y">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      recommendation.impact === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : recommendation.impact === 'medium'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {recommendation.impact} priority
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {recommendation.type?.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2">
                    {recommendation.suggestedAction || recommendation.description}
                  </h4>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {recommendation.description}
                  </p>
                  
                  {/* Project/Resource Info */}
                  {recommendation.projectName && (
                    <div className="text-sm text-gray-500 mb-2">
                      <span className="font-medium">Project:</span> {recommendation.projectName}
                      {recommendation.client && (
                        <span className="ml-2">({recommendation.client})</span>
                      )}
                    </div>
                  )}
                  
                  {recommendation.resourceName && (
                    <div className="text-sm text-gray-500 mb-2">
                      <span className="font-medium">Resource:</span> {recommendation.resourceName}
                      {recommendation.resourceRole && (
                        <span className="ml-2">({recommendation.resourceRole})</span>
                      )}
                    </div>
                  )}
                  
                  {/* Financial Impact */}
                  {recommendation.financialImpact && (
                    <div className="mt-3">
                      <button
                        onClick={() => handleRecommendationSelect(index)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {selectedRecommendation === index ? 'Hide Details' : 'View Financial Details'}
                      </button>
                      
                      {selectedRecommendation === index && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-3">Financial Impact Details</h5>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {recommendation.financialImpact.currentBudget && (
                              <div>
                                <span className="text-gray-500">Current Budget:</span>
                                <span className="ml-2 font-medium">{formatCurrency(recommendation.financialImpact.currentBudget)}</span>
                              </div>
                            )}
                            {recommendation.financialImpact.actualCost && (
                              <div>
                                <span className="text-gray-500">Actual Cost:</span>
                                <span className="ml-2 font-medium">{formatCurrency(recommendation.financialImpact.actualCost)}</span>
                              </div>
                            )}
                            {recommendation.financialImpact.deficit && (
                              <div>
                                <span className="text-gray-500">Budget Deficit:</span>
                                <span className="ml-2 font-medium text-red-600">{formatCurrency(recommendation.financialImpact.deficit)}</span>
                              </div>
                            )}
                            {recommendation.financialImpact.surplus && (
                              <div>
                                <span className="text-gray-500">Budget Surplus:</span>
                                <span className="ml-2 font-medium text-green-600">{formatCurrency(recommendation.financialImpact.surplus)}</span>
                              </div>
                            )}
                            {recommendation.financialImpact.potentialSavings && (
                              <div>
                                <span className="text-gray-500">Potential Savings:</span>
                                <span className="ml-2 font-medium text-green-600">{formatCurrency(recommendation.financialImpact.potentialSavings)}</span>
                              </div>
                            )}
                            {recommendation.financialImpact.suggestedBudget && (
                              <div>
                                <span className="text-gray-500">Suggested Budget:</span>
                                <span className="ml-2 font-medium">{formatCurrency(recommendation.financialImpact.suggestedBudget)}</span>
                              </div>
                            )}
                            {recommendation.financialImpact.currentAllocation && (
                              <div>
                                <span className="text-gray-500">Current Allocation:</span>
                                <span className="ml-2 font-medium">{recommendation.financialImpact.currentAllocation.toFixed(1)}%</span>
                              </div>
                            )}
                            {recommendation.financialImpact.overAllocation && (
                              <div>
                                <span className="text-gray-500">Over-allocation:</span>
                                <span className="ml-2 font-medium text-red-600">{recommendation.financialImpact.overAllocation.toFixed(1)}%</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Resource and project counts */}
                          {(recommendation.resourceCount || recommendation.totalAllocation) && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {recommendation.resourceCount && (
                                  <div>
                                    <span className="text-gray-500">Resources Involved:</span>
                                    <span className="ml-2 font-medium">{recommendation.resourceCount}</span>
                                  </div>
                                )}
                                {recommendation.totalAllocation && (
                                  <div>
                                    <span className="text-gray-500">Total Allocation:</span>
                                    <span className="ml-2 font-medium">{recommendation.totalAllocation.toFixed(1)}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Apply Button */}
                <div className="ml-4">
                  <button
                    onClick={() => handleApplyRecommendation(recommendation)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OptimizationRecommendations;