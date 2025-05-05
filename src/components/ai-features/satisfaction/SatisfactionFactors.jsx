import React from 'react';

const SatisfactionFactors = ({ factors }) => {
  // Guard clause - if factors is undefined or doesn't have expected structure
  if (!factors || !factors.factors || !Array.isArray(factors.factors)) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Factor Data Available</h3>
          <p className="text-gray-500">The satisfaction factors for this project are currently unavailable or being processed.</p>
        </div>
        
        {/* Display basic factors from the API response if available */}
        {factors && factors.positiveFactors && Array.isArray(factors.positiveFactors) && factors.positiveFactors.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Positive Factors</h3>
            <div className="space-y-3">
              {factors.positiveFactors.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg bg-green-50 border-green-100">
                  <div className="flex items-start">
                    <div className="mr-3 mt-1 text-green-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{item.factor}</div>
                      {item.count > 1 && (
                        <div className="text-sm text-gray-600 mt-1">
                          Mentioned {item.count} times in analysis
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {factors && factors.negativeFactors && Array.isArray(factors.negativeFactors) && factors.negativeFactors.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Areas for Improvement</h3>
            <div className="space-y-3">
              {factors.negativeFactors.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg bg-red-50 border-red-100">
                  <div className="flex items-start">
                    <div className="mr-3 mt-1 text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{item.factor}</div>
                      {item.count > 1 && (
                        <div className="text-sm text-gray-600 mt-1">
                          Mentioned {item.count} times in analysis
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Project information section */}
        {factors && factors.projectName && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-sm text-gray-500">Project:</span>
                <p className="font-medium">{factors.projectName}</p>
              </div>
              {factors.clientName && (
                <div>
                  <span className="text-sm text-gray-500">Client:</span>
                  <p className="font-medium">{factors.clientName}</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-gray-500 italic">
              Last updated: {new Date(factors.retrievedAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Function to get impact color based on score
  const getImpactColor = (impact) => {
    if (impact >= 0.8) return 'bg-red-200 text-red-800';
    if (impact >= 0.5) return 'bg-orange-200 text-orange-800';
    if (impact >= 0.3) return 'bg-yellow-200 text-yellow-800';
    return 'bg-blue-200 text-blue-800';
  };
  
  // Function to get impact level text
  const getImpactText = (impact) => {
    if (impact >= 0.8) return 'Critical';
    if (impact >= 0.5) return 'High';
    if (impact >= 0.3) return 'Medium';
    return 'Low';
  };
  
  // Function to get sentiment color based on type
  const getSentimentColor = (type) => {
    switch(type) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };
  
  // Function to get sentiment icon based on type
  const getSentimentIcon = (type) => {
    switch(type) {
      case 'positive':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        );
      case 'negative':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall analysis */}
      {factors.analysis && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Factors Analysis</h3>
          <p className="text-gray-700">{factors.analysis.summary}</p>
          
          {factors.analysis.keyInsights && factors.analysis.keyInsights.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-800">Key Insights</h4>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {factors.analysis.keyInsights.map((insight, index) => (
                  <li key={index} className="text-gray-700">{insight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Factors List */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Client Satisfaction Factors</h3>
        
        <div className="space-y-4">
          {factors.factors.map((factor, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="mr-3">{getSentimentIcon(factor.sentiment)}</div>
                  <div>
                    <h4 className="font-medium text-gray-900">{factor.name}</h4>
                    <p className="text-sm text-gray-600">{factor.category}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded ${getImpactColor(factor.impact)}`}>
                    {getImpactText(factor.impact)} Impact
                  </span>
                  <span className="ml-3 text-lg font-bold">{(factor.score * 100).toFixed(0)}/100</span>
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-gray-700">{factor.description}</p>
                
                {factor.trends && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-800 mb-1">Trends</h5>
                    <p className={`text-sm ${getSentimentColor(factor.trends.direction)}`}>
                      {factor.trends.description}
                    </p>
                  </div>
                )}
                
                {factor.insights && factor.insights.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-800 mb-1">AI Insights</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {factor.insights.map((insight, idx) => (
                        <li key={idx} className="text-sm text-gray-700">{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {factor.recommendations && factor.recommendations.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-800 mb-1">Recommendations</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {factor.recommendations.map((recommendation, idx) => (
                        <li key={idx} className="text-sm text-gray-700">{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Factor details chart */}
              {factor.subFactors && factor.subFactors.length > 0 && (
                <div className="px-4 pb-4">
                  <h5 className="text-sm font-medium text-gray-800 mb-2">Sub-factors</h5>
                  
                  <div className="space-y-2">
                    {factor.subFactors.map((subFactor, idx) => (
                      <div key={idx} className="flex items-center">
                        <div className="w-40 mr-3 truncate">{subFactor.name}</div>
                        <div className="flex-grow">
                          <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-4 ${
                                subFactor.score >= 0.7 ? 'bg-green-500' :
                                subFactor.score >= 0.4 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${subFactor.score * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-12 text-right ml-3">
                          {(subFactor.score * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Factor Correlation */}
      {factors.correlations && factors.correlations.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Factor Correlations</h3>
          
          <div className="border rounded-lg">
            <div className="p-3 bg-gray-50 border-b">
              <h4 className="text-sm font-medium text-gray-700">How factors influence each other</h4>
            </div>
            
            <div className="p-4">
              <ul className="space-y-3">
                {factors.correlations.map((correlation, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="ml-2 text-sm text-gray-700">{correlation}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SatisfactionFactors;