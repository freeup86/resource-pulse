import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { getAllProjectRisks } from '../../services/projectRiskService';

const ProjectRiskSummary = () => {
  const [projectRisks, setProjectRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProjectRisks = async () => {
      setLoading(true);
      
      try {
        const response = await getAllProjectRisks();
        setProjectRisks(response);
      } catch (err) {
        console.error('Error fetching project risks:', err);
        setError('Failed to load risk data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectRisks();
  }, []);
  
  // Get projects with high or critical risk
  const highRiskProjects = projectRisks
    .filter(project => project.riskLevel >= 70)
    .sort((a, b) => b.riskLevel - a.riskLevel)
    .slice(0, 4); // Show top 4 highest risk projects
  
  // Determine trend indicator
  const getTrendIcon = (trend) => {
    if (trend === 'increasing') {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (trend === 'decreasing') {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return null;
  };
  
  // Get risk level class
  const getRiskLevelClass = (riskLevel) => {
    if (riskLevel >= 80) return 'bg-red-500';
    if (riskLevel >= 70) return 'bg-red-400';
    if (riskLevel >= 60) return 'bg-orange-400';
    if (riskLevel >= 50) return 'bg-yellow-400';
    return 'bg-green-400';
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center text-red-500 mb-2">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <h3 className="text-lg font-medium">Project Risk Summary</h3>
        </div>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900">Project Risk Summary</h3>
        </div>
        <Link to="/ai/risk" className="text-sm text-blue-600 hover:underline flex items-center">
          View All Risks <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
      
      {highRiskProjects.length > 0 ? (
        <div className="space-y-4">
          {highRiskProjects.map(project => (
            <div key={project.id} className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <Link to={`/projects/${project.id}`} className="font-medium text-blue-600 hover:underline">
                    {project.name}
                  </Link>
                  <div className="text-sm text-gray-500">{project.client}</div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(project.riskTrend)}
                  <div 
                    className={`text-xs font-bold text-white px-2 py-1 rounded-full ${getRiskLevelClass(project.riskLevel)}`}
                  >
                    {project.riskLevel}%
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xs font-medium text-gray-500 mb-1">Top Risk Factors:</div>
                <div className="flex flex-wrap gap-1">
                  {project.riskFactors?.slice(0, 3).map((factor, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="mb-2">No high-risk projects detected</div>
          <div className="text-sm">All projects are currently within acceptable risk thresholds</div>
        </div>
      )}
      
      <div className="mt-4 text-sm">
        <div className="flex justify-between items-center">
          <div className="text-gray-500">Organization Risk Level:</div>
          <div className="font-medium">
            {projectRisks.length ? 
              Math.round(projectRisks.reduce((sum, p) => sum + p.riskLevel, 0) / projectRisks.length) : 0}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectRiskSummary;