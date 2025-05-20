// WhatIfScenarioDetail.jsx
import React, { useState, useEffect } from 'react';
import { useWhatIfScenario } from '../../contexts/WhatIfScenarioContext';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useRoles } from '../../contexts/RoleContext';
import { useSkills } from '../../contexts/SkillsContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import ScenarioAllocationForm from './ScenarioAllocationForm';
import ProjectTimelineForm from './ProjectTimelineForm';
import UtilizationBar from '../common/UtilizationBar';

const WhatIfScenarioDetail = ({ scenarioId, onClose }) => {
  const { 
    currentScenario, 
    loading, 
    error, 
    fetchScenarioById, 
    calculateMetrics,
    promoteScenario,
    getFormattedMetrics
  } = useWhatIfScenario();
  
  const { resources } = useResources();
  const { projects } = useProjects();
  const { roles } = useRoles();
  const { skills } = useSkills();
  
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [selectedTimelineChange, setSelectedTimelineChange] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [calculating, setCalculating] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [localError, setLocalError] = useState(null);
  
  // Formatted metrics for display
  const formattedMetrics = currentScenario?.metricsData 
    ? getFormattedMetrics(currentScenario.metricsData)
    : null;
  
  // Fetch scenario details on mount
  useEffect(() => {
    if (scenarioId) {
      fetchScenarioById(scenarioId);
    }
  }, [scenarioId, fetchScenarioById]);
  
  const handleAddAllocation = () => {
    setSelectedAllocation(null);
    setShowAllocationForm(true);
  };
  
  const handleEditAllocation = (allocation) => {
    setSelectedAllocation(allocation);
    setShowAllocationForm(true);
  };
  
  const handleAddTimelineChange = () => {
    setSelectedTimelineChange(null);
    setShowTimelineForm(true);
  };
  
  const handleEditTimelineChange = (timelineChange) => {
    setSelectedTimelineChange(timelineChange);
    setShowTimelineForm(true);
  };
  
  const handleAllocationSaved = () => {
    fetchScenarioById(scenarioId);
  };
  
  const handleTimelineSaved = () => {
    fetchScenarioById(scenarioId);
  };
  
  const handleCalculateMetrics = async () => {
    setCalculating(true);
    setLocalError(null);
    
    try {
      await calculateMetrics(scenarioId);
    } catch (err) {
      console.error('Error calculating metrics:', err);
      setLocalError('Failed to calculate metrics');
    } finally {
      setCalculating(false);
    }
  };
  
  const handlePromoteScenario = async () => {
    if (!window.confirm(
      'Are you sure you want to promote this scenario to production? This will apply all changes to your real projects and allocations.'
    )) {
      return;
    }
    
    setPromoting(true);
    setLocalError(null);
    
    try {
      await promoteScenario(scenarioId);
      onClose(); // Close the detail view after promotion
    } catch (err) {
      console.error('Error promoting scenario:', err);
      setLocalError('Failed to promote scenario');
    } finally {
      setPromoting(false);
    }
  };
  
  // Helper function to find project by ID
  const getProjectById = (id) => {
    return projects.find(p => p.id === id) || { name: 'Unknown Project' };
  };
  
  // Helper function to find resource by ID
  const getResourceById = (id) => {
    return resources.find(r => r.id === id) || { name: 'Unknown Resource' };
  };
  
  // Format currency for display
  const formatCurrency = (value) => {
    if (!value) return '$0';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Group allocations by resource
  const groupAllocationsByResource = () => {
    if (!currentScenario || !currentScenario.allocations) return {};
    
    const grouped = {};
    
    currentScenario.allocations.forEach(allocation => {
      const resourceId = allocation.resourceId;
      if (!grouped[resourceId]) {
        const resource = getResourceById(resourceId);
        grouped[resourceId] = {
          resourceId,
          resourceName: resource.name,
          resourceRole: resource.role,
          allocations: []
        };
      }
      
      grouped[resourceId].allocations.push(allocation);
    });
    
    return grouped;
  };
  
  // Group allocations by project
  const groupAllocationsByProject = () => {
    if (!currentScenario || !currentScenario.allocations) return {};
    
    const grouped = {};
    
    currentScenario.allocations.forEach(allocation => {
      const projectId = allocation.projectId;
      if (!grouped[projectId]) {
        const project = getProjectById(projectId);
        grouped[projectId] = {
          projectId,
          projectName: project.name,
          projectClient: project.client,
          allocations: []
        };
      }
      
      grouped[projectId].allocations.push(allocation);
    });
    
    return grouped;
  };
  
  // Render the metrics summary section
  const renderMetricsSummary = () => {
    if (!formattedMetrics) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-gray-600 mb-2">Metrics have not been calculated for this scenario.</p>
          <button
            onClick={handleCalculateMetrics}
            disabled={calculating}
            className={`px-4 py-2 rounded ${
              calculating 
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {calculating ? 'Calculating...' : 'Calculate Metrics'}
          </button>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Scenario Metrics Summary</h3>
          <button
            onClick={handleCalculateMetrics}
            disabled={calculating}
            className={`px-3 py-1 text-sm rounded ${
              calculating 
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {calculating ? 'Recalculating...' : 'Recalculate'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Utilization summary */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Resource Utilization</h4>
            <div className="flex items-center mb-2">
              <div className="text-2xl font-bold mr-2">
                {formattedMetrics.utilization.overall}%
              </div>
              <div className={`text-sm px-2 py-1 rounded-full ${
                formattedMetrics.utilization.overall >= 85 
                  ? 'bg-red-100 text-red-800' 
                  : formattedMetrics.utilization.overall >= 70 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
              }`}>
                {formattedMetrics.utilization.overall >= 85 
                  ? 'Over-utilized' 
                  : formattedMetrics.utilization.overall >= 70 
                    ? 'Well-utilized' 
                    : 'Under-utilized'}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Avg. utilization across {
                Object.keys(formattedMetrics.utilization.byResource).length
              } resources
            </div>
          </div>
          
          {/* Financial summary */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Financial Performance</h4>
            <div className="flex items-center mb-2">
              <div className="text-2xl font-bold mr-2">
                {formattedMetrics.costs.margin}%
              </div>
              <div className={`text-sm px-2 py-1 rounded-full ${
                formattedMetrics.costs.margin >= 30 
                  ? 'bg-green-100 text-green-800' 
                  : formattedMetrics.costs.margin >= 20 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
              }`}>
                {formattedMetrics.costs.margin >= 30 
                  ? 'High margin' 
                  : formattedMetrics.costs.margin >= 20 
                    ? 'Average margin' 
                    : 'Low margin'}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {formatCurrency(formattedMetrics.costs.totalBillable)} revenue / 
              {formatCurrency(formattedMetrics.costs.totalCost)} cost
            </div>
          </div>
          
          {/* Skills coverage summary */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Skills Coverage</h4>
            <div className="flex items-center mb-2">
              <div className="text-2xl font-bold mr-2">
                {formattedMetrics.skillsCoverage.coveragePercentage}%
              </div>
              <div className={`text-sm px-2 py-1 rounded-full ${
                formattedMetrics.skillsCoverage.coveragePercentage >= 90 
                  ? 'bg-green-100 text-green-800' 
                  : formattedMetrics.skillsCoverage.coveragePercentage >= 75 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
              }`}>
                {formattedMetrics.skillsCoverage.coveragePercentage >= 90 
                  ? 'Excellent coverage' 
                  : formattedMetrics.skillsCoverage.coveragePercentage >= 75 
                    ? 'Good coverage' 
                    : 'Coverage gaps'}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {formattedMetrics.skillsCoverage.covered.length} covered / 
              {formattedMetrics.skillsCoverage.missing.length} missing skills
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the overview tab
  const renderOverviewTab = () => {
    if (!currentScenario) return null;
    
    return (
      <div>
        {/* Metrics summary */}
        {renderMetricsSummary()}
        
        {/* Timeline changes */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Project Timeline Changes</h3>
            <button 
              onClick={handleAddTimelineChange}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Modify Timeline
            </button>
          </div>
          
          {currentScenario.timelineChanges && currentScenario.timelineChanges.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Original Timeline
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Timeline
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentScenario.timelineChanges.map(change => {
                    // Calculate duration changes
                    const origStart = new Date(change.originalStartDate);
                    const origEnd = new Date(change.originalEndDate);
                    const newStart = new Date(change.newStartDate);
                    const newEnd = new Date(change.newEndDate);
                    
                    const origDuration = Math.round((origEnd - origStart) / (1000 * 60 * 60 * 24));
                    const newDuration = Math.round((newEnd - newStart) / (1000 * 60 * 60 * 24));
                    const durationChange = newDuration - origDuration;
                    
                    return (
                      <tr key={change.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEditTimelineChange(change)}>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">{change.projectName}</div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {new Date(change.originalStartDate).toLocaleDateString()} to <br />
                          {new Date(change.originalEndDate).toLocaleDateString()}
                          <div className="text-xs text-gray-500">
                            {origDuration} days
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {new Date(change.newStartDate).toLocaleDateString()} to <br />
                          {new Date(change.newEndDate).toLocaleDateString()}
                          <div className="text-xs text-gray-500">
                            {newDuration} days
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                            durationChange > 0 
                              ? 'bg-red-100 text-red-800' 
                              : durationChange < 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {durationChange === 0 
                              ? 'Shifted only' 
                              : durationChange > 0 
                                ? `+${durationChange} days` 
                                : `${durationChange} days`}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {change.notes || 'No notes'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No timeline changes in this scenario.
            </div>
          )}
        </div>
        
        {/* Resource allocations summary */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Resource Allocations</h3>
            <button 
              onClick={handleAddAllocation}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Add Allocation
            </button>
          </div>
          
          {currentScenario.allocations && currentScenario.allocations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(groupAllocationsByResource()).map(group => (
                <div key={group.resourceId} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 font-medium flex justify-between items-center">
                    <div>{group.resourceName}</div>
                    <div className="text-xs text-gray-600">{group.resourceRole}</div>
                  </div>
                  <div className="divide-y">
                    {group.allocations.map(allocation => {
                      const project = getProjectById(allocation.projectId);
                      return (
                        <div 
                          key={allocation.id} 
                          className="p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleEditAllocation(allocation)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="font-medium">{project.name}</div>
                            <UtilizationBar percentage={allocation.utilization} showLabel={true} />
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {new Date(allocation.startDate).toLocaleDateString()} to {' '}
                            {new Date(allocation.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No allocations in this scenario.
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render the utilization tab
  const renderUtilizationTab = () => {
    if (!currentScenario || !formattedMetrics) {
      return (
        <div className="text-center text-gray-500 py-8">
          Metrics must be calculated to view utilization data.
        </div>
      );
    }
    
    const utilizationData = formattedMetrics.utilization;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Resource Utilization</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Utilization
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Allocations
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.values(utilizationData.byResource).map(resource => (
                  <tr key={resource.resourceId}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{resource.resourceName}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <UtilizationBar 
                        percentage={resource.totalUtilization} 
                        showLabel={true}
                        labelPosition="right"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        {resource.allocations.map((allocation, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div>{allocation.projectName}</div>
                            <div className="font-medium">{allocation.utilization}%</div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the financials tab
  const renderFinancialsTab = () => {
    if (!currentScenario || !formattedMetrics) {
      return (
        <div className="text-center text-gray-500 py-8">
          Metrics must be calculated to view financial data.
        </div>
      );
    }
    
    const costData = formattedMetrics.costs;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Financial Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Total Cost</div>
              <div className="text-2xl font-bold text-gray-800">
                {formatCurrency(costData.totalCost)}
              </div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-gray-800">
                {formatCurrency(costData.totalBillable)}
              </div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Margin</div>
              <div className="text-2xl font-bold text-gray-800">
                {costData.margin}%
              </div>
            </div>
          </div>
          
          <h4 className="font-medium mb-2">Project Financial Performance</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.values(costData.byProject).map(project => (
                  <tr key={project.projectId}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{project.projectName}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatCurrency(project.totalCost)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatCurrency(project.totalBillable)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                        project.margin >= 30 
                          ? 'bg-green-100 text-green-800' 
                          : project.margin >= 20 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {project.margin}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the skills tab
  const renderSkillsTab = () => {
    if (!currentScenario || !formattedMetrics) {
      return (
        <div className="text-center text-gray-500 py-8">
          Metrics must be calculated to view skills coverage data.
        </div>
      );
    }
    
    const skillsData = formattedMetrics.skillsCoverage;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Skills Coverage Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Coverage</div>
              <div className="text-2xl font-bold text-gray-800">
                {skillsData.coveragePercentage}%
              </div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Covered Skills</div>
              <div className="text-2xl font-bold text-green-600">
                {skillsData.covered.length}
              </div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Missing Skills</div>
              <div className="text-2xl font-bold text-red-600">
                {skillsData.missing.length}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Covered skills */}
            <div>
              <h4 className="font-medium mb-2 text-green-600">Covered Skills</h4>
              {skillsData.covered.length > 0 ? (
                <div className="border rounded-lg p-4 bg-green-50 h-64 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {skillsData.covered.map(skill => (
                      <div 
                        key={skill.id} 
                        className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                      >
                        {skill.name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 text-center text-gray-500">
                  No covered skills found
                </div>
              )}
            </div>
            
            {/* Missing skills */}
            <div>
              <h4 className="font-medium mb-2 text-red-600">Missing Skills</h4>
              {skillsData.missing.length > 0 ? (
                <div className="border rounded-lg p-4 bg-red-50 h-64 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {skillsData.missing.map(skill => (
                      <div 
                        key={skill.id} 
                        className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm"
                      >
                        {skill.name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 text-center text-gray-500">
                  No missing skills
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'utilization':
        return renderUtilizationTab();
      case 'financials':
        return renderFinancialsTab();
      case 'skills':
        return renderSkillsTab();
      default:
        return renderOverviewTab();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {currentScenario ? currentScenario.name : 'Scenario Details'}
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            &times;
          </button>
        </div>
        
        {(loading && !currentScenario) ? (
          <div className="flex-1 flex justify-center items-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex-1 p-6">
            <ErrorMessage message={error} />
          </div>
        ) : currentScenario ? (
          <>
            <div className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between">
              {/* Scenario info */}
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-gray-600">{currentScenario.description || 'No description'}</p>
                <div className="text-xs text-gray-500 mt-1">
                  Period: {currentScenario.startDate 
                    ? new Date(currentScenario.startDate).toLocaleDateString() 
                    : 'N/A'} to {currentScenario.endDate 
                    ? new Date(currentScenario.endDate).toLocaleDateString() 
                    : 'N/A'}
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handlePromoteScenario}
                  disabled={promoting || !formattedMetrics}
                  className={`px-3 py-1 text-sm rounded ${
                    promoting || !formattedMetrics
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  title={!formattedMetrics ? 'Calculate metrics first' : 'Apply to production'}
                >
                  {promoting ? 'Promoting...' : 'Promote to Production'}
                </button>
              </div>
            </div>
            
            {/* Error message */}
            {localError && (
              <div className="px-6 pt-4">
                <ErrorMessage message={localError} onDismiss={() => setLocalError(null)} />
              </div>
            )}
            
            {/* Tabs navigation */}
            <div className="border-b px-6">
              <ul className="flex overflow-x-auto">
                <li className="-mb-px">
                  <button
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                </li>
                <li className="-mb-px">
                  <button
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === 'utilization'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveTab('utilization')}
                  >
                    Utilization
                  </button>
                </li>
                <li className="-mb-px">
                  <button
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === 'financials'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveTab('financials')}
                  >
                    Financials
                  </button>
                </li>
                <li className="-mb-px">
                  <button
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === 'skills'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveTab('skills')}
                  >
                    Skills
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              {renderTabContent()}
            </div>
            
            {/* Modal forms */}
            {showAllocationForm && (
              <ScenarioAllocationForm 
                scenarioId={scenarioId}
                existingAllocation={selectedAllocation}
                onClose={() => setShowAllocationForm(false)}
                onAllocationSaved={handleAllocationSaved}
              />
            )}
            
            {showTimelineForm && (
              <ProjectTimelineForm
                scenarioId={scenarioId}
                existingTimelineChange={selectedTimelineChange}
                onClose={() => setShowTimelineForm(false)}
                onTimelineSaved={handleTimelineSaved}
              />
            )}
          </>
        ) : (
          <div className="flex-1 p-6 text-center text-gray-500">
            Scenario not found
          </div>
        )}
        
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatIfScenarioDetail;