import React from 'react';
import { Link } from 'react-router-dom';
import { resources } from '../../utils/mockData';

const UnallocatedWidget = () => {
  // Get unallocated resources (top 3)
  const unallocatedResources = resources
    .filter(resource => !resource.allocation)
    .slice(0, 3);
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-gray-50">
        <h2 className="font-semibold">Available Resources</h2>
        <Link to="/allocations" className="text-sm text-blue-600 hover:underline">View all</Link>
      </div>
      
      <div className="divide-y divide-gray-200">
        {unallocatedResources.length > 0 ? (
          unallocatedResources.map(resource => (
            <div key={resource.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{resource.name}</h3>
                  <p className="text-sm text-gray-500">{resource.role}</p>
                </div>
                <button className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                  Assign
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No unallocated resources available
          </div>
        )}
      </div>
    </div>
  );
};

export default UnallocatedWidget;