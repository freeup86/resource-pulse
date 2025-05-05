import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RiskChart = ({ riskHistory }) => {
  if (!riskHistory || !Array.isArray(riskHistory) || riskHistory.length === 0) {
    return (
      <div className="p-4 text-center border rounded-lg">
        <p className="text-gray-500">No risk history data available</p>
      </div>
    );
  }

  // Custom tooltip to display date in readable format and score
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border shadow-sm rounded">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-sm text-gray-700">
            Risk Score: <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Prepare data for the chart
  const chartData = riskHistory.map(item => ({
    date: item.date,
    score: item.score
  }));

  // Determine color based on latest risk score
  const getLineColor = () => {
    const latestScore = chartData[chartData.length - 1]?.score || 0;
    
    if (latestScore >= 75) return '#EF4444'; // Red for high risk
    if (latestScore >= 40) return '#F59E0B'; // Yellow/orange for medium risk
    return '#10B981'; // Green for low risk
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          domain={[0, 100]} 
          tickCount={6} 
          label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} 
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke={getLineColor()} 
          strokeWidth={2} 
          dot={{ r: 4 }} 
          activeDot={{ r: 6 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RiskChart;