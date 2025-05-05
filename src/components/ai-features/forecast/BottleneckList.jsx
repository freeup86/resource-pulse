import React, { useState } from 'react';

const BottleneckList = ({ bottlenecks }) => {
  const [expandedItem, setExpandedItem] = useState(null);

  // Check if bottlenecks has the expected structure
  if (!bottlenecks || !bottlenecks.resourceBottlenecks) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-red-500">Error: Invalid data format for bottleneck detection</p>
      </div>
    );
  }

  // Use the resource bottlenecks from our new API
  const resourceBottlenecks = bottlenecks.resourceBottlenecks || [];
  const recommendations = bottlenecks.aiRecommendations || [];

  const toggleItemExpansion = (index) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  // Function to determine severity color based on bottleneck severity
  const getSeverityColor = (severity) => {
    if (severity > 8) return 'bg-red-100 text-red-800'; // Critical
    if (severity > 5) return 'bg-orange-100 text-orange-800'; // High
    if (severity > 3) return 'bg-yellow-100 text-yellow-800'; // Medium
    return 'bg-green-100 text-green-800'; // Low
  };

  // Convert severity number to text
  const getSeverityText = (severity) => {
    if (severity > 8) return 'Critical';
    if (severity > 5) return 'High';
    if (severity > 3) return 'Medium';
    return 'Low';
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">AI-Detected Resource Bottlenecks</h2>
        
        {resourceBottlenecks.length === 0 ? (
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <p className="text-green-700">No bottlenecks detected in the selected time period.</p>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-gray-600">
              The AI has identified {resourceBottlenecks.length} potential bottlenecks in resource allocation.
            </p>
            
            {recommendations.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">AI Recommendations</h3>
                <ul className="list-disc list-inside">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="mb-1 text-gray-700">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <ul className="space-y-4">
              {resourceBottlenecks.map((bottleneck, index) => (
                <li 
                  key={index} 
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleItemExpansion(index)}
                  >
                    <div className="flex items-center">
                      <div className="mr-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(bottleneck.bottleneckSeverity)}`}>
                          {getSeverityText(bottleneck.bottleneckSeverity)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{bottleneck.name}</h3>
                        <p className="text-sm text-gray-600">
                          {bottleneck.role}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">
                        {bottleneck.overallocatedMonths.length} months
                      </span>
                      <p className="text-sm text-gray-600">Overallocated</p>
                    </div>
                  </div>
                  
                  {expandedItem === index && (
                    <div className="p-4 bg-gray-50 border-t">
                      <h4 className="font-medium mb-2">Overallocated Periods</h4>
                      <ul className="list-disc list-inside mb-3">
                        {bottleneck.overallocatedMonths.map((month, i) => (
                          <li key={i}>
                            {month.month}: {Math.round(month.totalUtilization)}% utilization 
                            ({Math.round(month.overallocationAmount)}% over capacity)
                          </li>
                        ))}
                      </ul>
                      
                      {bottleneck.overallocatedMonths[0].projects && 
                       bottleneck.overallocatedMonths[0].projects.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Projects Involved</h4>
                          <ul className="list-disc list-inside">
                            {bottleneck.overallocatedMonths[0].projects.map((project, i) => (
                              <li key={i}>{project.name} ({project.utilization}%)</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BottleneckList;