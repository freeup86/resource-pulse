import React, { useState, useEffect } from 'react';
import { 
  getProjectRisk, 
  getRiskFactors, 
  getRiskMitigations 
} from '../../../services/projectRiskService';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';
import RiskChart from './RiskChart';

const ProjectRiskDetail = ({ projectId }) => {
  const [projectRisk, setProjectRisk] = useState(null);
  const [riskFactors, setRiskFactors] = useState(null);
  const [mitigations, setMitigations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProjectRiskData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel
        const [riskResponse, factorsResponse, mitigationsResponse] = await Promise.all([
          getProjectRisk(projectId),
          getRiskFactors(projectId),
          getRiskMitigations(projectId)
        ]);
        
        setProjectRisk(riskResponse);
        setRiskFactors(factorsResponse);
        setMitigations(mitigationsResponse);
      } catch (err) {
        console.error('Error fetching project risk details:', err);
        setError('Failed to load project risk details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchProjectRiskData();
    }
  }, [projectId]);

  // Function to determine risk level color
  const getRiskColor = (riskLevel) => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!projectRisk) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">Project risk data not available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Project header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">{projectRisk.name}</h2>
            <p className="text-gray-600">{projectRisk.client}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(projectRisk.riskLevel)}`}>
            {projectRisk.riskLevel} Risk ({projectRisk.riskScore}%)
          </span>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Start Date:</span>
            <p>{new Date(projectRisk.startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-gray-500">End Date:</span>
            <p>{new Date(projectRisk.endDate).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-gray-500">Team Size:</span>
            <p>{projectRisk.teamSize} resources</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Risk Overview
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'factors'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('factors')}
          >
            Risk Factors
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'mitigations'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('mitigations')}
          >
            Recommendations
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div>
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Risk Summary</h3>
              <p className="text-gray-700">{projectRisk.riskSummary}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">AI Risk Assessment</h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-gray-700">{projectRisk.aiAssessment}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Risk Trend</h3>
              {projectRisk.riskHistory && <RiskChart riskHistory={projectRisk.riskHistory} />}
            </div>
          </div>
        )}
        
        {activeTab === 'factors' && riskFactors && riskFactors.factors && (
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Risk Factor Breakdown</h3>
            
            <div className="space-y-4">
              {riskFactors.factors.map((factor, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className={`p-3 flex justify-between items-center ${getRiskColor(factor.impact)}`}>
                    <h4 className="font-medium">{factor.name}</h4>
                    <span className="text-sm font-semibold">{factor.score}%</span>
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-gray-700 mb-2">{factor.description}</p>
                    {factor.details && (
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {factor.details.map((detail, i) => (
                          <li key={i}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'factors' && riskFactors && !riskFactors.factors && (
          <div className="p-4 text-center">
            <p className="text-gray-500">Risk factor data is not available for this project.</p>
          </div>
        )}
        
        {activeTab === 'mitigations' && mitigations && Array.isArray(mitigations) && (
          <div>
            <h3 className="font-medium text-gray-900 mb-4">AI-Generated Risk Mitigation Recommendations</h3>
            
            <div className="space-y-4">
              {mitigations.map((mitigation, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {index + 1}. {mitigation.title}
                  </h4>
                  <p className="text-gray-700 mb-3">{mitigation.description}</p>
                  
                  {mitigation.impactAreas && Array.isArray(mitigation.impactAreas) && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Impact Areas:</h5>
                      <div className="flex flex-wrap gap-2">
                        {mitigation.impactAreas.map((area, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {mitigation.expectedRiskReduction && (
                    <div className="text-sm">
                      <span className="text-gray-600">Expected Risk Reduction: </span>
                      <span className="font-medium text-green-600">-{mitigation.expectedRiskReduction}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'mitigations' && (!mitigations || !Array.isArray(mitigations)) && (
          <div className="p-4 text-center">
            <p className="text-gray-500">Risk mitigation recommendations are not available for this project.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectRiskDetail;