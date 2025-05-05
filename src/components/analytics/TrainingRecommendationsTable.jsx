import React, { useState, useEffect } from 'react';
import { useSkills } from '../../contexts/SkillsContext';

const TrainingRecommendationsTable = () => {
  const { fetchTrainingRecommendations } = useSkills();
  const [recommendations, setRecommendations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('6months');

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        const data = await fetchTrainingRecommendations({ timeframe });
        setRecommendations(data);
        setError(null);
      } catch (err) {
        console.error('Error loading training recommendations:', err);
        setError('Failed to load training recommendations');
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [fetchTrainingRecommendations, timeframe]);

  const handleTimeframeChange = (e) => {
    setTimeframe(e.target.value);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse text-blue-500">Loading training recommendations...</div>
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
  if (!recommendations || !recommendations.criticalSkills) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-gray-500">No training recommendations available</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Training Recommendations</h2>
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
      
      <div>
        <h3 className="text-lg font-medium mb-2">Critical Skills</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Coverage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Training Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recommendations.criticalSkills.map((skill, index) => (
                <tr key={index} className={skill.priority === 'High' ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">{skill.skillName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{skill.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{skill.currentCoverage}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">{skill.demandPercentage}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      skill.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {skill.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{skill.recommendedTrainingType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {recommendations.emergingSkills && recommendations.emergingSkills.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-2">Emerging Skills</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Training Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recommendations.emergingSkills.map((skill, index) => (
                  <tr key={index} className="bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">{skill.skillName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{skill.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{skill.demandScore}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{skill.growthRate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {skill.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{skill.recommendedTrainingType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
          <span>High Priority Skills</span>
        </div>
        <div className="flex items-center mt-1">
          <div className="w-4 h-4 rounded-full bg-blue-100 mr-2"></div>
          <span>Emerging Skills for Future Readiness</span>
        </div>
      </div>
    </div>
  );
};

export default TrainingRecommendationsTable;