import React, { useState } from 'react';

const WorkloadBalancingRecommendations = ({ recommendations }) => {
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  // Check if recommendations has the expected structure
  if (!recommendations || !recommendations.balancingRecommendations) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-red-500">Error: Invalid data format for workload balancing recommendations</p>
      </div>
    );
  }

  // Use the balancing recommendations from our new API
  const balancingRecommendations = recommendations.balancingRecommendations || [];
  const summary = recommendations.summary || {};

  // Determine opportunity level color
  const getOpportunityLevelColor = (level) => {
    switch (level) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">AI Workload Balancing Recommendations</h2>
        
        {/* Summary section */}
        {summary.summaryText && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Summary</h3>
              {summary.balancingOpportunityLevel && (
                <span className={`font-medium ${getOpportunityLevelColor(summary.balancingOpportunityLevel)}`}>
                  {summary.balancingOpportunityLevel.charAt(0).toUpperCase() + summary.balancingOpportunityLevel.slice(1)} Opportunity
                </span>
              )}
            </div>
            <p className="text-gray-700">{summary.summaryText}</p>
            
            {/* Stats */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500">Over-allocated Resources</div>
                <div className="text-lg font-bold text-gray-900">{summary.overallocatedCount || 0}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500">Under-allocated Resources</div>
                <div className="text-lg font-bold text-gray-900">{summary.underallocatedCount || 0}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500">Recommendations</div>
                <div className="text-lg font-bold text-gray-900">{summary.recommendationCount || 0}</div>
              </div>
            </div>
          </div>
        )}
        
        {balancingRecommendations.length === 0 ? (
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <p className="text-blue-700">No workload balancing recommendations available for the selected time period.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recommendations list - left side */}
            <div className="lg:col-span-1 border rounded-lg p-4">
              <h3 className="font-medium mb-3 text-gray-700">Overallocated Resources</h3>
              <ul className="space-y-2">
                {balancingRecommendations.map((recommendation, index) => (
                  <li key={index}>
                    <button
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedRecommendation === index
                          ? 'bg-blue-100 border-blue-300 border'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                      onClick={() => setSelectedRecommendation(index)}
                    >
                      <h4 className="font-medium text-gray-800">{recommendation.overallocatedResource.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {recommendation.overallocatedResource.role} - 
                        {recommendation.criticalMonths.length} critical month{recommendation.criticalMonths.length !== 1 ? 's' : ''}
                      </p>
                      <div className="mt-2 flex items-center">
                        <span className="text-sm text-blue-600">
                          {recommendation.recommendations.length} possible transfer{recommendation.recommendations.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Recommendation details - right side */}
            <div className="lg:col-span-2 border rounded-lg p-4">
              {selectedRecommendation !== null ? (
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Workload Balancing for {balancingRecommendations[selectedRecommendation].overallocatedResource.name}
                  </h3>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Critical Periods</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {balancingRecommendations[selectedRecommendation].criticalMonths.map((month, idx) => (
                        <li key={idx}>
                          {month.month}: {month.totalUtilization}% utilization 
                          ({month.overallocationAmount}% over capacity)
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Transfer Recommendations</h4>
                    <ul className="space-y-3">
                      {balancingRecommendations[selectedRecommendation].recommendations.map((rec, idx) => (
                        <li key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">
                              Transfer from {rec.fromResource.name} to {rec.toResource.name}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {rec.month}
                            </span>
                          </div>
                          <div className="mb-1 text-sm">
                            <span>Project: <strong>{rec.project.name}</strong></span>
                            <span className="ml-3">Utilization: <strong>{rec.utilization}%</strong></span>
                          </div>
                          <div className="text-xs text-gray-600 flex space-x-3 mt-1">
                            <span>
                              {rec.skillsMatch ? '✓ Matching skills' : '⚠ No matching skills'}
                            </span>
                            <span>
                              {rec.roleMatch ? '✓ Same role' : '⚠ Different role'}
                            </span>
                            <span>
                              Match score: {rec.compatibilityScore.toFixed(0)}%
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Apply Recommendations
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full py-12">
                  <p className="text-gray-500">Select an overallocated resource to see transfer recommendations</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkloadBalancingRecommendations;