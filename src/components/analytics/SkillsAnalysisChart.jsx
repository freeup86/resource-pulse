// src/components/analytics/SkillsAnalysisChart.jsx
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SkillsAnalysisChart = ({ resources, projects }) => {
  // Process data for chart
  const chartData = useMemo(() => {
    // Get all unique skills from both resources and project requirements
    const allSkills = new Set();
    
    resources.forEach(resource => {
      resource.skills.forEach(skill => allSkills.add(skill));
    });
    
    projects.forEach(project => {
      project.requiredSkills.forEach(skill => allSkills.add(skill));
    });
    
    // Calculate skill supply and demand
    return Array.from(allSkills).map(skill => {
      // Count resources with this skill
      const resourcesWithSkill = resources.filter(r => 
        r.skills.includes(skill)
      ).length;
      
      // Count projects requiring this skill
      const projectsRequiringSkill = projects.filter(p => 
        p.requiredSkills.includes(skill)
      ).length;
      
      return {
        name: skill,
        available: resourcesWithSkill,
        required: projectsRequiringSkill,
        gap: resourcesWithSkill - projectsRequiringSkill
      };
    }).sort((a, b) => a.gap - b.gap); // Sort by gap (shortages first)
  }, [resources, projects]);
  
  // Take top 10 skill gaps (5 shortages, 5 surpluses)
  const topSkillGaps = useMemo(() => {
    const shortages = chartData.filter(skill => skill.gap < 0).slice(0, 5);
    const surpluses = chartData.filter(skill => skill.gap > 0).slice(-5).reverse();
    return [...shortages, ...surpluses];
  }, [chartData]);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">Skills Gap Analysis</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topSkillGaps}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" />
            <Tooltip />
            <Legend />
            <Bar dataKey="available" name="Available" fill="#82ca9d" />
            <Bar dataKey="required" name="Required" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SkillsAnalysisChart;