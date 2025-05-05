import React, { useState, useEffect } from 'react';
import { SkillsProvider } from '../../contexts/SkillsContext';
import SkillsGapOverview from './SkillsGapOverview';
import SkillsGapAnalysisChart from './SkillsGapAnalysisChart';
import TrainingRecommendationsTable from './TrainingRecommendationsTable';
import HiringRecommendationsTable from './HiringRecommendationsTable';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const SkillsGapPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <SkillsProvider>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Skills Gap Analysis</h1>
          
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => handleTabChange('overview')}
                  className={`${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Overview
                </button>
                <button
                  onClick={() => handleTabChange('analysis')}
                  className={`${
                    activeTab === 'analysis'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Skills Gap Analysis
                </button>
                <button
                  onClick={() => handleTabChange('training')}
                  className={`${
                    activeTab === 'training'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Training Recommendations
                </button>
                <button
                  onClick={() => handleTabChange('hiring')}
                  className={`${
                    activeTab === 'hiring'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Hiring Recommendations
                </button>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-lg">
            {loading && <LoadingSpinner />}
            
            {error && <ErrorMessage message={error} />}
            
            {!loading && !error && (
              <>
                {activeTab === 'overview' && (
                  <div className="p-6">
                    <SkillsGapOverview />
                  </div>
                )}
                
                {activeTab === 'analysis' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Skills Gap Analysis</h2>
                    <div className="mb-6">
                      <SkillsGapAnalysisChart />
                    </div>
                  </div>
                )}
                
                {activeTab === 'training' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Training Recommendations</h2>
                    <div className="mb-6">
                      <TrainingRecommendationsTable />
                    </div>
                  </div>
                )}
                
                {activeTab === 'hiring' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Hiring Recommendations</h2>
                    <div className="mb-6">
                      <HiringRecommendationsTable />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </SkillsProvider>
  );
};

export default SkillsGapPage;