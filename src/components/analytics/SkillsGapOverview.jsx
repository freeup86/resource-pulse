import React, { useEffect, useState } from 'react';
import { useSkills } from '../../contexts/SkillsContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const SkillsGapOverview = () => {
  const { fetchGapAnalysis } = useSkills();
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGapAnalysis = async () => {
      try {
        setLoading(true);
        const data = await fetchGapAnalysis();
        setGapAnalysis(data);
        setError(null);
      } catch (err) {
        console.error('Error loading skills gap analysis:', err);
        setError('Failed to load skills gap analysis');
      } finally {
        setLoading(false);
      }
    };

    loadGapAnalysis();
  }, [fetchGapAnalysis]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  // Check if we have valid data
  if (!gapAnalysis) {
    return <div className="text-gray-500">No skills gap analysis data available</div>;
  }

  const { summary, criticalGaps, highGaps, emergingGaps } = gapAnalysis;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Skills Gap Overview</h2>
      
      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Overall Gap Score</div>
          <div className="text-2xl font-bold text-blue-600">
            {summary && typeof summary.overallGapScore === 'number' 
              ? `${Math.round(summary.overallGapScore * 100)}%` 
              : 'N/A'}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Critical Gaps</div>
          <div className="text-2xl font-bold text-red-600">
            {summary && typeof summary.criticalGapsCount === 'number' 
              ? summary.criticalGapsCount 
              : 'N/A'}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">High Priority Gaps</div>
          <div className="text-2xl font-bold text-yellow-600">
            {summary && typeof summary.highGapsCount === 'number' 
              ? summary.highGapsCount 
              : 'N/A'}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Emerging Skill Gaps</div>
          <div className="text-2xl font-bold text-purple-600">
            {summary && typeof summary.emergingGapsCount === 'number' 
              ? summary.emergingGapsCount 
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Critical Gaps */}
      {criticalGaps && criticalGaps.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Critical Skill Gaps</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gap Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {criticalGaps.map((gap, index) => (
                  <tr key={index} className="bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap">{gap.skillName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{gap.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {gap.gapType === 'missing' ? 'Missing Skill' : 
                       gap.gapType === 'low_coverage' ? 'Low Coverage' : 
                       gap.gapType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{gap.demandPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* High Priority Gaps */}
      {highGaps && highGaps.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">High Priority Skill Gaps</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Coverage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {highGaps.map((gap, index) => (
                  <tr key={index} className="bg-yellow-50">
                    <td className="px-6 py-4 whitespace-nowrap">{gap.skillName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{gap.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{gap.coveragePercentage}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">{gap.demandPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Emerging Skills */}
      {emergingGaps && emergingGaps.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Emerging Skill Gaps</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emergingGaps.map((gap, index) => (
                  <tr key={index} className="bg-purple-50">
                    <td className="px-6 py-4 whitespace-nowrap">{gap.skillName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{gap.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{gap.demandScore}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{gap.growthRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Last analyzed timestamp */}
      {gapAnalysis.analyzedAt && (
        <div className="text-right text-sm text-gray-500">
          Last analyzed: {new Date(gapAnalysis.analyzedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default SkillsGapOverview;