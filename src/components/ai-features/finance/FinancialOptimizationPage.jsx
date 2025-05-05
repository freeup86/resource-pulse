import React, { useState, useEffect } from 'react';
import { 
  getOptimizationRecommendations, 
  getCostRevenueAnalysis,
  applyOptimizations
} from '../../../services/financialOptimizationService';
import DateRangeFilter from '../../analytics/DateRangeFilter';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';
import FinancialSummary from './FinancialSummary';
import CostRevenueChart from './CostRevenueChart';
import OptimizationRecommendations from './OptimizationRecommendations';

const FinancialOptimizationPage = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 90))
  });
  
  const [optimizationData, setOptimizationData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [optimizationTarget, setOptimizationTarget] = useState('profit');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setSuccessMessage('');
      
      try {
        // Format dates for API
        const params = {
          startDate: dateRange.startDate.toISOString().split('T')[0],
          endDate: dateRange.endDate.toISOString().split('T')[0],
          optimizationTarget,
          ...(selectedProjects.length > 0 ? { projectIds: selectedProjects } : {})
        };
        
        // Fetch all data in parallel
        const [optimizationResponse, financialResponse] = await Promise.all([
          getOptimizationRecommendations(params),
          getCostRevenueAnalysis(params)
        ]);
        
        setOptimizationData(optimizationResponse);
        setFinancialData(financialResponse);
      } catch (err) {
        console.error('Error fetching financial optimization data:', err);
        setError('Failed to load financial optimization data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange, selectedProjects, optimizationTarget]);

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };
  
  const handleProjectSelection = (projectIds) => {
    setSelectedProjects(projectIds);
  };
  
  const handleOptimizationTargetChange = (target) => {
    setOptimizationTarget(target);
  };
  
  const handleApplyOptimizations = async (selectedOptimizations) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const result = await applyOptimizations(selectedOptimizations);
      setSuccessMessage('Optimizations applied successfully!');
      
      // Refresh data after applying optimizations
      const params = {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0],
        optimizationTarget,
        ...(selectedProjects.length > 0 ? { projectIds: selectedProjects } : {})
      };
      
      const [optimizationResponse, financialResponse] = await Promise.all([
        getOptimizationRecommendations(params),
        getCostRevenueAnalysis(params)
      ]);
      
      setOptimizationData(optimizationResponse);
      setFinancialData(financialResponse);
    } catch (err) {
      console.error('Error applying optimizations:', err);
      setError('Failed to apply optimizations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI-Powered Financial Optimization</h1>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={handleDateRangeChange} 
          />
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Optimize for:</span>
            <div className="flex border rounded-md">
              <button
                className={`px-3 py-1 text-sm ${
                  optimizationTarget === 'profit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => handleOptimizationTargetChange('profit')}
              >
                Profit
              </button>
              <button
                className={`px-3 py-1 text-sm ${
                  optimizationTarget === 'revenue'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => handleOptimizationTargetChange('revenue')}
              >
                Revenue
              </button>
              <button
                className={`px-3 py-1 text-sm ${
                  optimizationTarget === 'cost'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => handleOptimizationTargetChange('cost')}
              >
                Cost
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Success message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'summary' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('summary')}
            >
              Financial Summary
            </button>
          </li>
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'cost-revenue' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('cost-revenue')}
            >
              Cost vs Revenue
            </button>
          </li>
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'optimization' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('optimization')}
            >
              Optimization Recommendations
            </button>
          </li>
        </ul>
      </div>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="my-8">
          <ErrorMessage message={error} />
        </div>
      ) : (
        <div>
          {activeTab === 'summary' && financialData && (
            <FinancialSummary 
              data={financialData}
              onProjectSelection={handleProjectSelection}
              selectedProjects={selectedProjects}
            />
          )}
          
          {activeTab === 'cost-revenue' && financialData && (
            <CostRevenueChart 
              data={financialData}
              selectedProjects={selectedProjects}
            />
          )}
          
          {activeTab === 'optimization' && optimizationData && (
            <OptimizationRecommendations 
              recommendations={optimizationData.recommendations}
              onApplyOptimizations={handleApplyOptimizations}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialOptimizationPage;