import React, { useState } from 'react';
import { formatCurrency } from '../../utils/dateUtils';

/**
 * Component to display AI-generated skill recommendations
 */
const AiRecommendationDisplay = ({
  recommendations,
  onSave,
  onCancel,
  onDelete,
  isLoading,
  projectName,
  showDelete = false
}) => {
  const [savingItemId, setSavingItemId] = useState(null);
  const [expandedRecId, setExpandedRecId] = useState(null);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-700">Generating AI recommendations...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few moments.</p>
      </div>
    );
  }

  // Handle empty recommendations
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">No recommendations available</p>
          <p className="mt-1">Try adding more skills to the project or try again later.</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={onCancel}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Group recommendations by skill category for better organization
  const groupedRecommendations = recommendations.reduce((acc, rec) => {
    const category = rec.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(rec);
    return acc;
  }, {});

  // Function to toggle expanded state
  const toggleExpanded = (index) => {
    if (expandedRecId === index) {
      setExpandedRecId(null);
    } else {
      setExpandedRecId(index);
    }
  };

  // Get recommendation total count
  const totalRecommendations = recommendations.length;

  // Calculate average time and cost
  const avgTime = Math.round(recommendations.reduce((sum, rec) => sum + (rec.estimatedTimeHours || 0), 0) / totalRecommendations);
  const avgCost = parseFloat((recommendations.reduce((sum, rec) => sum + (rec.cost || 0), 0) / totalRecommendations).toFixed(2));

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl w-full max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {showDelete ? 'Saved Skill Recommendations' : 'AI-Generated Skill Recommendations'}
          </h2>
          {projectName && (
            <p className="text-sm text-gray-600">For project: {projectName}</p>
          )}
        </div>
        {!showDelete && (
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              onClick={() => onCancel && onCancel()}
            >
              Close
            </button>
          </div>
        )}
      </div>

      {!showDelete && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between mb-2">
            <p className="font-medium text-blue-800">AI recommendation insights:</p>
            <div className="flex items-center space-x-4 text-sm text-gray-700 mt-2 sm:mt-0">
              <div>
                <span className="font-medium">{totalRecommendations}</span> skills
              </div>
              <div>
                <span className="font-medium">{avgTime}</span> avg. hours
              </div>
              <div>
                <span className="font-medium">{formatCurrency(avgCost, 'USD')}</span> avg. cost
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-700">
            These personalized recommendations were generated using AI based on the project's required skills and context.
            Each recommendation includes learning resources, estimated time investment, and approximate costs.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {Object.keys(groupedRecommendations).map((category) => (
          <div key={`category-${category}`} className="mb-4">
            <h3 className="text-md font-semibold text-gray-700 mb-3 pb-1 border-b">
              {category} Skills ({groupedRecommendations[category].length})
            </h3>
            <div className="space-y-4">
              {groupedRecommendations[category].map((rec, index) => {
                const recId = `${category}-${index}`;
                const isExpanded = expandedRecId === recId;

                return (
                  <div
                    key={recId}
                    className={`border border-gray-200 rounded-lg p-4 transition-all hover:shadow-md ${isExpanded ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg text-gray-800">{rec.title}</h3>
                        <p className="text-sm font-medium text-blue-600 mt-1">
                          Skill: {rec.skillName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm text-gray-600 whitespace-nowrap">
                          {rec.estimatedTimeHours && `${rec.estimatedTimeHours} hours`}
                        </span>
                        <span className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                          {rec.cost > 0 ? formatCurrency(rec.cost, 'USD') : 'Free'}
                        </span>
                      </div>
                    </div>

                    <div className={`mt-3 ${isExpanded ? '' : 'line-clamp-3'}`}>
                      <p className="text-sm text-gray-700">
                        {rec.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {rec.resourceUrl && (
                          <a
                            href={rec.resourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline inline-flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Resource
                          </a>
                        )}
                        <button
                          onClick={() => toggleExpanded(recId)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                      </div>

                      <div className="flex space-x-2">
                        {showDelete && rec.id && (
                          <button
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this recommendation?')) {
                                onDelete(rec.id);
                              }
                            }}
                            disabled={savingItemId !== null}
                          >
                            Delete
                          </button>
                        )}

                        {!showDelete && (
                          <button
                            className={`px-3 py-1 ${savingItemId === recId ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white text-sm rounded`}
                            onClick={() => {
                              setSavingItemId(recId);
                              onSave(rec).finally(() => setSavingItemId(null));
                            }}
                            disabled={savingItemId !== null}
                          >
                            {savingItemId === recId ? (
                              <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                              </div>
                            ) : 'Save Recommendation'}
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && rec.aiGenerated && (
                      <div className="mt-3 text-xs text-gray-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generated with AI specifically for this skill and project context
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AiRecommendationDisplay;