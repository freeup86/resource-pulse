import React from 'react';
import { Link } from 'react-router-dom';

const MatchList = ({ matches }) => {
  return (
    <div>
      {matches.length > 0 ? (
        matches.map((match, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div className="p-4 bg-gray-50">
              <h2 className="text-lg font-semibold">
                <Link to={`/projects/${match.project.id}`} className="text-blue-600 hover:underline">
                  {match.project.name}
                </Link>
              </h2>
              <div className="text-sm text-gray-500">Client: {match.project.client}</div>
            </div>
            
            {/* Required Roles Section */}
            {match.project.rolesNeeded && match.project.rolesNeeded.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-medium text-gray-800 mb-2">Roles Still Needed:</h3>
                <div className="flex flex-wrap gap-2">
                  {match.project.rolesNeeded.map((role, idx) => (
                    <div key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center">
                      <span className="font-medium">{role.name}</span>
                      <span className="ml-1 px-1.5 py-0.5 bg-purple-200 rounded-full text-xs">
                        {role.allocated}/{role.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Required Skills Section */}
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-800 mb-2">Required Skills:</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {match.project.requiredSkills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Matching Resources Section */}
            <div className="p-4">
              <h3 className="font-medium text-gray-800 mb-2">Matching Resources:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Score</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {match.resources.map((resource) => (
                      <tr key={resource.id} className={resource.roleNeeded ? 'bg-green-50' : ''}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            <Link to={`/resources/${resource.id}`} className="text-blue-600 hover:underline">
                              {resource.name}
                            </Link>
                          </div>
                          <div className="text-xs text-gray-500">{resource.role}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className={`text-sm ${resource.roleMatch ? 'font-medium text-purple-800' : 'text-gray-500'}`}>
                            {resource.roleName || resource.role}
                            {resource.roleMatch && resource.roleNeeded && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                                Needed
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 w-24">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  resource.matchScore >= 75 ? "bg-green-500" : 
                                  resource.matchScore >= 50 ? "bg-yellow-500" : "bg-orange-500"
                                }`} 
                                style={{width: `${Math.min(resource.matchScore, 100)}%`}}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">{Math.round(resource.matchScore)}%</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {resource.matchingSkills.map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {resource.availabilityStatus === 'available' ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              Available now
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                              Available in {resource.daysLeft} days
                            </span>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {resource.totalUtilization}% allocated
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <Link to={`/resources/${resource.id}`} className="text-blue-600 hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                    
                    {match.resources.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                          No matching resources found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Matches Found</h2>
          <p className="text-gray-500">There are currently no resource matches for any projects.</p>
        </div>
      )}
    </div>
  );
};

export default MatchList;