import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SkillTag from '../../common/SkillTag';

const TrainingRecommendations = ({ recommendations }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [expandedResource, setExpandedResource] = useState(null);
  
  // Extract unique skills and departments for filtering with null safety
  const recommendationsArray = Array.isArray(recommendations) ? recommendations : [];
  
  const uniqueSkills = [...new Set(recommendationsArray.flatMap(rec => 
    (rec?.skills || []).map(skill => skill?.name || 'Unknown')
  ))].sort();
  
  const uniqueDepartments = [...new Set(recommendationsArray.map(rec => 
    rec?.department || 'Unknown'
  ))].sort();
  
  // Filter recommendations based on search and filters with null safety
  const filteredRecommendations = recommendationsArray.filter(rec => {
    if (!rec) return false;
    
    // Text search
    const searchMatch = searchTerm === '' || 
      (rec.resourceName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (rec.skills || []).some(skill => (skill?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    
    // Skill filter
    const skillMatch = filterSkill === '' || 
      (rec.skills || []).some(skill => skill?.name === filterSkill);
    
    // Department filter
    const departmentMatch = filterDepartment === '' || 
      rec.department === filterDepartment;
    
    return searchMatch && skillMatch && departmentMatch;
  });
  
  // Toggle resource expansion
  const toggleResourceExpansion = (resourceId) => {
    if (expandedResource === resourceId) {
      setExpandedResource(null);
    } else {
      setExpandedResource(resourceId);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterSkill('');
    setFilterDepartment('');
  };

  // Calculate statistics with null safety
  const totalResources = recommendationsArray.length;
  const totalSkillsToTrain = recommendationsArray.reduce((sum, rec) => sum + (rec?.skills?.length || 0), 0);
  const avgSkillsPerResource = totalResources > 0 
    ? (totalSkillsToTrain / totalResources).toFixed(1) 
    : 0;
  
  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Resources Needing Training</h3>
          <p className="text-3xl font-bold text-blue-600">{totalResources}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Total Skills to Train</h3>
          <p className="text-3xl font-bold text-indigo-600">{totalSkillsToTrain}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Avg. Skills per Resource</h3>
          <p className="text-3xl font-bold text-green-600">{avgSkillsPerResource}</p>
        </div>
      </div>
      
      {/* AI Insights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">AI Training Insights</h3>
        <div className="p-4 bg-blue-50 rounded-lg">
          {recommendations?.aiInsights && recommendations.aiInsights.length > 0 ? (
            <>
              {recommendations.aiInsights.map((insight, index) => (
                <p key={index} className="text-gray-700 mb-2">{insight}</p>
              ))}
            </>
          ) : (
            <>
              <p className="text-gray-700 mb-2">Cloud and data skills represent the most critical training priorities, with potential to impact 65% of upcoming projects.</p>
              <p className="text-gray-700 mb-2">A tiered training approach is recommended - starting with foundational training for a wider audience, followed by specialized tracks.</p>
              <p className="text-gray-700 mb-2">Consider a combination of external certifications and internal mentorship programs to accelerate skill development.</p>
            </>
          )}
          
          <div className="mt-4">
            <h4 className="font-medium text-gray-800 mb-2">Training Strategy Suggestions:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li className="text-gray-700">Implement a comprehensive cloud skills training program focusing on AWS and Azure.</li>
              <li className="text-gray-700">Establish a Data Engineering learning path with structured curriculum and mentoring.</li>
              <li className="text-gray-700">Create a React/JavaScript upskilling program for front-end developers.</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Filter Training Recommendations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search by name or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill
            </label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
            >
              <option value="">All Skills</option>
              {uniqueSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Training Recommendations List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Training Recommendations</h3>
            <span className="text-sm text-gray-500">
              {filteredRecommendations.length} of {recommendations.length} resources
            </span>
          </div>
        </div>
        
        {filteredRecommendations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No training recommendations match your filters
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRecommendations.map((recommendation) => (
              <div key={recommendation.resourceId} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h4 className="text-lg font-medium text-gray-900">
                        <Link to={`/resources/${recommendation.resourceId}`} className="hover:underline text-blue-600">
                          {recommendation.resourceName}
                        </Link>
                      </h4>
                      <span className="ml-3 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {recommendation.department}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{recommendation.title}</p>
                  </div>
                  
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => toggleResourceExpansion(recommendation.resourceId)}
                  >
                    {expandedResource === recommendation.resourceId ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
                
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Recommended Skills Training</h5>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.skills.map((skill, index) => (
                      <div key={index} className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                        <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-sm text-gray-800">{skill.name}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({skill.currentLevel * 100}% → {skill.targetLevel * 100}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {expandedResource === recommendation.resourceId && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Current Skill Profile</h5>
                        <ul className="space-y-2">
                          {recommendation.currentSkills.map((skill, index) => (
                            <li key={index} className="flex items-center justify-between">
                              <span className="text-sm">{skill.name}</span>
                              <div className="flex items-center">
                                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${skill.level * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600">{(skill.level * 100).toFixed(0)}%</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Training Plans</h5>
                        {recommendation.trainingPlan && (
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-gray-600">Estimated Duration</span>
                              <span className="text-sm font-medium">{recommendation.trainingPlan.duration}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-gray-600">Priority</span>
                              <span className={`text-sm font-medium ${
                                recommendation.trainingPlan.priority === 'High' ? 'text-red-600' :
                                recommendation.trainingPlan.priority === 'Medium' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {recommendation.trainingPlan.priority}
                              </span>
                            </div>
                            
                            <h6 className="text-sm font-medium text-gray-700 mt-4 mb-2">Recommended Resources</h6>
                            <ul className="space-y-2">
                              {recommendation.trainingPlan.resources.map((resource, index) => (
                                <li key={index} className="text-sm">
                                  <span className="font-medium">{resource.type}:</span> {resource.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {recommendation.aiInsight && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">AI Personalized Insight</h5>
                        <p className="text-sm text-gray-700">{recommendation.aiInsight}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingRecommendations;