import React, { useState } from 'react';
import SkillTag from '../../common/SkillTag';

const HiringRecommendations = ({ recommendations, timeframe }) => {
  const [expandedRole, setExpandedRole] = useState(null);
  const [viewMode, setViewMode] = useState('priority');
  
  // Toggle role expansion
  const toggleRoleExpansion = (roleId) => {
    if (expandedRole === roleId) {
      setExpandedRole(null);
    } else {
      setExpandedRole(roleId);
    }
  };
  
  // Map timeframe to display text
  const timeframeText = {
    '3months': 'next 3 months',
    '6months': 'next 6 months',
    '1year': 'next year'
  }[timeframe] || 'future';
  
  // Sort roles based on view mode with null safety
  const roles = recommendations?.roles || [];
  const sortedRoles = [...roles].sort((a, b) => {
    if (viewMode === 'priority') {
      // Sort by priority (High, Medium, Low)
      const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
      return (priorityOrder[a?.priority] || 0) - (priorityOrder[b?.priority] || 0);
    } else if (viewMode === 'count') {
      // Sort by headcount needed (descending)
      return (b?.count || 0) - (a?.count || 0);
    } else {
      // Sort by department
      return (a?.department || '').localeCompare(b?.department || '');
    }
  });
  
  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Total Roles Needed</h3>
          <p className="text-3xl font-bold text-blue-600">{recommendations?.summary?.totalRoles || 0}</p>
          <p className="text-sm text-gray-600 mt-2">
            for the {timeframeText}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Headcount to Hire</h3>
          <p className="text-3xl font-bold text-indigo-600">{recommendations?.summary?.totalHeadcount || 0}</p>
          <p className="text-sm text-gray-600 mt-2">
            across {recommendations?.summary?.departmentsCount || 0} departments
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Critical Priority</h3>
          <p className="text-3xl font-bold text-red-600">{recommendations?.summary?.criticalCount || 0}</p>
          <p className="text-sm text-gray-600 mt-2">
            high-priority roles to fill
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Skills Coverage</h3>
          <p className="text-3xl font-bold text-green-600">{recommendations?.summary?.skillsCovered || 0}</p>
          <p className="text-sm text-gray-600 mt-2">
            skills addressed by hiring plan
          </p>
        </div>
      </div>
      
      {/* AI Insights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">AI Hiring Strategy Insights</h3>
        <div className="p-4 bg-blue-50 rounded-lg">
          {recommendations?.aiInsights && Array.isArray(recommendations.aiInsights) && recommendations.aiInsights.length > 0 ? (
            <>
              {recommendations.aiInsights.map((insight, index) => (
                <p key={index} className="text-gray-700 mb-2">{insight}</p>
              ))}
            </>
          ) : (
            <>
              <p className="text-gray-700 mb-2">The hiring plan should focus first on critical cloud and data skills to address immediate project demands.</p>
              <p className="text-gray-700 mb-2">Consider a mix of experienced hires and more junior positions that can be developed through mentoring and training.</p>
              <p className="text-gray-700 mb-2">The market for these skills is competitive, so retention strategies should accompany the hiring plan.</p>
            </>
          )}
          
          <div className="mt-4">
            <h4 className="font-medium text-gray-800 mb-2">Strategic Recommendations:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li className="text-gray-700">Prioritize hiring at least two Cloud Architects within the next month.</li>
              <li className="text-gray-700">Hire Data Engineers with experience in both traditional and big data technologies.</li>
              <li className="text-gray-700">Focus on building technical teams with a balanced mix of senior and junior talent.</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Hiring Plan View Options */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Hiring Plan for {timeframeText}</h3>
          
          <div className="flex border rounded-md">
            <button
              className={`px-3 py-1 text-sm ${
                viewMode === 'priority'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setViewMode('priority')}
            >
              By Priority
            </button>
            <button
              className={`px-3 py-1 text-sm ${
                viewMode === 'count'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setViewMode('count')}
            >
              By Headcount
            </button>
            <button
              className={`px-3 py-1 text-sm ${
                viewMode === 'department'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setViewMode('department')}
            >
              By Department
            </button>
          </div>
        </div>
        
        {/* Roles List */}
        <div className="space-y-4">
          {sortedRoles.map((role) => (
            <div 
              key={role.id}
              className="border rounded-lg overflow-hidden"
            >
              <div 
                className={`p-4 ${
                  role.priority === 'High' 
                    ? 'bg-red-50' 
                    : role.priority === 'Medium'
                    ? 'bg-yellow-50'
                    : 'bg-green-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-900">{role.title}</h4>
                      <span className="ml-3 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {role.department}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        role.priority === 'High' 
                          ? 'bg-red-100 text-red-800' 
                          : role.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {role.priority} Priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {role.count} {role.count === 1 ? 'position' : 'positions'} to fill
                    </p>
                  </div>
                  
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => toggleRoleExpansion(role.id)}
                  >
                    {expandedRole === role.id ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {role.requiredSkills.slice(0, 5).map((skill, index) => (
                    <SkillTag key={index} skill={{ name: skill }} />
                  ))}
                  {role.requiredSkills.length > 5 && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      +{role.requiredSkills.length - 5} more
                    </span>
                  )}
                </div>
              </div>
              
              {expandedRole === role.id && (
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-medium text-gray-800 mb-2">Role Details</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Seniority Level:</span>
                          <span>{role.seniorityLevel}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Time to Hire:</span>
                          <span>{role.timeToHire}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Market Availability:</span>
                          <span className={
                            role.marketAvailability === 'High' ? 'text-green-600' :
                            role.marketAvailability === 'Medium' ? 'text-yellow-600' :
                            'text-red-600'
                          }>
                            {role.marketAvailability}
                          </span>
                        </div>
                        {role.estimatedCost && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Estimated Cost:</span>
                            <span>{role.estimatedCost}</span>
                          </div>
                        )}
                      </div>
                      
                      {role.justification && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-800 mb-2">Justification</h5>
                          <p className="text-sm text-gray-700">{role.justification}</p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-800 mb-2">Required Skills</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {role.requiredSkills.map((skill, index) => (
                          <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                            {skill}
                          </div>
                        ))}
                      </div>
                      
                      {role.alternatives && role.alternatives.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-800 mb-2">Alternative Approaches</h5>
                          <ul className="list-disc list-inside space-y-1">
                            {role.alternatives.map((alternative, index) => (
                              <li key={index} className="text-sm text-gray-700">{alternative}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {role.aiInsight && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">AI Market Insight</h5>
                      <p className="text-sm text-gray-700">{role.aiInsight}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Hiring Timeline */}
      {recommendations?.timeline && recommendations.timeline.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-6">Hiring Timeline</h3>
          
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-8 w-1 bg-gray-200"></div>
            
            <div className="space-y-6">
              {recommendations.timeline.map((period, index) => (
                <div key={index} className="relative flex items-start">
                  <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-800 flex flex-col items-center justify-center text-sm z-10">
                    <span className="font-medium">{period.month}</span>
                    <span>{period.year}</span>
                  </div>
                  
                  <div className="ml-6 bg-gray-50 rounded-lg p-4 flex-grow">
                    <h4 className="font-medium text-gray-800">{period.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{period.description}</p>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {period.roles.map((role, roleIndex) => (
                        <div 
                          key={roleIndex}
                          className={`text-xs px-2 py-1 rounded-full ${
                            role.priority === 'High' 
                              ? 'bg-red-100 text-red-800' 
                              : role.priority === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {role.title} ({role.count})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HiringRecommendations;