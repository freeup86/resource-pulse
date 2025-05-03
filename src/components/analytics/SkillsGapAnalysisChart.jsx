import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useSkills } from '../../contexts/SkillsContext';

const SkillsGapAnalysisChart = () => {
  const { fetchGapAnalysis, gapAnalysis } = useSkills();
  const [chartData, setChartData] = useState([]);
  const [selectedProficiency, setSelectedProficiency] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGapAnalysis().then(() => {
      setLoading(false);
    });
  }, [fetchGapAnalysis]);

  useEffect(() => {
    if (gapAnalysis.length === 0) return;

    // Filter and process data based on selected proficiency
    let filteredData = gapAnalysis;
    if (selectedProficiency !== "All") {
      filteredData = gapAnalysis.filter(item => item.proficiencyLevel === selectedProficiency);
    }

    // Group by skill name and calculate total gap
    const skillGaps = {};
    filteredData.forEach(item => {
      if (!skillGaps[item.name]) {
        skillGaps[item.name] = {
          name: item.name,
          category: item.category,
          available: 0,
          required: 0,
          gap: 0
        };
      }
      skillGaps[item.name].available += item.resourcesAtProficiencyCount;
      skillGaps[item.name].required += item.projectsRequiringProficiencyCount;
      skillGaps[item.name].gap += (item.resourcesAtProficiencyCount - item.projectsRequiringProficiencyCount);
    });

    // Convert to array and sort
    const sortedData = Object.values(skillGaps)
      .sort((a, b) => a.gap - b.gap) // Sort by gap (shortages first)
      .slice(0, 15); // Take top 15 skills with biggest gaps

    setChartData(sortedData);
  }, [gapAnalysis, selectedProficiency]);

  const handleProficiencyChange = (e) => {
    setSelectedProficiency(e.target.value);
  };

  // Custom bar colors - red for negative gap (shortage), green for positive (surplus)
  const getBarColor = (value) => {
    return value < 0 ? '#ef4444' : '#22c55e';
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-sm">Category: {data.category || 'Uncategorized'}</p>
          <p className="text-sm">Available: {data.available}</p>
          <p className="text-sm">Required: {data.required}</p>
          <p className={`text-sm font-bold ${data.gap < 0 ? 'text-red-600' : 'text-green-600'}`}>
            Gap: {data.gap} ({data.gap < 0 ? 'Shortage' : 'Surplus'})
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow h-96 flex items-center justify-center">
        <div className="animate-pulse text-blue-500">Loading skills gap analysis...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Skills Gap Analysis</h2>
        <div>
          <label htmlFor="proficiencyFilter" className="mr-2">Proficiency Level:</label>
          <select 
            id="proficiencyFilter"
            value={selectedProficiency}
            onChange={handleProficiencyChange}
            className="border rounded p-1"
          >
            <option value="All">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
      </div>
      
      {chartData.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          No skills gap data available for the selected criteria
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="gap" fill="#8884d8" name="Skill Gap">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.gap)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 bg-red-500 mr-2"></div>
          <span>Red bars indicate skill shortages (negative gap)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 mr-2"></div>
          <span>Green bars indicate skill surpluses (positive gap)</span>
        </div>
      </div>
    </div>
  );
};

export default SkillsGapAnalysisChart;