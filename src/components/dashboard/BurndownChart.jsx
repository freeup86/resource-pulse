import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useProjects } from '../../contexts/ProjectContext';
import { formatDate } from '../../utils/dateUtils';
import { ChevronDown, ChevronUp } from 'lucide-react';

const BurndownChart = () => {
  const { projects, loading } = useProjects();
  const [selectedProject, setSelectedProject] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  
  // Select a project with financial data on initial load
  useEffect(() => {
    if (projects?.length > 0 && !selectedProject) {
      // Find first project with financial data
      const projectWithFinancials = projects.find(p => p.financials);
      if (projectWithFinancials) {
        setSelectedProject(projectWithFinancials);
      }
    }
  }, [projects, selectedProject]);
  
  // Generate burndown data when selected project changes
  useEffect(() => {
    if (!selectedProject) return;
    
    generateBurndownData(selectedProject);
  }, [selectedProject]);
  
  // Generate simulated burndown data for the selected project
  const generateBurndownData = (project) => {
    if (!project?.financials) return;
    
    const { budget, actualCost } = project.financials;
    
    // Create a simulated burndown from project start to now
    const today = new Date();
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    
    // Calculate total duration in days
    const totalDuration = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    const elapsedDuration = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const elapsedPercentage = Math.min(1, Math.max(0, elapsedDuration / totalDuration));
    
    // Generate data points (one per week)
    const dataPoints = [];
    const weeksTotal = Math.ceil(totalDuration / 7);
    const weeksElapsed = Math.ceil(elapsedDuration / 7);
    
    // Ideal burndown line (even consumption)
    for (let week = 0; week <= weeksTotal; week++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7));
      
      // Don't go beyond today for actual
      const isInFuture = currentDate > today;
      
      // Calculate ideal remaining budget at this point
      const idealRemainingPercentage = 1 - (week / weeksTotal);
      const idealRemaining = budget * idealRemainingPercentage;
      
      // Calculate actual remaining (with some realistic variance from ideal)
      let actualRemaining;
      
      if (isInFuture) {
        // For future points, project based on current burn rate
        const currentBurnRate = (budget - actualCost) / budget;
        const remainingPercentage = 1 - (week / weeksTotal);
        actualRemaining = budget * remainingPercentage * currentBurnRate;
      } else {
        // For past points, create a realistic path to current actual
        const pointPercentage = week / Math.max(1, weeksElapsed);
        const variance = (Math.random() * 0.1) - 0.05; // +/- 5% random variance
        const burnPercentage = pointPercentage + variance;
        actualRemaining = budget - (actualCost * Math.min(1, burnPercentage));
      }
      
      // Keep values positive
      actualRemaining = Math.max(0, actualRemaining);
      
      dataPoints.push({
        date: currentDate.toISOString(),
        ideal: Math.round(idealRemaining),
        actual: Math.round(actualRemaining),
        label: `Week ${week}`
      });
    }
    
    setChartData(dataPoints);
  };
  
  // Custom tooltip to display date and values
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border shadow-sm rounded">
          <p className="font-medium">{formatDate(label)}</p>
          <p className="text-sm text-blue-700">
            Ideal Remaining: ${payload[0].value.toLocaleString()}
          </p>
          <p className="text-sm text-green-700">
            Actual Remaining: ${payload[1].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  if (!projects?.length || !projects.some(p => p.financials)) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project Burndown</h3>
        <div className="text-gray-500 text-center py-8">
          No projects with financial data available
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Budget Burndown</h3>
        
        {/* Project selector dropdown */}
        <div className="relative">
          <button 
            className="text-sm text-gray-700 px-3 py-1 border rounded flex items-center hover:bg-gray-50"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {selectedProject?.name || 'Select Project'}
            {dropdownOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded shadow-lg z-10 w-64">
              {projects
                .filter(p => p.financials)
                .map(project => (
                  <button
                    key={project.id}
                    className={`block w-full text-left px-4 py-2 hover:bg-blue-50 ${
                      selectedProject?.id === project.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedProject(project);
                      setDropdownOpen(false);
                    }}
                  >
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-gray-500">{project.client}</div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
      
      {selectedProject && (
        <>
          <div className="mb-4 text-sm flex justify-between">
            <div>
              <div className="text-gray-500">Total Budget:</div>
              <div className="font-medium">${selectedProject.financials?.budget.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Spent To Date:</div>
              <div className="font-medium">${selectedProject.financials?.actualCost.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Remaining:</div>
              <div className="font-medium">
                ${(selectedProject.financials?.budget - selectedProject.financials?.actualCost).toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value)}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000)}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="ideal" 
                  name="Ideal Remaining" 
                  stroke="#3b82f6" 
                  fill="#93c5fd" 
                  strokeWidth={2}
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  name="Actual Remaining" 
                  stroke="#10b981" 
                  fill="#6ee7b7" 
                  strokeWidth={2}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-3 text-right">
            <Link to={`/projects/${selectedProject.id}`} className="text-sm text-blue-600 hover:underline">
              View full project details →
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default BurndownChart;