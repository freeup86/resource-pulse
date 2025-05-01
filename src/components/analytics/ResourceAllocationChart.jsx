// src/components/analytics/ResourceAllocationChart.jsx
import React, { useMemo } from 'react';
import { calculateTotalUtilization } from '../../utils/allocationUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ResourceAllocationChart = ({ resources }) => {
  // Process data for chart
  const chartData = useMemo(() => {
    // Get unique roles
    const roles = [...new Set(resources.map(r => r.role))];
    
    // Calculate allocation stats by role
    return roles.map(role => {
      const resourcesInRole = resources.filter(r => r.role === role);
      const totalInRole = resourcesInRole.length;
      const allocatedCount = resourcesInRole.filter(r => calculateTotalUtilization(r) > 0).length;
      const fullyAllocatedCount = resourcesInRole.filter(r => calculateTotalUtilization(r) >= 100).length;
      
      const avgUtilization = resourcesInRole.reduce((sum, r) => sum + calculateTotalUtilization(r), 0) / totalInRole;
      
      return {
        role,
        totalCount: totalInRole,
        allocatedCount,
        fullyAllocatedCount,
        availableCount: totalInRole - fullyAllocatedCount,
        avgUtilization
      };
    });
  }, [resources]);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">Resource Allocation by Role</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="role" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="availableCount" name="Available" stackId="a" fill="#8884d8" />
            <Bar dataKey="allocatedCount" name="Allocated" stackId="a" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ResourceAllocationChart;