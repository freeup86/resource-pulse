import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, Calendar, FileSearch, DollarSign } from 'lucide-react';
import { useResources } from '../contexts/ResourceContext';
import { useProjects } from '../contexts/ProjectContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import UtilizationChart from './dashboard/UtilizationChart';
import SkillsAnalysis from './dashboard/SkillsAnalysis';
import MiniTimeline from './dashboard/MiniTimeline';
import FinancialSummary from './dashboard/FinancialSummary';
import ResourceAvailabilityHeatmap from './dashboard/ResourceAvailabilityHeatmap';
import ProjectRiskSummary from './dashboard/ProjectRiskSummary';
import BurndownChart from './dashboard/BurndownChart';
import OverallocationAlerts from './dashboard/OverallocationAlerts';

const Dashboard = () => {
  const { resources, loading: resourcesLoading, error: resourcesError } = useResources();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  
  const loading = resourcesLoading || projectsLoading;
  const error = resourcesError || projectsError;
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  // Calculate summary metrics
  const totalResources = resources.length;
  const allocatedResources = resources.filter(r => r.allocation).length;
  const availableResources = totalResources - allocatedResources;
  
  const endingSoonCount = resources.filter(resource => {
    if (!resource.allocation) return false;
    
    const endDate = new Date(resource.allocation.endDate);
    const today = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);
    
    return endDate >= today && endDate <= twoWeeksLater;
  }).length;
  
  const totalProjects = projects.length;
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <Link to="/resources" className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md hover:bg-blue-50 transition-all cursor-pointer">
          <div className="h-2 bg-blue-500"></div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" /> 
              Total Resources
            </h3>
            <p className="text-3xl font-bold mt-2">{totalResources}</p>
            <span className="text-xs text-blue-500 mt-2 block">Click to view all resources →</span>
          </div>
        </Link>
        
        <Link to="/allocations" className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md hover:bg-green-50 transition-all cursor-pointer">
          <div className="h-2 bg-green-500"></div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-green-500" /> 
              Allocated
            </h3>
            <p className="text-3xl font-bold mt-2">{allocatedResources}</p>
            <span className="text-xs text-green-500 mt-2 block">View allocations →</span>
          </div>
        </Link>
        
        <Link to="/resources" state={{ filter: 'unallocated' }} className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer">
          <div className="h-2 bg-gray-500"></div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <Users className="h-5 w-5 mr-2 text-gray-500" /> 
              Available
            </h3>
            <p className="text-3xl font-bold mt-2">{availableResources}</p>
            <span className="text-xs text-gray-500 mt-2 block">View available resources →</span>
          </div>
        </Link>
        
        <Link to="/ending-soon" className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md hover:bg-yellow-50 transition-all cursor-pointer">
          <div className="h-2 bg-yellow-500"></div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-yellow-500" /> 
              Ending Soon
            </h3>
            <p className="text-3xl font-bold mt-2">{endingSoonCount}</p>
            <span className="text-xs text-yellow-500 mt-2 block">View ending allocations →</span>
          </div>
        </Link>
        
        <Link to="/projects" className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md hover:bg-purple-50 transition-all cursor-pointer">
          <div className="h-2 bg-purple-500"></div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-purple-500" /> 
              Total Projects
            </h3>
            <p className="text-3xl font-bold mt-2">{totalProjects}</p>
            <span className="text-xs text-purple-500 mt-2 block">View all projects →</span>
          </div>
        </Link>
      </div>
      
      {/* Analytics */}
      {/* Financial Summary Section */}
      <div className="mb-6">
        <FinancialSummary />
      </div>
      
      {/* Resource Alert Section */}
      <div className="mb-6">
        <OverallocationAlerts />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <UtilizationChart />
        <ProjectRiskSummary />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <BurndownChart />
        <MiniTimeline />
      </div>
      
      {/* Resource Availability Heatmap - Full width */}
      <div className="mb-6">
        <ResourceAvailabilityHeatmap />
      </div>
      
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/resources" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <h3 className="font-medium">Resources</h3>
              <p className="text-sm text-gray-500">Manage your consulting resources</p>
            </div>
          </div>
        </Link>
        
        <Link to="/allocations" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <h3 className="font-medium">Allocations</h3>
              <p className="text-sm text-gray-500">Track project assignments</p>
            </div>
          </div>
        </Link>
        
        <Link to="/ending-soon" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <h3 className="font-medium">Ending Soon</h3>
              <p className="text-sm text-gray-500">View resources becoming available</p>
            </div>
          </div>
        </Link>
        
        <Link to="/ai/finance" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-emerald-500" />
            <div className="ml-4">
              <h3 className="font-medium">Financial Optimization</h3>
              <p className="text-sm text-gray-500">AI-powered financial analysis and optimization</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;