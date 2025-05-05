import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
  Legend
} from 'recharts';

const RiskAnalysisChart = ({ project, factors }) => {
  // Check if we have valid data
  if (!project || !factors || factors.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-red-500">Error: Invalid risk data for chart</p>
      </div>
    );
  }

  // Format factors data for the radar chart
  const chartData = factors.map(factor => ({
    name: factor.name,
    value: factor.score,
    fullMark: 100
  }));

  // Determine risk level color
  const getRiskLevelColor = (score) => {
    if (score >= 75) return 'text-red-600';
    if (score >= 50) return 'text-orange-500';
    if (score >= 25) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Determine radar chart color
  const getRadarColor = (score) => {
    if (score >= 75) return '#ef4444'; // red
    if (score >= 50) return '#f97316'; // orange
    if (score >= 25) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Risk Analysis</h2>
        <div className="flex items-center">
          <span className="mr-2">Risk Score:</span>
          <span className={`text-xl font-bold ${getRiskLevelColor(project.riskScore)}`}>
            {project.riskScore}/100
          </span>
        </div>
      </div>

      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart outerRadius="80%" data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <Radar
              name="Risk Factors"
              dataKey="value"
              stroke={getRadarColor(project.riskScore)}
              fill={getRadarColor(project.riskScore)}
              fillOpacity={0.5}
            />
            <Tooltip formatter={(value) => [`${value}/100`, 'Risk Score']} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {factors.map((factor, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">{factor.name}</h3>
              <span className={`font-bold ${getRiskLevelColor(factor.score)}`}>
                {factor.score}/100
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-2">{factor.description}</p>
            {factor.insights && (
              <p className="text-xs italic text-gray-500">{factor.insights}</p>
            )}
          </div>
        ))}
      </div>

      {project.analysisTimestamp && (
        <div className="mt-4 text-right text-xs text-gray-500">
          Analysis updated: {new Date(project.analysisTimestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default RiskAnalysisChart;