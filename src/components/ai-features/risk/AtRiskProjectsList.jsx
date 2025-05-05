import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AtRiskProjectsList = ({ projects }) => {
  const [expandedProject, setExpandedProject] = useState(null);

  // Check if we have valid data
  if (!projects || projects.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Projects at Risk</h2>
        <p className="text-gray-500">No projects with significant risk detected</p>
      </div>
    );
  }

  // Function to get color based on risk score
  const getRiskColor = (score) => {
    if (score >= 75) return 'bg-red-100 border-red-200 text-red-800';
    if (score >= 50) return 'bg-orange-100 border-orange-200 text-orange-800';
    if (score >= 25) return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    return 'bg-green-100 border-green-200 text-green-800';
  };

  // Function to get risk label
  const getRiskLabel = (score) => {
    if (score >= 75) return 'Critical';
    if (score >= 50) return 'High';
    if (score >= 25) return 'Medium';
    return 'Low';
  };

  // Toggle project expansion
  const toggleExpand = (id) => {
    setExpandedProject(expandedProject === id ? null : id);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Projects at Risk</h2>
      
      <div className="space-y-4">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className="border rounded-lg overflow-hidden hover:shadow-md transition-all"
          >
            {/* Project header - always visible */}
            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleExpand(project.id)}>
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-8 rounded-full ${getRiskColor(project.riskScore).split(' ')[0]}`}></div>
                <div>
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="text-sm text-gray-600">{project.client}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getRiskColor(project.riskScore)}`}>
                  {getRiskLabel(project.riskScore)} ({project.riskScore})
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {project.daysRemaining ? `${project.daysRemaining} days remaining` : 'Ongoing'}
                </p>
              </div>
            </div>
            
            {/* Expanded content */}
            {expandedProject === project.id && (
              <div className="p-4 bg-gray-50 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Top Risk Factors</h4>
                    <ul className="space-y-2">
                      {project.topRiskFactors?.map((factor, idx) => (
                        <li key={idx} className="flex justify-between text-sm">
                          <span>{factor.name}</span>
                          <span className={getRiskColor(factor.score).split(' ').slice(-1)[0]}>
                            {factor.score}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">AI Recommendations</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {project.recommendations?.map((rec, idx) => (
                        <li key={idx} className="text-gray-700">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link 
                    to={`/projects/${project.id}`} 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Project Details
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AtRiskProjectsList;