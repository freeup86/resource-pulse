import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, Calendar, FileSearch } from 'lucide-react';
import { useResources } from '../contexts/ResourceContext';
import { useProjects } from '../contexts/ProjectContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import UtilizationChart from './dashboard/UtilizationChart';
import SkillsAnalysis from './dashboard/SkillsAnalysis';
import AvailabilityForecast from './dashboard/AvailabilityForecast';
import MiniTimeline from './dashboard/MiniTimeline';

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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="h-2 bg-blue-500"></div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700">Total Resources</h3>
            <p className="text-3xl font-bold mt-2">{totalResources}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="h-2 bg-green-500"></div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700">Allocated</h3>
            <p className="text-3xl font-bold mt-2">{allocatedResources}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="h-2 bg-gray-500"></div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700">Available</h3>
            <p className="text-3xl font-bold mt-2">{availableResources}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="h-2 bg-yellow-500"></div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700">Ending Soon</h3>
            <p className="text-3xl font-bold mt-2">{endingSoonCount}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="h-2 bg-purple-500"></div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700">Total Projects</h3>
            <p className="text-3xl font-bold mt-2">{totalProjects}</p>
          </div>
        </div>
      </div>
      
      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <UtilizationChart />
        <SkillsAnalysis />
      </div>
      
      <div className="mb-6">
        <AvailabilityForecast />
      </div>
      {/* Mini Timeline */}
      <div className="mb-6">
        <MiniTimeline />
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
        
        <Link to="/matches" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <FileSearch className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <h3 className="font-medium">Skill Matches</h3>
              <p className="text-sm text-gray-500">Find the right resource for each project</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;