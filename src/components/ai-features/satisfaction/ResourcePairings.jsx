import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ResourcePairings = ({ pairings }) => {
  const [selectedResource, setSelectedResource] = useState(null);
  
  // Guard clause - if pairings is undefined or empty, or if pairings array is empty
  if (!pairings || (Array.isArray(pairings.pairings) && pairings.pairings.length === 0)) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Resource Pairing Recommendations</h3>
          
          {/* Display the message from API if available, otherwise use default text */}
          <p className="text-gray-600 max-w-md mx-auto">
            {pairings && pairings.message ? pairings.message : 'No resource pairing recommendations are currently needed for this project.'}
          </p>
          
          {/* Display project and client info if available */}
          {pairings && pairings.projectName && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                <span className="font-medium">Project:</span> {pairings.projectName}
              </p>
              {pairings.clientName && (
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Client:</span> {pairings.clientName}
                </p>
              )}
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
            <h4 className="text-sm font-medium text-gray-800 mb-2">What are Resource Pairings?</h4>
            <p className="text-sm text-gray-600">
              Resource pairings are recommendations for matching resources with clients based on factors like past work history, communication styles, and skill alignment. When no pairings are shown, it means your current resource allocation is optimal.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Function to get match percentage color
  const getMatchColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Function to get impact color
  const getImpactColor = (impact) => {
    switch(impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Calculate resource utilization
  const calculateUtilization = (allocations) => {
    if (!allocations || allocations.length === 0) return 0;
    
    return allocations.reduce((sum, allocation) => sum + allocation.percentage, 0);
  };
  
  return (
    <div className="space-y-6">
      {/* Overview */}
      {pairings.analysis && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Resource-Client Pairing Analysis</h3>
          <p className="text-gray-700">{pairings.analysis.summary}</p>
          
          {pairings.analysis.keyInsights && pairings.analysis.keyInsights.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-800">Key Insights</h4>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {pairings.analysis.keyInsights.map((insight, index) => (
                  <li key={index} className="text-gray-700">{insight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Current Team */}
      {pairings.currentTeam && pairings.currentTeam.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Current Team</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pairings.currentTeam.map((resource) => (
              <div 
                key={resource.id}
                className={`border rounded-lg overflow-hidden cursor-pointer ${
                  selectedResource === resource.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
                }`}
                onClick={() => setSelectedResource(selectedResource === resource.id ? null : resource.id)}
              >
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <Link 
                      to={`/resources/${resource.id}`} 
                      className="font-medium text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {resource.name}
                    </Link>
                    <p className="text-sm text-gray-600">{resource.role}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getMatchColor(resource.clientFit)}`}>
                      {resource.clientFit}%
                    </div>
                    <div className="text-xs text-gray-500">client fit</div>
                  </div>
                </div>
                
                {/* Resource details (shown when selected) */}
                {selectedResource === resource.id && (
                  <div className="bg-gray-50 p-4 border-t">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Allocation</div>
                        <div className="font-medium">{resource.allocation}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Client Experience</div>
                        <div className="font-medium">{resource.clientExperience || 'None'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Role Experience</div>
                        <div className="font-medium">{resource.roleExperience}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Communication</div>
                        <div className="font-medium">{resource.communication}</div>
                      </div>
                    </div>
                    
                    {resource.strengths && resource.strengths.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">Strengths</div>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {resource.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {resource.challenges && resource.challenges.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">Challenges</div>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {resource.challenges.map((challenge, index) => (
                            <li key={index}>{challenge}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {resource.recommendation && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                        <div className="font-medium text-gray-700 mb-1">AI Recommendation</div>
                        <p className="text-gray-700">{resource.recommendation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommended Changes */}
      {pairings.recommendedChanges && pairings.recommendedChanges.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Recommended Resource Changes</h3>
          
          <div className="space-y-4">
            {pairings.recommendedChanges.map((change, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                  <div className="font-medium text-gray-900">{change.type} Change</div>
                  <span className={`px-2 py-1 text-xs rounded ${getImpactColor(change.impact)}`}>
                    {change.impact.charAt(0).toUpperCase() + change.impact.slice(1)} Impact
                  </span>
                </div>
                
                <div className="p-4">
                  <div className="mb-3">
                    <p className="text-gray-700">{change.description}</p>
                  </div>
                  
                  {change.resources && change.resources.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Resources Affected</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {change.resources.map((resource, idx) => (
                          <div key={idx} className="flex items-center p-2 bg-gray-50 rounded">
                            <div className="flex-grow">
                              <div className="font-medium text-gray-900">{resource.name}</div>
                              <div className="text-sm text-gray-600">{resource.role}</div>
                            </div>
                            <div className="ml-2">
                              {resource.action === 'add' && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Add
                                </span>
                              )}
                              {resource.action === 'remove' && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                  Remove
                                </span>
                              )}
                              {resource.action === 'adjust' && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  Adjust
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {change.rationale && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-800 mb-1">Rationale</h4>
                      <p className="text-sm text-gray-700">{change.rationale}</p>
                    </div>
                  )}
                  
                  {change.estimatedImpact && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-800 mb-1">Estimated Impact</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Satisfaction:</span> 
                          <span className={`ml-1 font-medium ${
                            change.estimatedImpact.satisfaction > 0 ? 'text-green-600' : 
                            change.estimatedImpact.satisfaction < 0 ? 'text-red-600' : 
                            'text-gray-600'
                          }`}>
                            {change.estimatedImpact.satisfaction > 0 ? '+' : ''}
                            {change.estimatedImpact.satisfaction}%
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-gray-600">Delivery:</span> 
                          <span className={`ml-1 font-medium ${
                            change.estimatedImpact.delivery > 0 ? 'text-green-600' : 
                            change.estimatedImpact.delivery < 0 ? 'text-red-600' : 
                            'text-gray-600'
                          }`}>
                            {change.estimatedImpact.delivery > 0 ? '+' : ''}
                            {change.estimatedImpact.delivery}%
                          </span>
                        </div>
                        
                        {change.estimatedImpact.cost !== undefined && (
                          <div>
                            <span className="text-gray-600">Cost:</span> 
                            <span className={`ml-1 font-medium ${
                              change.estimatedImpact.cost < 0 ? 'text-green-600' : 
                              change.estimatedImpact.cost > 0 ? 'text-red-600' : 
                              'text-gray-600'
                            }`}>
                              {change.estimatedImpact.cost > 0 ? '+' : ''}
                              {change.estimatedImpact.cost}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Candidate Resources */}
      {pairings.candidateResources && pairings.candidateResources.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Candidate Resources</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Fit
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Availability
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skills Match
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pairings.candidateResources.map((resource) => {
                  const utilization = calculateUtilization(resource.currentAllocations);
                  
                  return (
                    <tr key={resource.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link 
                          to={`/resources/${resource.id}`} 
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {resource.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {resource.role}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`font-medium ${getMatchColor(resource.clientFit)}`}>
                          {resource.clientFit}%
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                utilization >= 90 ? 'bg-red-500' :
                                utilization >= 70 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${utilization}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {100 - utilization}% free
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`font-medium ${getMatchColor(resource.skillsMatch)}`}>
                          {resource.skillsMatch}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcePairings;