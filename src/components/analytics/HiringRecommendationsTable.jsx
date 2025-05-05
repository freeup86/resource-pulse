import React, { useState, useEffect } from 'react';
import { useSkills } from '../../contexts/SkillsContext';

const HiringRecommendationsTable = () => {
  const { fetchHiringRecommendations } = useSkills();
  const [recommendations, setRecommendations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('6months');

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        const data = await fetchHiringRecommendations({ timeframe });
        setRecommendations(data);
        setError(null);
      } catch (err) {
        console.error('Error loading hiring recommendations:', err);
        setError('Failed to load hiring recommendations');
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [fetchHiringRecommendations, timeframe]);

  const handleTimeframeChange = (e) => {
    setTimeframe(e.target.value);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse text-blue-500">Loading hiring recommendations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Check if we have valid data
  if (!recommendations || !recommendations.criticalRoles) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-gray-500">No hiring recommendations available</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Hiring Recommendations</h2>
        <div>
          <label htmlFor="timeframeFilter" className="mr-2">Timeframe:</label>
          <select 
            id="timeframeFilter"
            value={timeframe}
            onChange={handleTimeframeChange}
            className="border rounded p-1"
          >
            <option value="1month">1 Month</option>
            <option value="3months">3 Months</option>
            <option value="6months">6 Months</option>
            <option value="1year">1 Year</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Critical Skills Shortage</div>
          <div className="text-2xl font-bold text-red-600">{recommendations.summary.criticalSkillsCount}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">High Demand Skills</div>
          <div className="text-2xl font-bold text-yellow-600">{recommendations.summary.highDemandSkillsCount}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Emerging Skills</div>
          <div className="text-2xl font-bold text-blue-600">{recommendations.summary.emergingSkillsCount}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Overall Gap Score</div>
          <div className="text-2xl font-bold text-gray-600">{Math.round(recommendations.summary.overallGapScore * 100)}%</div>
        </div>
      </div>
      
      {/* Critical Roles */}
      <div>
        <h3 className="text-lg font-medium mb-2">Critical Hiring Needs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeframe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recommendations.criticalRoles.map((role, index) => (
                <tr key={index} className="bg-red-50">
                  <td className="px-6 py-4 whitespace-nowrap">{role.skillName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{role.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{role.demandPercentage}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {role.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{role.hiringTimeframe}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{role.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* High Demand Roles */}
      {recommendations.highDemandRoles && recommendations.highDemandRoles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-2">High Demand Roles</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Coverage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeframe</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recommendations.highDemandRoles.map((role, index) => (
                  <tr key={index} className="bg-yellow-50">
                    <td className="px-6 py-4 whitespace-nowrap">{role.skillName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{role.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{role.demandPercentage}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">{role.currentCoverage}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {role.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{role.hiringTimeframe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Emerging Roles */}
      {recommendations.emergingRoles && recommendations.emergingRoles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-2">Emerging Roles</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeframe</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recommendations.emergingRoles.map((role, index) => (
                  <tr key={index} className="bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">{role.skillName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{role.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{role.demandScore}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{role.growthRate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {role.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{role.hiringTimeframe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {recommendations.aiInsights && recommendations.aiInsights.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-2">AI Insights</h3>
          <div className="bg-gray-50 p-4 rounded">
            <ul className="list-disc pl-5 space-y-2">
              {recommendations.aiInsights.map((insight, index) => (
                <li key={index} className="text-gray-700">{insight}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-red-100 mr-2"></div>
          <span>Critical Hiring Needs</span>
        </div>
        <div className="flex items-center mt-1">
          <div className="w-4 h-4 rounded-full bg-yellow-100 mr-2"></div>
          <span>High Demand Skills</span>
        </div>
        <div className="flex items-center mt-1">
          <div className="w-4 h-4 rounded-full bg-blue-100 mr-2"></div>
          <span>Emerging Skills for Future Planning</span>
        </div>
      </div>
    </div>
  );
};

export default HiringRecommendationsTable;