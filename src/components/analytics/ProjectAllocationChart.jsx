// src/components/analytics/ProjectAllocationChart.jsx
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const ProjectAllocationChart = ({ projects, resources }) => {
  // Process data for chart
  const chartData = useMemo(() => {
    // Calculate allocations by project
    const projectAllocations = projects.map(project => {
      // Count resources allocated to this project
      const allocatedResources = resources.filter(resource => {
        const allocations = resource.allocations || [];
        return allocations.some(alloc => alloc.projectId === project.id);
      }).length;
      
      return {
        name: project.name,
        client: project.client,
        resourceCount: allocatedResources
      };
    });
    
    // Filter to only projects with allocations and sort by resource count
    return projectAllocations
      .filter(project => project.resourceCount > 0)
      .sort((a, b) => b.resourceCount - a.resourceCount)
      .slice(0, 10); // Top 10 projects
  }, [projects, resources]);
  
  // Colors for chart segments
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">Resource Distribution by Project</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="resourceCount"
              nameKey="name"
              label={({ name, resourceCount }) => `${name.substring(0, 15)}${name.length > 15 ? '...' : ''} (${resourceCount})`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name, props) => [`${value} resources`, props.payload.name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProjectAllocationChart;