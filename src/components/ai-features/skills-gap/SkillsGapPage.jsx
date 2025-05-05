import React, { useState, useEffect } from 'react';
import { 
  getSkillsGapAnalysis, 
  getTrainingRecommendations, 
  getHiringRecommendations 
} from '../../../services/skillsGapService';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';
import SkillsGapOverview from './SkillsGapOverview';
import TrainingRecommendations from './TrainingRecommendations';
import HiringRecommendations from './HiringRecommendations';

const SkillsGapPage = () => {
  const [skillsGapData, setSkillsGapData] = useState(null);
  const [trainingRecommendations, setTrainingRecommendations] = useState(null);
  const [hiringRecommendations, setHiringRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [timeframeFilter, setTimeframeFilter] = useState('6months');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Prepare parameters
        const params = {
          ...(selectedDepartments.length > 0 ? { departmentIds: selectedDepartments } : {})
        };
        
        const hiringParams = {
          ...params,
          timeframe: timeframeFilter
        };
        
        // Fetch all data in parallel
        const [
          gapAnalysisResponse, 
          trainingResponse, 
          hiringResponse
        ] = await Promise.all([
          getSkillsGapAnalysis(params),
          getTrainingRecommendations(params),
          getHiringRecommendations(hiringParams)
        ]);
        
        setSkillsGapData(gapAnalysisResponse);
        setTrainingRecommendations(trainingResponse);
        setHiringRecommendations(hiringResponse);
      } catch (err) {
        console.error('Error fetching skills gap data:', err);
        setError('Failed to load skills gap analysis data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedDepartments, timeframeFilter]);

  const handleDepartmentSelection = (departments) => {
    setSelectedDepartments(departments);
  };
  
  const handleTimeframeChange = (timeframe) => {
    setTimeframeFilter(timeframe);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI-Powered Skills Gap Analysis</h1>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <h2 className="text-lg font-semibold">Organizational Skills Analysis</h2>
            <p className="text-gray-600 text-sm">
              AI analysis of skills distribution, gaps, and recommendations across the organization
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Hiring Timeframe:</span>
            <div className="flex border rounded-md">
              <button
                className={`px-3 py-1 text-sm ${
                  timeframeFilter === '3months'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => handleTimeframeChange('3months')}
              >
                3 Months
              </button>
              <button
                className={`px-3 py-1 text-sm ${
                  timeframeFilter === '6months'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => handleTimeframeChange('6months')}
              >
                6 Months
              </button>
              <button
                className={`px-3 py-1 text-sm ${
                  timeframeFilter === '1year'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => handleTimeframeChange('1year')}
              >
                1 Year
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'overview' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('overview')}
            >
              Skills Gap Overview
            </button>
          </li>
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'training' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('training')}
            >
              Training Recommendations
            </button>
          </li>
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'hiring' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('hiring')}
            >
              Hiring Recommendations
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
          {activeTab === 'overview' && (
            <SkillsGapOverview 
              data={skillsGapData || {}}
              onDepartmentSelection={handleDepartmentSelection}
              selectedDepartments={selectedDepartments}
            />
          )}
          
          {activeTab === 'training' && (
            <TrainingRecommendations recommendations={trainingRecommendations || {}} />
          )}
          
          {activeTab === 'hiring' && (
            <HiringRecommendations 
              recommendations={hiringRecommendations || {}} 
              timeframe={timeframeFilter}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SkillsGapPage;