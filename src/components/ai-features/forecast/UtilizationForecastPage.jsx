import React, { useState, useEffect } from 'react';
import { 
  getUtilizationForecast, 
  getBottleneckDetection,
  getWorkloadBalancing 
} from '../../../services/utilizationForecastService';
import DateRangeFilter from '../../analytics/DateRangeFilter';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';
import ForecastChart from './ForecastChart';
import BottleneckList from './BottleneckList';
import WorkloadBalancingRecommendations from './WorkloadBalancingRecommendations';

const UtilizationForecastPage = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 90))
  });
  
  const [forecastData, setForecastData] = useState(null);
  const [bottleneckData, setBottleneckData] = useState(null);
  const [workloadRecommendations, setWorkloadRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('forecast');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Format dates for API
        const params = {
          startDate: dateRange.startDate.toISOString().split('T')[0],
          endDate: dateRange.endDate.toISOString().split('T')[0]
        };
        
        // Fetch all data in parallel
        const [forecastResponse, bottleneckResponse, workloadResponse] = await Promise.all([
          getUtilizationForecast(params),
          getBottleneckDetection(params),
          getWorkloadBalancing(params)
        ]);
        
        setForecastData(forecastResponse);
        setBottleneckData(bottleneckResponse);
        setWorkloadRecommendations(workloadResponse);
      } catch (err) {
        console.error('Error fetching forecast data:', err);
        setError('Failed to load utilization forecast data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange]);

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI-Powered Utilization Forecast</h1>
      
      <div className="mb-6">
        <DateRangeFilter 
          dateRange={dateRange} 
          onDateRangeChange={handleDateRangeChange} 
        />
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'forecast' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('forecast')}
            >
              Utilization Forecast
            </button>
          </li>
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'bottlenecks' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('bottlenecks')}
            >
              Bottleneck Detection
            </button>
          </li>
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'balancing' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('balancing')}
            >
              Workload Balancing
            </button>
          </li>
        </ul>
      </div>
      
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div>
          {activeTab === 'forecast' && forecastData && (
            <ForecastChart data={forecastData} />
          )}
          
          {activeTab === 'bottlenecks' && bottleneckData && (
            <BottleneckList bottlenecks={bottleneckData} />
          )}
          
          {activeTab === 'balancing' && workloadRecommendations && (
            <WorkloadBalancingRecommendations recommendations={workloadRecommendations} />
          )}
        </div>
      )}
    </div>
  );
};

export default UtilizationForecastPage;