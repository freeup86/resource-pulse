import React, { useState, useEffect } from 'react';
import { 
  getAllClientSatisfactionPredictions, 
  getProjectSatisfactionPrediction, 
  getSatisfactionFactors, 
  getResourcePairingRecommendations 
} from '../../../services/clientSatisfactionService';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';
import SatisfactionOverview from './SatisfactionOverview';
import ProjectSatisfactionDetail from './ProjectSatisfactionDetail';

const ClientSatisfactionPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [factors, setFactors] = useState(null);
  const [pairings, setPairings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // Fetch satisfaction predictions on initial load
  useEffect(() => {
    fetchPredictions();
  }, [filter]);
  
  // Fetch all satisfaction predictions
  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const response = await getAllClientSatisfactionPredictions(params);
      
      // Transform the API response to match the expected format
      // If the API returns an object with predictions property, use it
      // Otherwise create default structure with empty predictions array
      setPredictions({
        predictions: response.predictions || [],
        count: response.count || 0,
        retrievedAt: response.retrievedAt || new Date().toISOString()
      });
    } catch (err) {
      console.error('Error fetching satisfaction predictions:', err);
      setError('Failed to load satisfaction predictions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle project selection
  const handleProjectSelect = async (projectId) => {
    if (selectedProject === projectId) {
      // If clicking on the same project, just toggle it off
      setSelectedProject(null);
      setProjectDetails(null);
      setFactors(null);
      setPairings(null);
      return;
    }
    
    setSelectedProject(projectId);
    setDetailLoading(true);
    setError(null);
    
    try {
      // Fetch all project detail data in parallel
      const [detailsResponse, factorsResponse, pairingsResponse] = await Promise.all([
        getProjectSatisfactionPrediction(projectId),
        getSatisfactionFactors(projectId),
        getResourcePairingRecommendations(projectId)
      ]);
      
      setProjectDetails(detailsResponse);
      setFactors(factorsResponse);
      setPairings(pairingsResponse);
    } catch (err) {
      console.error('Error fetching project satisfaction details:', err);
      setError('Failed to load project satisfaction details. Please try again later.');
    } finally {
      setDetailLoading(false);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI-Powered Client Satisfaction Prediction</h1>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="my-8">
          <ErrorMessage message={error} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel - Projects list & overview */}
          <div className="lg:col-span-1">
            <SatisfactionOverview 
              predictions={predictions}
              selectedProjectId={selectedProject}
              onProjectSelect={handleProjectSelect}
              onFilterChange={handleFilterChange}
              currentFilter={filter}
            />
          </div>
          
          {/* Right panel - Project details */}
          <div className="lg:col-span-2">
            {detailLoading ? (
              <div className="bg-white rounded-lg shadow-md p-6 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : selectedProject && projectDetails ? (
              <ProjectSatisfactionDetail 
                project={projectDetails}
                factors={factors}
                pairings={pairings}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Select a Project</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Choose a project from the list to view detailed satisfaction predictions, factors affecting client satisfaction, and resource pairing recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSatisfactionPage;