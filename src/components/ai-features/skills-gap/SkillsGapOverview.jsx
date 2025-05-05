import React, { useState } from 'react';
import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend
} from 'recharts';
import SkillTag from '../../common/SkillTag';

const SkillsGapOverview = ({ data, onDepartmentSelection, selectedDepartments }) => {
  const [viewMode, setViewMode] = useState('all');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState('all');

  // Filter skill categories for dropdown with null safety check
  const skillCategories = ['all', ...new Set((data?.skills || []).map(skill => skill.category))];

  // Handle department selection/filtering
  const handleDepartmentChange = (departmentId) => {
    if (selectedDepartments.includes(departmentId)) {
      onDepartmentSelection(selectedDepartments.filter(id => id !== departmentId));
    } else {
      onDepartmentSelection([...selectedDepartments, departmentId]);
    }
  };

  // Handle "Select All Departments" button
  const handleSelectAllDepartments = () => {
    if (!data?.departments) return;

    if (selectedDepartments.length === data.departments.length) {
      onDepartmentSelection([]);
    } else {
      onDepartmentSelection(data.departments.map(dept => dept.id));
    }
  };

  // Filter skills based on selected category with null safety check
  const filteredSkills = selectedSkillCategory === 'all'
    ? (data?.skills || [])
    : (data?.skills || []).filter(skill => skill.category === selectedSkillCategory);

  // Sort skills by gap size (descending) for the gap view
  const sortedSkills = viewMode === 'gap'
    ? [...filteredSkills].sort((a, b) => (b.gap || 0) - (a.gap || 0))
    : filteredSkills;

  // Prepare data for radar chart
  const radarData = filteredSkills.map(skill => ({
    skill: skill?.name || 'Unknown',
    current: (skill?.currentLevel || 0) * 100,
    required: (skill?.requiredLevel || 0) * 100,
    gap: Math.max(0, ((skill?.requiredLevel || 0) - (skill?.currentLevel || 0)) * 100)
  }));

  return (
    <div className="space-y-8">
      {/* Skills Gap Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Total Skills</h3>
          <p className="text-3xl font-bold text-blue-600">{data?.summary?.totalSkills || 0}</p>
          <p className="text-sm text-gray-600 mt-2">
            across {data?.summary?.skillCategories || 0} categories
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Gap Coverage</h3>
          <p className="text-3xl font-bold text-green-600">{data?.summary?.gapCoverage || 0}%</p>
          <p className="text-sm text-gray-600 mt-2">
            of skill requirements met
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Critical Gaps</h3>
          <p className="text-3xl font-bold text-red-600">{data?.summary?.criticalGaps || 0}</p>
          <p className="text-sm text-gray-600 mt-2">
            high-priority skills needed
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Training Needed</h3>
          <p className="text-3xl font-bold text-indigo-600">{data?.summary?.trainingNeeded || 0}</p>
          <p className="text-sm text-gray-600 mt-2">
            resources need upskilling
          </p>
        </div>
      </div>
      
      {/* AI Insights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">AI Skills Gap Insights</h3>
        {data?.aiInsights ? (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-700">{data.aiInsights?.summary || 'The organization has significant gaps in cloud and data engineering skills, which are critical for upcoming projects.'}</p>
            
            {data.aiInsights?.recommendations && data.aiInsights.recommendations.length > 0 ? (
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">Strategic Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {data.aiInsights.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-gray-700">{recommendation}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">Strategic Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li className="text-gray-700">Focus on cloud architecture training and hiring to address the most critical gap.</li>
                  <li className="text-gray-700">Develop a technical upskilling program for React and Python to enhance project delivery capabilities.</li>
                  <li className="text-gray-700">Consider creating a mentorship program to leverage experienced resources for knowledge transfer.</li>
                </ul>
              </div>
            )}
            
            {data.aiInsights?.trends && data.aiInsights.trends.length > 0 ? (
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">Skill Trends:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {data.aiInsights.trends.map((trend, index) => (
                    <li key={index} className="text-gray-700">{trend}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">Skill Trends:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li className="text-gray-700">Machine learning and AI skills show rapid growth in market demand.</li>
                  <li className="text-gray-700">DevOps continues to be a critical capability gap for many projects.</li>
                  <li className="text-gray-700">UX design capabilities need enhancement to meet increasing client expectations.</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-700">The organization has significant gaps in cloud and data engineering skills, which are critical for upcoming projects.</p>
            
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 mb-2">Strategic Recommendations:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li className="text-gray-700">Focus on cloud architecture training and hiring to address the most critical gap.</li>
                <li className="text-gray-700">Develop a technical upskilling program for React and Python to enhance project delivery capabilities.</li>
                <li className="text-gray-700">Consider creating a mentorship program to leverage experienced resources for knowledge transfer.</li>
              </ul>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 mb-2">Skill Trends:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li className="text-gray-700">Machine learning and AI skills show rapid growth in market demand.</li>
                <li className="text-gray-700">DevOps continues to be a critical capability gap for many projects.</li>
                <li className="text-gray-700">UX design capabilities need enhancement to meet increasing client expectations.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Skills Radar Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Skills Gap Analysis</h3>
          
          <div className="flex space-x-4">
            {/* View mode selector */}
            <div className="flex border rounded-md">
              <button
                className={`px-3 py-1 text-sm ${
                  viewMode === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => setViewMode('all')}
              >
                All Skills
              </button>
              <button
                className={`px-3 py-1 text-sm ${
                  viewMode === 'gap'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => setViewMode('gap')}
              >
                Gap View
              </button>
            </div>
            
            {/* Category filter */}
            <select
              className="border rounded-md px-3 py-1 text-sm"
              value={selectedSkillCategory}
              onChange={(e) => setSelectedSkillCategory(e.target.value)}
            >
              {skillCategories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius="80%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar
                name="Current Level"
                dataKey="current"
                stroke="#4F46E5"
                fill="#4F46E5"
                fillOpacity={0.3}
              />
              <Radar
                name="Required Level"
                dataKey="required"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.3}
              />
              {viewMode === 'gap' && (
                <Radar
                  name="Skill Gap"
                  dataKey="gap"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.3}
                />
              )}
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Department Filters */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Department Filters</h3>
            <button
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={handleSelectAllDepartments}
            >
              {selectedDepartments.length === (data?.departments?.length || 0) ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {(data?.departments || []).map((department, index) => (
            <div 
              key={department?.id || index}
              className={`border rounded-lg p-4 cursor-pointer ${
                selectedDepartments.includes(department?.id)
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleDepartmentChange(department?.id)}
            >
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={selectedDepartments.includes(department?.id)}
                  onChange={() => handleDepartmentChange(department?.id)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <label className="font-medium text-gray-800 cursor-pointer">
                    {department?.name || 'Unknown Department'}
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    {department?.resourceCount || 0} resources, {department?.skillCount || 0} skills
                  </p>
                  
                  <div className="mt-3 flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${department?.coveragePercentage || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{department?.coveragePercentage || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Skills List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            {viewMode === 'gap' ? 'Skills Gap Analysis' : 'Skills Overview'}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skill
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Level
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Required Level
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gap
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSkills.map((skill, index) => {
                if (!skill) return null;
                
                const gap = (skill?.requiredLevel || 0) - (skill?.currentLevel || 0);
                let statusColor = 'text-green-600 bg-green-100';
                let statusText = 'Sufficient';
                
                if (gap > 0.3) {
                  statusColor = 'text-red-600 bg-red-100';
                  statusText = 'Critical Gap';
                } else if (gap > 0) {
                  statusColor = 'text-yellow-600 bg-yellow-100';
                  statusText = 'Minor Gap';
                }
                
                return (
                  <tr key={skill?.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{skill?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">
                            {skill?.resources || 0} resources with this skill
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkillTag skill={{ name: skill?.category || 'Unknown' }} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${(skill?.currentLevel || 0) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{((skill?.currentLevel || 0) * 100).toFixed(0)}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                        <div 
                          className="bg-red-600 h-2.5 rounded-full" 
                          style={{ width: `${(skill?.requiredLevel || 0) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{((skill?.requiredLevel || 0) * 100).toFixed(0)}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={gap > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                        {gap > 0 ? `${(gap * 100).toFixed(0)}%` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
                        {statusText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SkillsGapOverview;