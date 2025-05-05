import React, { useState } from 'react';

const OptimizationRecommendations = ({ recommendations, onApplyOptimizations }) => {
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [selectedChanges, setSelectedChanges] = useState([]);
  
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
  
  // Handle recommendation selection
  const handleRecommendationSelect = (index) => {
    setSelectedRecommendation(index);
    setSelectedChanges([]);
  };
  
  // Handle change selection
  const handleChangeSelection = (changeId) => {
    if (selectedChanges.includes(changeId)) {
      setSelectedChanges(selectedChanges.filter(id => id !== changeId));
    } else {
      setSelectedChanges([...selectedChanges, changeId]);
    }
  };
  
  // Handle "Select All Changes" button
  const handleSelectAllChanges = () => {
    const recommendation = recommendations[selectedRecommendation];
    if (selectedChanges.length === recommendation.changes.length) {
      setSelectedChanges([]);
    } else {
      setSelectedChanges(recommendation.changes.map(change => change.id));
    }
  };
  
  // Handle apply selected optimizations
  const handleApplyOptimizations = () => {
    if (selectedRecommendation === null || selectedChanges.length === 0) return;
    
    const recommendation = recommendations[selectedRecommendation];
    const changesToApply = recommendation.changes.filter(change => selectedChanges.includes(change.id));
    
    // Prepare data for API call
    const optimizationData = {
      recommendationId: recommendation.id,
      changes: changesToApply,
      allocationIds: changesToApply.map(change => change.allocationId).filter(Boolean)
    };
    
    onApplyOptimizations(optimizationData);
  };
  
  // Calculate the total impact of selected changes
  const calculateTotalImpact = () => {
    if (selectedRecommendation === null || selectedChanges.length === 0) {
      return { revenue: 0, cost: 0, profit: 0 };
    }
    
    const recommendation = recommendations[selectedRecommendation];
    return recommendation.changes
      .filter(change => selectedChanges.includes(change.id))
      .reduce(
        (total, change) => ({
          revenue: total.revenue + (change.impact.revenue || 0),
          cost: total.cost + (change.impact.cost || 0),
          profit: total.profit + (change.impact.profit || 0)
        }),
        { revenue: 0, cost: 0, profit: 0 }
      );
  };
  
  const totalImpact = calculateTotalImpact();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recommendations list - left side */}
      <div className="lg:col-span-1 bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h3 className="font-medium text-gray-800">AI Optimization Strategies</h3>
        </div>
        
        <div className="divide-y">
          {recommendations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No optimization recommendations available
            </div>
          ) : (
            recommendations.map((recommendation, index) => (
              <button
                key={index}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedRecommendation === index ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleRecommendationSelect(index)}
              >
                <h4 className="font-medium text-gray-800">{recommendation.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{recommendation.summary}</p>
                
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600">
                    +{formatCurrency(recommendation.impact.profit)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {recommendation.changes.length} changes
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      
      {/* Recommendation details - right side */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-md">
        {selectedRecommendation !== null ? (
          <div>
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">
                {recommendations[selectedRecommendation].title}
              </h3>
              <p className="text-gray-600 mt-2">
                {recommendations[selectedRecommendation].description}
              </p>
              
              {/* Impact summary */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-500">Revenue Impact</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(recommendations[selectedRecommendation].impact.revenue)}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="text-xs text-gray-500">Cost Impact</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(recommendations[selectedRecommendation].impact.cost)}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-500">Profit Impact</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(recommendations[selectedRecommendation].impact.profit)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Changes list */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-800">Recommended Changes</h4>
                <button
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={handleSelectAllChanges}
                >
                  {selectedChanges.length === recommendations[selectedRecommendation].changes.length 
                    ? 'Deselect All' 
                    : 'Select All'}
                </button>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {recommendations[selectedRecommendation].changes.map((change) => (
                  <div 
                    key={change.id}
                    className={`border rounded-lg p-4 ${
                      selectedChanges.includes(change.id)
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id={`change-${change.id}`}
                        checked={selectedChanges.includes(change.id)}
                        onChange={() => handleChangeSelection(change.id)}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <label htmlFor={`change-${change.id}`} className="font-medium text-gray-800 cursor-pointer">
                          {change.description}
                        </label>
                        
                        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Project:</span> {change.project.name}
                          </div>
                          <div>
                            <span className="text-gray-500">Resource:</span> {change.resource.name}
                          </div>
                          <div>
                            <span className="text-gray-500">Type:</span> {change.type}
                          </div>
                        </div>
                        
                        {change.details && (
                          <p className="mt-2 text-sm text-gray-600">{change.details}</p>
                        )}
                        
                        <div className="mt-2 flex space-x-4 text-sm">
                          {change.impact.revenue !== 0 && (
                            <div className={change.impact.revenue > 0 ? 'text-green-600' : 'text-red-600'}>
                              Revenue: {change.impact.revenue > 0 ? '+' : ''}{formatCurrency(change.impact.revenue)}
                            </div>
                          )}
                          {change.impact.cost !== 0 && (
                            <div className={change.impact.cost < 0 ? 'text-green-600' : 'text-red-600'}>
                              Cost: {change.impact.cost > 0 ? '+' : ''}{formatCurrency(change.impact.cost)}
                            </div>
                          )}
                          {change.impact.profit !== 0 && (
                            <div className={change.impact.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                              Profit: {change.impact.profit > 0 ? '+' : ''}{formatCurrency(change.impact.profit)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Apply changes footer */}
            {selectedChanges.length > 0 && (
              <div className="p-6 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">Total Impact of Selected Changes</h4>
                    <div className="mt-1 flex space-x-4 text-sm">
                      <div className={totalImpact.revenue > 0 ? 'text-green-600' : 'text-red-600'}>
                        Revenue: {totalImpact.revenue > 0 ? '+' : ''}{formatCurrency(totalImpact.revenue)}
                      </div>
                      <div className={totalImpact.cost < 0 ? 'text-green-600' : 'text-red-600'}>
                        Cost: {totalImpact.cost > 0 ? '+' : ''}{formatCurrency(totalImpact.cost)}
                      </div>
                      <div className={totalImpact.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                        Profit: {totalImpact.profit > 0 ? '+' : ''}{formatCurrency(totalImpact.profit)}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    onClick={handleApplyOptimizations}
                  >
                    Apply {selectedChanges.length} {selectedChanges.length === 1 ? 'Change' : 'Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-12 text-gray-500">
            Select an optimization strategy to see details
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizationRecommendations;