// src/components/analytics/AnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useRoles } from '../../contexts/RoleContext';
import UtilizationSummary from './UtilizationSummary';
import ResourceAllocationChart from './ResourceAllocationChart';
import SkillsAnalysisChart from './SkillsAnalysisChart';
import SkillsGapAnalysisChart from './SkillsGapAnalysisChart';
import TrainingRecommendationsTable from './TrainingRecommendationsTable';
import HiringRecommendationsTable from './HiringRecommendationsTable';
import ProjectAllocationChart from './ProjectAllocationChart';
import AvailabilityForecast from './AvailabilityForecast';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import ReportControls from './ReportControls';
import DateRangeFilter from './DateRangeFilter';
import DashboardSummary from './DashboardSummary';

const AnalyticsDashboard = () => {
  const { resources, loading: resourcesLoading, error: resourcesError } = useResources();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { roles, loading: rolesLoading, error: rolesError } = useRoles();
  const [dashboardData, setDashboardData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredResources, setFilteredResources] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const loading = resourcesLoading || projectsLoading || rolesLoading;
  const error = resourcesError || projectsError || rolesError;

  // Process data for dashboard when resources and projects are loaded
  useEffect(() => {
    if (!loading && !error) {
      processDashboardData();
    }
  }, [resources, projects, roles, loading, error]);

  // Add useEffect to set initial dates
  useEffect(() => {
    if (!loading && resources.length > 0) {
      // Set default date range to 90 days
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90);
      
      setEndDate(end.toISOString().split('T')[0]);
      setStartDate(start.toISOString().split('T')[0]);
    }
  }, [loading, resources]);

  // Process data for dashboard visualizations
  const processDashboardData = () => {
    // This will be expanded with various data processing functions
    const data = {
      // Will populate this with calculated metrics
    };
    
    setDashboardData(data);
  };

  // Handle filter apply
  const handleFilterApply = () => {
    if (!startDate || !endDate) return;
    
    // Filter resources by allocation dates
    const filtered = resources.filter(resource => {
      const allocations = resource.allocations || [];
      return allocations.some(allocation => {
        const allocationStart = new Date(allocation.startDate);
        const allocationEnd = new Date(allocation.endDate);
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        
        // Check if allocation dates overlap with filter range
        return (
          (allocationStart <= filterEnd && allocationEnd >= filterStart)
        );
      });
    });
    
    // Filter projects by active allocations in the date range
    const activeProjects = new Set();
    filtered.forEach(resource => {
      const allocations = resource.allocations || [];
      allocations.forEach(allocation => {
        if (allocation.projectId) {
          activeProjects.add(allocation.projectId);
        }
      });
    });
    
    const filteredProjectsList = projects.filter(project => 
      activeProjects.has(project.id)
    );
    
    setFilteredResources(filtered);
    setFilteredProjects(filteredProjectsList);
    setIsFiltered(true);
  };

  // Update the component props to use filtered data when filtered
  const displayResources = isFiltered ? filteredResources : resources;
  const displayProjects = isFiltered ? filteredProjects : projects;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Resource Analytics Dashboard</h2>
      
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onFilterApply={handleFilterApply}
      />

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`${
                activeTab === 'skills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Skills Analysis
            </button>
            <button
              onClick={() => setActiveTab('utilization')}
              className={`${
                activeTab === 'utilization'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Utilization
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`${
                activeTab === 'availability'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Availability
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <DashboardSummary />
          <ReportControls resources={displayResources} projects={displayProjects} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <UtilizationSummary resources={displayResources} />
            <ResourceAllocationChart resources={displayResources} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <SkillsAnalysisChart resources={displayResources} projects={displayProjects} />
            <ProjectAllocationChart projects={displayProjects} resources={displayResources} />
          </div>
        </>
      )}

      {activeTab === 'skills' && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Skills Analysis</h3>
            <div className="grid grid-cols-1 gap-6 mb-6">
              <SkillsGapAnalysisChart />
            </div>
            <div className="grid grid-cols-1 gap-6 mb-6">
              <SkillsAnalysisChart resources={displayResources} projects={displayProjects} />
            </div>
            <div className="grid grid-cols-1 gap-6 mb-6">
              <TrainingRecommendationsTable />
            </div>
            <div className="grid grid-cols-1 gap-6 mb-6">
              <HiringRecommendationsTable />
            </div>
          </div>
        </>
      )}

      {activeTab === 'utilization' && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Utilization Metrics</h3>
            <div className="grid grid-cols-1 gap-6 mb-6">
              <UtilizationSummary resources={displayResources} />
            </div>
            <div className="grid grid-cols-1 gap-6 mb-6">
              <ResourceAllocationChart resources={displayResources} />
            </div>
            <div className="grid grid-cols-1 gap-6 mb-6">
              <ProjectAllocationChart projects={displayProjects} resources={displayResources} />
            </div>
          </div>
        </>
      )}

      {activeTab === 'availability' && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Resource Availability</h3>
            <div className="mb-6">
              <AvailabilityForecast resources={displayResources} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;