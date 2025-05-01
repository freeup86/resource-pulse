// src/components/analytics/UtilizationSummary.jsx
import React, { useMemo } from 'react';
import { calculateTotalUtilization } from '../../utils/allocationUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const UtilizationSummary = ({ resources }) => {
  // Calculate utilization metrics
  const utilizationData = useMemo(() => {
    // Total number of resources
    const totalResources = resources.length;
    
    // Count resources by utilization bands
    const unallocated = resources.filter(r => calculateTotalUtilization(r) === 0).length;
    const partiallyAllocated = resources.filter(r => {
      const util = calculateTotalUtilization(r);
      return util > 0 && util < 100;
    }).length;
    const fullyAllocated = resources.filter(r => calculateTotalUtilization(r) === 100).length;
    const overAllocated = resources.filter(r => calculateTotalUtilization(r) > 100).length;
    
    // Calculate percentages
    const data = [
      { name: 'Unallocated', value: unallocated, percentage: (unallocated / totalResources) * 100 },
      { name: 'Partially Allocated', value: partiallyAllocated, percentage: (partiallyAllocated / totalResources) * 100 },
      { name: 'Fully Allocated', value: fullyAllocated, percentage: (fullyAllocated / totalResources) * 100 },
      { name: 'Over-allocated', value: overAllocated, percentage: (overAllocated / totalResources) * 100 }
    ];
    
    // Calculate average utilization
    const totalUtilization = resources.reduce((sum, r) => sum + calculateTotalUtilization(r), 0);
    const averageUtilization = totalResources > 0 ? totalUtilization / totalResources : 0;
    
    return {
      chartData: data,
      averageUtilization,
      totalResources
    };
  }, [resources]);
  
  // Colors for chart segments
  const COLORS = ['#CCCCCC', '#0088FE', '#00C49F', '#FF8042'];
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">Resource Utilization Summary</h3>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{utilizationData.totalResources}</div>
          <div className="text-sm text-gray-500">Total Resources</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {Math.round(utilizationData.averageUtilization)}%
          </div>
          <div className="text-sm text-gray-500">Avg. Utilization</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {utilizationData.chartData[2].value + utilizationData.chartData[3].value}
          </div>
          <div className="text-sm text-gray-500">Fully/Over Allocated</div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={utilizationData.chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percentage }) => `${name} (${Math.round(percentage)}%)`}
            >
              {utilizationData.chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} resources`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UtilizationSummary;