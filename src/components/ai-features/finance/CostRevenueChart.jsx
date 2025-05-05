import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';

const CostRevenueChart = ({ data, selectedProjects = [] }) => {
  const [chartType, setChartType] = useState('bar');
  const [timeFrame, setTimeFrame] = useState('monthly');
  
  // Ensure data and data.projects are valid before filtering
  const projects = data && data.projects && Array.isArray(data.projects) ? data.projects : [];
  
  // Filter data by selected projects if needed
  const filteredProjects = selectedProjects.length > 0
    ? projects.filter(project => selectedProjects.includes(project.id))
    : projects;
  
  // Process time series data
  const getTimeSeriesData = () => {
    // Make sure data.timeSeries exists
    if (!data || !data.timeSeries) {
      return generateDefaultTimeSeriesData();
    }
    
    const timeData = data.timeSeries[timeFrame] || [];
    
    // If no time data is available, return default data
    if (!timeData || !Array.isArray(timeData) || timeData.length === 0) {
      return generateDefaultTimeSeriesData();
    }
    
    // If projects are selected, filter the time series data to include only those projects
    if (selectedProjects.length > 0) {
      return timeData.map(period => {
        // Start with the period's date
        const filteredPeriod = { 
          date: period.date || '',
          month: period.month || '',
          quarter: period.quarter || '',
          year: period.year || new Date().getFullYear()
        };
        
        // Calculate sums only for selected projects
        let totalRevenue = 0;
        let totalCost = 0;
        
        // Make sure projectBreakdown exists and is an array
        if (period.projectBreakdown && Array.isArray(period.projectBreakdown)) {
          period.projectBreakdown.forEach(project => {
            if (selectedProjects.includes(project.id)) {
              totalRevenue += project.revenue || 0;
              totalCost += project.cost || 0;
            }
          });
        }
        
        filteredPeriod.revenue = totalRevenue;
        filteredPeriod.cost = totalCost;
        filteredPeriod.profit = totalRevenue - totalCost;
        filteredPeriod.margin = totalRevenue > 0 ? (totalRevenue - totalCost) / totalRevenue : 0;
        
        return filteredPeriod;
      });
    }
    
    return timeData;
  };
  
  // Generate default time series data when actual data is not available
  const generateDefaultTimeSeriesData = () => {
    // Create a series of monthly data for the last 6 months
    const today = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const quarters = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4];
    
    const defaultData = [];
    
    // Generate data for each month
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      
      defaultData.push({
        date: date.toISOString().split('T')[0],
        month: months[date.getMonth()],
        quarter: quarters[date.getMonth()],
        year: date.getFullYear(),
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0
      });
    }
    
    return defaultData;
  };
  
  const timeSeriesData = getTimeSeriesData();
  
  // Get labels for time periods
  const getTimeLabel = (item) => {
    if (timeFrame === 'monthly') {
      return item.month;
    } else if (timeFrame === 'quarterly') {
      return `Q${item.quarter} ${item.year}`;
    } else {
      return item.year.toString();
    }
  };
  
  // Format currency for tooltip
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Custom tooltip formatter
  const renderTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border shadow-md rounded-md">
          <p className="text-gray-600 font-medium mb-2">{label}</p>
          {payload.map((entry, index) => {
            const color = entry.color;
            let value = entry.value;
            let name = entry.name;
            
            // Format based on data type
            if (name === 'Revenue' || name === 'Cost' || name === 'Profit') {
              value = formatCurrency(value);
            } else if (name === 'Margin') {
              value = `${(value * 100).toFixed(1)}%`;
            }
            
            return (
              <p key={index} className="text-sm" style={{ color }}>
                {name}: {value}
              </p>
            );
          })}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Cost vs Revenue Analysis</h3>
        
        <div className="flex space-x-4">
          {/* Chart type selector */}
          <div className="flex border rounded-md">
            <button
              className={`px-3 py-1 text-sm ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setChartType('bar')}
            >
              Bar
            </button>
            <button
              className={`px-3 py-1 text-sm ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setChartType('line')}
            >
              Line
            </button>
            <button
              className={`px-3 py-1 text-sm ${
                chartType === 'composed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setChartType('composed')}
            >
              Combined
            </button>
          </div>
          
          {/* Time frame selector */}
          <div className="flex border rounded-md">
            <button
              className={`px-3 py-1 text-sm ${
                timeFrame === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setTimeFrame('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-3 py-1 text-sm ${
                timeFrame === 'quarterly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setTimeFrame('quarterly')}
            >
              Quarterly
            </button>
            <button
              className={`px-3 py-1 text-sm ${
                timeFrame === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setTimeFrame('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' && (
            <BarChart
              data={timeSeriesData.map(item => ({
                ...item,
                period: getTimeLabel(item)
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip content={renderTooltip} />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#4F46E5" />
              <Bar yAxisId="left" dataKey="cost" name="Cost" fill="#EF4444" />
              <Bar yAxisId="right" dataKey="profit" name="Profit" fill="#10B981" />
            </BarChart>
          )}
          
          {chartType === 'line' && (
            <LineChart
              data={timeSeriesData.map(item => ({
                ...item,
                period: getTimeLabel(item)
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
              <Tooltip content={renderTooltip} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#4F46E5" strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="cost" name="Cost" stroke="#EF4444" strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="profit" name="Profit" stroke="#10B981" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="margin" name="Margin" stroke="#F59E0B" strokeWidth={2} />
            </LineChart>
          )}
          
          {chartType === 'composed' && (
            <ComposedChart
              data={timeSeriesData.map(item => ({
                ...item,
                period: getTimeLabel(item)
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
              <Tooltip content={renderTooltip} />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#4F46E5" />
              <Bar yAxisId="left" dataKey="cost" name="Cost" fill="#EF4444" />
              <Line yAxisId="left" type="monotone" dataKey="profit" name="Profit" stroke="#10B981" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="margin" name="Margin" stroke="#F59E0B" strokeWidth={2} />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
      
      {/* AI Analysis */}
      {data && data.aiInsights && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">AI Financial Trend Analysis</h4>
          <p className="text-gray-700">{data.aiInsights.trendAnalysis || "No trend analysis available."}</p>
          
          {selectedProjects.length > 0 && filteredProjects.length > 0 && data.aiInsights.projectInsights && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 mb-2">Project-Specific Insights:</h4>
              <ul className="list-disc list-inside space-y-1">
                {filteredProjects.map((project) => {
                  const projectInsight = Array.isArray(data.aiInsights.projectInsights) 
                    ? data.aiInsights.projectInsights.find(p => p && p.id === project.id)
                    : null;
                  return projectInsight ? (
                    <li key={project.id} className="text-gray-700">
                      <span className="font-medium">{project.name}:</span> {projectInsight.insight}
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CostRevenueChart;