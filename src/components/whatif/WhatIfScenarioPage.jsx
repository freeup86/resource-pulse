// WhatIfScenarioPage.jsx
import React, { useState, useEffect } from 'react';
import { useWhatIfScenario } from '../../contexts/WhatIfScenarioContext';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import WhatIfScenarioForm from './WhatIfScenarioForm';
import WhatIfScenariosList from './WhatIfScenariosList';
import WhatIfScenarioDetail from './WhatIfScenarioDetail';
import WhatIfScenarioComparison from './WhatIfScenarioComparison';

const WhatIfScenarioPage = () => {
  const { 
    scenarios, 
    loading, 
    error, 
    clearError, 
    fetchScenarios,
    getFormattedMetrics
  } = useWhatIfScenario();
  
  const { resources } = useResources();
  const { projects } = useProjects();
  
  const [showScenarioForm, setShowScenarioForm] = useState(false);
  const [showScenariosList, setShowScenariosList] = useState(false);
  const [showScenarioDetail, setShowScenarioDetail] = useState(false);
  const [showScenarioComparison, setShowScenarioComparison] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [selectedScenariosForComparison, setSelectedScenariosForComparison] = useState([]);
  
  // Fetch scenarios on mount
  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);
  
  const handleCreateScenario = () => {
    setShowScenarioForm(true);
  };
  
  const handleViewScenariosList = () => {
    setShowScenariosList(true);
  };
  
  const handleCompareScenarios = () => {
    setShowScenarioComparison(true);
  };
  
  const handleScenarioCreated = (scenarioId) => {
    setShowScenarioForm(false);
    setSelectedScenarioId(scenarioId);
    setShowScenarioDetail(true);
  };
  
  const handleSelectScenario = (scenarioId) => {
    setSelectedScenarioId(scenarioId);
    setShowScenariosList(false);
    setShowScenarioDetail(true);
  };
  
  const handleCloseScenarioDetail = () => {
    setShowScenarioDetail(false);
    setSelectedScenarioId(null);
  };
  
  // Handle selecting scenarios for comparison
  const handleSelectForComparison = (scenarioId, isSelected) => {
    if (isSelected) {
      setSelectedScenariosForComparison(prev => [...prev, scenarioId]);
    } else {
      setSelectedScenariosForComparison(prev => 
        prev.filter(id => id !== scenarioId)
      );
    }
  };
  
  // Prepare scenario cards for display
  const renderScenarioCards = () => {
    // Show 5 most recent scenarios
    const recentScenarios = [...scenarios]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    
    if (recentScenarios.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          No what-if scenarios created yet. Click "Create Scenario" to start planning.
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentScenarios.map(scenario => {
          // Format metrics if available
          const metrics = scenario.metricsData 
            ? getFormattedMetrics(scenario.metricsData)
            : null;
          
          return (
            <div 
              key={scenario.id} 
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleSelectScenario(scenario.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900">{scenario.name}</h3>
                <div className="flex space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedScenariosForComparison.includes(scenario.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectForComparison(scenario.id, e.target.checked);
                    }}
                    className="h-4 w-4 text-blue-600"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {scenario.description || 'No description provided.'}
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gray-100 p-2 rounded text-center">
                  <div className="font-medium">Period</div>
                  <div>
                    {scenario.startDate 
                      ? new Date(scenario.startDate).toLocaleDateString() 
                      : 'N/A'} - {scenario.endDate 
                      ? new Date(scenario.endDate).toLocaleDateString() 
                      : 'N/A'}
                  </div>
                </div>
                {metrics ? (
                  <>
                    <div className={`p-2 rounded text-center ${
                      metrics.utilization.overall >= 85 
                        ? 'bg-red-100' 
                        : metrics.utilization.overall >= 70 
                          ? 'bg-yellow-100' 
                          : 'bg-green-100'
                    }`}>
                      <div className="font-medium">Utilization</div>
                      <div>{metrics.utilization.overall}%</div>
                    </div>
                    <div className={`p-2 rounded text-center ${
                      metrics.costs.margin >= 30 
                        ? 'bg-green-100' 
                        : metrics.costs.margin >= 20 
                          ? 'bg-yellow-100' 
                          : 'bg-red-100'
                    }`}>
                      <div className="font-medium">Margin</div>
                      <div>{metrics.costs.margin}%</div>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 bg-gray-100 p-2 rounded text-center">
                    <div className="font-medium">Metrics</div>
                    <div>Not calculated</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">What-If Scenario Planning</h2>
          <p className="text-sm text-gray-600">
            Model different scenarios for resource allocation, project timelines, and team changes
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleCreateScenario}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Scenario
          </button>
          <button 
            onClick={handleViewScenariosList}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            View All Scenarios
          </button>
          <button 
            onClick={handleCompareScenarios}
            className={`px-4 py-2 rounded ${
              selectedScenariosForComparison.length >= 2
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
            disabled={selectedScenariosForComparison.length < 2}
          >
            Compare ({selectedScenariosForComparison.length})
          </button>
        </div>
      </div>
      
      {error && <ErrorMessage message={error} onDismiss={clearError} />}
      
      {loading && !scenarios.length ? (
        <div className="flex justify-center my-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Recent Scenarios</h3>
          {renderScenarioCards()}
        </div>
      )}
      
      {/* Process steps overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">Scenario Planning Process</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-800 font-medium mb-2">1. Create Scenario</div>
            <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
              <li>Define scenario parameters</li>
              <li>Set timeline and base data</li>
              <li>Optionally clone from existing scenario</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-800 font-medium mb-2">2. Model Changes</div>
            <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
              <li>Adjust resource allocations</li>
              <li>Modify project timelines</li>
              <li>Add or remove team members</li>
              <li>Update skills and roles required</li>
            </ul>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-800 font-medium mb-2">3. Analyze & Apply</div>
            <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
              <li>Calculate utilization & financial metrics</li>
              <li>Compare scenarios side-by-side</li>
              <li>Promote final scenario to production</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Additional metrics overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium mb-4">Key Metrics Tracked</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border p-4 rounded-lg">
            <div className="font-medium mb-2">Utilization</div>
            <p className="text-sm text-gray-600">
              Track resource utilization across projects, identify bottlenecks, 
              and balance workloads to prevent burnout and maximize efficiency.
            </p>
          </div>
          <div className="border p-4 rounded-lg">
            <div className="font-medium mb-2">Cost & Revenue</div>
            <p className="text-sm text-gray-600">
              Calculate project costs, revenue, margins, and financial impact of different
              allocation strategies to optimize profitability.
            </p>
          </div>
          <div className="border p-4 rounded-lg">
            <div className="font-medium mb-2">Skills Coverage</div>
            <p className="text-sm text-gray-600">
              Ensure your team has the right skills for upcoming projects, identify
              gaps, and plan for hiring or skill development needs.
            </p>
          </div>
        </div>
      </div>
      
      {/* Modal forms */}
      {showScenarioForm && (
        <WhatIfScenarioForm 
          onClose={() => setShowScenarioForm(false)}
          onScenarioCreated={handleScenarioCreated}
        />
      )}
      
      {showScenariosList && (
        <WhatIfScenariosList 
          onClose={() => setShowScenariosList(false)}
          onSelectScenario={handleSelectScenario}
          onSelectForComparison={handleSelectForComparison}
          selectedForComparison={selectedScenariosForComparison}
        />
      )}
      
      {showScenarioDetail && selectedScenarioId && (
        <WhatIfScenarioDetail 
          scenarioId={selectedScenarioId}
          onClose={handleCloseScenarioDetail}
        />
      )}
      
      {showScenarioComparison && selectedScenariosForComparison.length >= 2 && (
        <WhatIfScenarioComparison 
          scenarioIds={selectedScenariosForComparison}
          onClose={() => setShowScenarioComparison(false)}
        />
      )}
    </div>
  );
};

export default WhatIfScenarioPage;