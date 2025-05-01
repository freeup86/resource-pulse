// src/components/analytics/DashboardSummary.jsx
import React, { useMemo } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { calculateTotalUtilization } from '../../utils/allocationUtils';

const DashboardSummary = () => {
  const { resources } = useResources();
  const { projects } = useProjects();
  
  // Calculate key metrics
  const metrics = useMemo(() => {
    // Count total resources
    const totalResources = resources.length;
    
    // Calculate fully allocated resources (100% or more)
    const fullyAllocated = resources.filter(
      r => calculateTotalUtilization(r) >= 100
    ).length;
    
    // Calculate available capacity
    const availableResources = resources.filter(
      r => calculateTotalUtilization(r) < 100
    ).length;
    
    // Calculate over-allocated resources (>100%)
    const overAllocated = resources.filter(
      r => calculateTotalUtilization(r) > 100
    ).length;
    
    // Calculate active projects
    const activeProjects = projects.filter(
      p => p.status === 'Active'
    ).length;
    
    // Calculate overall utilization
    const overallUtilization = totalResources > 0
      ? resources.reduce((total, r) => total + calculateTotalUtilization(r), 0) / totalResources
      : 0;
    
    return {
      totalResources,
      fullyAllocated,
      availableResources,
      overAllocated,
      activeProjects,
      overallUtilization
    };
  }, [resources, projects]);
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-500">Total Resources</div>
        <div className="text-2xl font-bold text-blue-600">{metrics.totalResources}</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-500">Fully Allocated</div>
        <div className="text-2xl font-bold text-green-600">{metrics.fullyAllocated}</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-500">Available</div>
        <div className="text-2xl font-bold text-gray-600">{metrics.availableResources}</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-500">Over-allocated</div>
        <div className="text-2xl font-bold text-red-600">{metrics.overAllocated}</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-500">Active Projects</div>
        <div className="text-2xl font-bold text-purple-600">{metrics.activeProjects}</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-500">Overall Utilization</div>
        <div className="text-2xl font-bold text-blue-600">{Math.round(metrics.overallUtilization)}%</div>
      </div>
    </div>
  );
};

export default DashboardSummary;