import React, { useState, useEffect } from 'react';
import { 
  getAllProjectRisks
} from '../../../services/projectRiskService';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';
import ProjectRiskList from './ProjectRiskList';
import ProjectRiskDetail from './ProjectRiskDetail';

// Simple search filter component to avoid the error
const SearchFilter = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder || "Search..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 pl-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="absolute left-3 top-2.5">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
};

const ProjectRiskPage = () => {
  const [projectRisks, setProjectRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sortBy, setSortBy] = useState('riskLevel');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchProjectRisks = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getAllProjectRisks();
        setProjectRisks(response);
        setSearchResults(response);
      } catch (err) {
        console.error('Error fetching project risks:', err);
        setError('Failed to load project risk data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectRisks();
  }, []);

  useEffect(() => {
    // Filter projects by search term
    if (searchTerm.trim() === '') {
      setSearchResults(projectRisks);
    } else {
      const filtered = projectRisks.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered);
    }
  }, [searchTerm, projectRisks]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleProjectSelect = (projectId) => {
    setSelectedProject(projectId);
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set default direction
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  // Sort the search results (with null/undefined protection)
  const sortedResults = searchResults && Array.isArray(searchResults) 
    ? [...searchResults].sort((a, b) => {
        // Ensure we have valid objects with required properties
        if (!a || !b) return 0;
        
        let valueA, valueB;
        
        switch (sortBy) {
          case 'name':
            valueA = a.name?.toLowerCase() || '';
            valueB = b.name?.toLowerCase() || '';
            break;
          case 'client':
            valueA = a.client?.toLowerCase() || '';
            valueB = b.client?.toLowerCase() || '';
            break;
          case 'riskLevel':
            valueA = a.riskScore || 0;
            valueB = b.riskScore || 0;
            break;
          case 'endDate':
            valueA = a.endDate ? new Date(a.endDate) : new Date();
            valueB = b.endDate ? new Date(b.endDate) : new Date();
            break;
          default:
            valueA = a.riskScore || 0;
            valueB = b.riskScore || 0;
        }
        
        if (sortDirection === 'asc') {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      }) 
    : [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI-Powered Project Risk Analysis</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left panel - Project list */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <SearchFilter 
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search projects..."
              />
            </div>
            
            {loading ? (
              <div className="p-6 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="p-4">
                <ErrorMessage message={error} />
              </div>
            ) : (
              <ProjectRiskList 
                projects={sortedResults || []}
                selectedProjectId={selectedProject}
                onProjectSelect={handleProjectSelect}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
            )}
          </div>
        </div>
        
        {/* Right panel - Project risk details */}
        <div className="md:col-span-2">
          {selectedProject ? (
            <ProjectRiskDetail projectId={selectedProject} />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center min-h-[400px]">
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg text-gray-600">Select a project to view its risk analysis</p>
            </div>
          )}
        </div>
      </div>
      
      {!loading && !error && projectRisks && Array.isArray(projectRisks) && projectRisks.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">AI Risk Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-gray-600">High Risk Projects</p>
              <p className="text-2xl font-bold text-red-600">
                {projectRisks.filter(p => p && p.riskLevel === 'High').length}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-600">Medium Risk Projects</p>
              <p className="text-2xl font-bold text-yellow-600">
                {projectRisks.filter(p => p && p.riskLevel === 'Medium').length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600">Low Risk Projects</p>
              <p className="text-2xl font-bold text-green-600">
                {projectRisks.filter(p => p && p.riskLevel === 'Low').length}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">Overall Risk Index</p>
              <p className="text-2xl font-bold text-blue-600">
                {projectRisks.length > 0 
                  ? Math.round(projectRisks.reduce((sum, p) => (p && p.riskScore) ? sum + p.riskScore : sum, 0) / projectRisks.length) 
                  : 0
                }%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectRiskPage;