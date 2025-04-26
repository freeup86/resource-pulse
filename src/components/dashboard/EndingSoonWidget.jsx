import React from 'react';
import { Link } from 'react-router-dom';
import { resources, projects } from '../../utils/mockData';
import { formatDate, calculateDaysUntilEnd, isEndingSoon } from '../../utils/dateUtils';

const EndingSoonWidget = () => {
  // Get resources ending soon (top 3)
  const resourcesEndingSoon = resources
    .filter(resource => resource.allocation && isEndingSoon(resource.allocation.endDate))
    .sort((a, b) => calculateDaysUntilEnd(a.allocation.endDate) - calculateDaysUntilEnd(b.allocation.endDate))
    .slice(0, 3);
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-gray-50">
        <h2 className="font-semibold">Resources Ending Soon</h2>
        <Link to="/ending-soon" className="text-sm text-blue-600 hover:underline">View all</Link>
      </div>
      
      <div className="divide-y divide-gray-200">
        {resourcesEndingSoon.length > 0 ? (
          resourcesEndingSoon.map(resource => {
            const project = projects.find(p => p.id === resource.allocation.projectId);
            const daysLeft = calculateDaysUntilEnd(resource.allocation.endDate);
            
            return (
              <div key={resource.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{resource.name}</h3>
                    <p className="text-sm text-gray-500">{project?.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    daysLeft <= 7
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {daysLeft} days left
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-gray-500">
            No resources with assignments ending soon
          </div>
        )}
      </div>
    </div>
  );
};

export default EndingSoonWidget;