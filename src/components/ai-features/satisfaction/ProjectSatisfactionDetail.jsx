import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SatisfactionFactors from './SatisfactionFactors';
import ResourcePairings from './ResourcePairings';

const ProjectSatisfactionDetail = ({ project, factors, pairings }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Guard clause - if project is undefined
  if (!project) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Data Available</h3>
          <p className="text-gray-500">The project details couldn't be loaded. Please try selecting a project again.</p>
        </div>
      </div>
    );
  }
  
  // Function to get color based on satisfaction score
  const getSatisfactionColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Function to get trend icon and color
  const getTrendDisplay = (trend) => {
    if (trend > 0) {
      return {
        icon: (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ),
        color: 'text-green-600',
        text: `+${trend}%`
      };
    } else if (trend < 0) {
      return {
        icon: (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
          </svg>
        ),
        color: 'text-red-600',
        text: `${trend}%`
      };
    } else {
      return {
        icon: (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        ),
        color: 'text-gray-600',
        text: 'No change'
      };
    }
  };
  
  // Function to get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'at_risk':
        return 'bg-red-100 text-red-800';
      case 'needs_attention':
        return 'bg-yellow-100 text-yellow-800';
      case 'satisfied':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Function to get status label
  const getStatusLabel = (status) => {
    switch(status) {
      case 'at_risk':
        return 'At Risk';
      case 'needs_attention':
        return 'Needs Attention';
      case 'satisfied':
        return 'Satisfied';
      default:
        return 'Unknown';
    }
  };
  
  // Get the trend display
  const trendDisplay = getTrendDisplay(project.trend);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Project header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>
              <span className={`ml-3 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              <span className="font-medium">Client:</span> {project.client}
            </p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center">
              <div className={`text-3xl font-bold ${getSatisfactionColor(project.satisfactionScore)}`}>
                {project.satisfactionScore}
              </div>
              <div className="ml-2 text-2xl text-gray-400">/100</div>
            </div>
            <div className="flex items-center justify-end mt-1">
              {trendDisplay.icon}
              <span className={`ml-1 text-sm ${trendDisplay.color}`}>{trendDisplay.text}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                project.satisfactionScore >= 70 ? 'bg-green-500' :
                project.satisfactionScore >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${project.satisfactionScore}%` }}
            ></div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-gray-500">Start Date</span>
            <p className="font-medium">{project.startDate}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">End Date</span>
            <p className="font-medium">{project.endDate}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Budget Status</span>
            <p className={`font-medium ${
              project.budgetStatus === 'over' ? 'text-red-600' :
              project.budgetStatus === 'at_risk' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {project.budgetStatus === 'over' ? 'Over Budget' :
               project.budgetStatus === 'at_risk' ? 'At Risk' :
               'On Budget'}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Team Size</span>
            <p className="font-medium">{project.teamSize} resources</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'factors'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('factors')}
          >
            Satisfaction Factors
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'pairings'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('pairings')}
          >
            Resource Pairings
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* AI Satisfaction Analysis */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">AI Satisfaction Analysis</h3>
              
              {project.overallSatisfaction ? (
                <div>
                  <div className="flex items-center mb-3">
                    <div className={`text-2xl font-bold ${getSatisfactionColor(project.overallSatisfaction.score)}`}>
                      {project.overallSatisfaction.score}/100
                    </div>
                    <div className={`ml-3 px-3 py-1 text-sm font-medium rounded-full ${
                      project.overallSatisfaction.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                      project.overallSatisfaction.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {project.overallSatisfaction.riskLevel.charAt(0).toUpperCase() + project.overallSatisfaction.riskLevel.slice(1)} Risk
                    </div>
                  </div>
                  
                  <p className="text-gray-700">
                    Based on our analysis, this project currently has a client satisfaction score of {project.overallSatisfaction.score}/100, 
                    which indicates a {project.overallSatisfaction.riskLevel} risk level. The score is calculated from&nbsp; 
                    {project.overallSatisfaction.totalResources} resources allocated to this project.
                  </p>
                  
                  {/* Resource risk breakdown */}
                  {project.overallSatisfaction.resourcesByRisk && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Resource Risk Breakdown</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">High Risk</div>
                          <div className="text-xl font-bold text-red-600">
                            {project.overallSatisfaction.resourcesByRisk.high || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Medium Risk</div>
                          <div className="text-xl font-bold text-yellow-600">
                            {project.overallSatisfaction.resourcesByRisk.medium || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Low Risk</div>
                          <div className="text-xl font-bold text-green-600">
                            {project.overallSatisfaction.resourcesByRisk.low || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : project.analysis ? (
                <p className="text-gray-700">{project.analysis}</p>
              ) : (
                <p className="text-gray-700">
                  This project has a satisfaction score based on multiple factors including resource allocation, 
                  project status, and communication patterns. View the Satisfaction Factors tab for more details.
                </p>
              )}
              
              {project.recommendations && project.recommendations.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-800">Recommendations</h4>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {project.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-gray-700">{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Resource Allocation Details */}
            {project.resourcePredictions && project.resourcePredictions.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Resource Satisfaction Metrics</h3>
                
                <div className="space-y-4">
                  {project.resourcePredictions.map((resource, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{resource.resourceName}</div>
                          <div className="text-sm text-gray-600">
                            Allocation: {resource.allocation}%
                          </div>
                        </div>
                        
                        {resource.prediction && resource.prediction.prediction && (
                          <div className="flex items-center">
                            <div className={`mr-2 px-2 py-1 text-xs font-medium rounded-full ${
                              resource.prediction.prediction.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                              resource.prediction.prediction.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {resource.prediction.prediction.riskLevel.charAt(0).toUpperCase() + resource.prediction.prediction.riskLevel.slice(1)} Risk
                            </div>
                            <div className={`text-lg font-bold ${getSatisfactionColor(resource.prediction.prediction.satisfactionProbability)}`}>
                              {resource.prediction.prediction.satisfactionProbability}/100
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {resource.prediction && resource.prediction.prediction && (
                        <div className="p-4">
                          {/* Factors */}
                          {resource.prediction.prediction.positiveFactors && resource.prediction.prediction.positiveFactors.length > 0 && (
                            <div className="mb-3">
                              <div className="text-sm font-medium text-gray-700 mb-1">Positive Factors</div>
                              <ul className="list-disc list-inside text-sm text-gray-600">
                                {resource.prediction.prediction.positiveFactors.map((factor, idx) => (
                                  <li key={idx}>{factor}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {resource.prediction.prediction.negativeFactors && resource.prediction.prediction.negativeFactors.length > 0 && (
                            <div className="mb-3">
                              <div className="text-sm font-medium text-gray-700 mb-1">Areas for Improvement</div>
                              <ul className="list-disc list-inside text-sm text-gray-600">
                                {resource.prediction.prediction.negativeFactors.map((factor, idx) => (
                                  <li key={idx}>{factor}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Timeline */}
                          <div className="mt-3">
                            <div className="text-sm font-medium text-gray-700 mb-1">Resource Timeline</div>
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium">Start:</span>
                              <span className="ml-1">{new Date(resource.startDate).toLocaleDateString()}</span>
                              <span className="mx-2">→</span>
                              <span className="font-medium">End:</span>
                              <span className="ml-1">{new Date(resource.endDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Historical Data */}
            {project.history && project.history.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Satisfaction Trend</h3>
                
                <div className="relative overflow-hidden">
                  {/* Vertical line */}
                  <div className="absolute top-0 bottom-0 left-[7px] w-0.5 bg-gray-200"></div>
                  
                  {/* Timeline items */}
                  <div className="space-y-4">
                    {project.history.map((item, index) => (
                      <div key={index} className="flex">
                        <div className={`relative flex-shrink-0 w-3.5 h-3.5 rounded-full mt-1.5 mr-3 ${
                          item.score >= 70 ? 'bg-green-500' :
                          item.score >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        
                        <div className="flex-grow pb-4">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium text-gray-900">{item.date}</div>
                            <div className={`text-sm font-bold ${getSatisfactionColor(item.score)}`}>
                              {item.score}/100
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{item.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Project Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Project Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Project Status</div>
                  <div className="text-lg font-bold">
                    {project.status}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Start Date</div>
                  <div className="text-lg font-bold">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">End Date</div>
                  <div className="text-lg font-bold">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Team Size</div>
                  <div className="text-lg font-bold">
                    {project.resourcePredictions ? project.resourcePredictions.length : 0} Resources
                  </div>
                </div>
                
                {/* Budget information if available */}
                {(project.budget || project.actualCost) && (
                  <>
                    {project.budget && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-500">Budget</div>
                        <div className="text-lg font-bold">
                          {typeof project.budget === 'number' ? `$${project.budget.toLocaleString()}` : project.budget}
                        </div>
                      </div>
                    )}
                    
                    {project.actualCost && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-500">Actual Cost</div>
                        <div className="text-lg font-bold">
                          {typeof project.actualCost === 'number' ? `$${project.actualCost.toLocaleString()}` : project.actualCost}
                        </div>
                      </div>
                    )}
                    
                    {project.budget && project.actualCost && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-500">Budget Utilization</div>
                        <div className={`text-lg font-bold ${
                          (project.actualCost / project.budget) > 1 ? 'text-red-600' :
                          (project.actualCost / project.budget) > 0.9 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {typeof project.budget === 'number' && typeof project.actualCost === 'number' 
                            ? `${((project.actualCost / project.budget) * 100).toFixed(0)}%` 
                            : 'N/A'
                          }
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* Last updated time */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Last Analysis</div>
                  <div className="text-md">
                    {project.predictedAt ? new Date(project.predictedAt).toLocaleString() : 'Not available'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Key Metrics (if any additional metrics are provided) */}
            {project.metrics && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Key Project Metrics</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {project.metrics.map((metric, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500">{metric.name}</div>
                      <div className="text-xl font-bold">{metric.value}</div>
                      {metric.change !== undefined && (
                        <div className={`text-xs flex items-center ${
                          metric.change > 0 ? 'text-green-600' :
                          metric.change < 0 ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {metric.change > 0 ? (
                            <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : metric.change < 0 ? (
                            <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                            </svg>
                          )}
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'factors' && factors && (
          <SatisfactionFactors factors={factors} />
        )}
        
        {activeTab === 'pairings' && pairings && (
          <ResourcePairings pairings={pairings} />
        )}
      </div>
    </div>
  );
};

export default ProjectSatisfactionDetail;