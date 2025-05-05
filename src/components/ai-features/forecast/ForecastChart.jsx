import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const ForecastChart = ({ data }) => {
  // Check if data has the expected structure
  if (!data || !data.months || !data.resources || !data.team) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-red-500">Error: Invalid data format for utilization forecast</p>
      </div>
    );
  }

  // Process and format data for the chart
  // We'll use the team-level utilization data for the chart
  const chartData = data.team.monthlyUtilization.map(item => ({
    date: item.label,
    utilization: Math.round(item.utilizationRate), // Already a percentage
    avgUtilization: Math.round(data.team.avgUtilizationRate),
    optimal: 80 // Optimal utilization line (80%)
  }));

  // Get insights from the data
  const insights = {
    summary: data.team.forecast.forecastText || "No utilization forecast available.",
    details: []
  };

  // Add bottleneck information if available
  if (data.team.forecast.bottleneckMonths && data.team.forecast.bottleneckMonths.length > 0) {
    insights.details.push(`Potential capacity issues in: ${data.team.forecast.bottleneckMonths.join(', ')}`);
  }

  // Add resource utilization information
  const overutilizedCount = data.resources.filter(r => r.avgUtilization > 90).length;
  const underutilizedCount = data.resources.filter(r => r.avgUtilization < 60).length;

  if (overutilizedCount > 0) {
    insights.details.push(`${overutilizedCount} resources are over-utilized (>90%).`);
  }

  if (underutilizedCount > 0) {
    insights.details.push(`${underutilizedCount} resources are under-utilized (<60%).`);
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Utilization Forecast</h2>
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickCount={7}
            />
            <YAxis 
              domain={[0, 100]} 
              tickCount={5} 
              tick={{ fontSize: 12 }}
              label={{ value: 'Utilization %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            />
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Utilization']}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="utilization" 
              stroke="#4F46E5" 
              activeDot={{ r: 6 }} 
              name="Monthly Utilization"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="avgUtilization" 
              stroke="#10B981" 
              strokeDasharray="5 5" 
              name="Average Utilization"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="optimal" 
              stroke="#F59E0B" 
              strokeDasharray="3 3" 
              name="Optimal Utilization"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
        <p className="text-gray-700">{insights.summary}</p>
        
        {insights.details && insights.details.length > 0 && (
          <ul className="mt-2 list-disc list-inside">
            {insights.details.map((detail, index) => (
              <li key={index} className="text-gray-700">{detail}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ForecastChart;