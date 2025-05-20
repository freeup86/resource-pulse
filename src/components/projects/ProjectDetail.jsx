import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useResources } from '../../contexts/ResourceContext';
import { useRoles } from '../../contexts/RoleContext';
import { useSkills } from '../../contexts/SkillsContext';
import { formatDate, calculateDaysUntilEnd } from '../../utils/dateUtils';
import UtilizationBar from '../common/UtilizationBar';
import SkillTag from '../common/SkillTag';
import AllocationForm from '../allocations/AllocationForm';
import SkillRecommendationForm from '../skills/SkillRecommendationForm';
import ProjectFinancials from './ProjectFinancials';
import AiRecommendationDisplay from './AiRecommendationDisplay';
import SavedRecommendationsPanel from './SavedRecommendationsPanel';
import { generateRecommendations, saveRecommendation, deleteRecommendation } from '../../services/aiRecommendationService';
import api from '../../services/api';

const ProjectDetail = ({ project }) => {
  const { resources } = useResources();
  const { roles } = useRoles();
  const { skills } = useSkills();
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState(null);
  const [roleAssignments, setRoleAssignments] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [showAiRecommendations, setShowAiRecommendations] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [savedRecommendations, setSavedRecommendations] = useState([]);
  
  // Fetch saved recommendations when project changes
  useEffect(() => {
    if (project && project.id) {
      fetchSavedRecommendations();
    }
  }, [project]);
  
  // Function to fetch saved recommendations
  const fetchSavedRecommendations = async () => {
    try {
      const response = await api.get(`/projects/${project.id}/skill-recommendations`);
      if (response.data && response.data.success) {
        setSavedRecommendations(response.data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };
  
  if (!project) {
    return <div className="text-center p-8">Project not found</div>;
  }
  
  // Get resources allocated to this project - check both allocation and allocations array
  const assignedResources = resources.filter(resource => {
    // Check traditional allocation property
    if (resource.allocation && resource.allocation.projectId === project.id) {
      return true;
    }
    
    // Check allocations array if it exists
    if (resource.allocations && resource.allocations.length > 0) {
      return resource.allocations.some(allocation => 
        allocation && allocation.projectId === project.id
      );
    }
    
    return false;
  });

  // Create a more accurate role matching function - handles string comparison better
  const isRoleMatch = (requiredRole, resourceRole) => {
    if (!requiredRole || !resourceRole) return false;
    
    // Clean up and normalize strings for comparison
    const normalizeString = (str) => {
      return (str || '').toLowerCase().trim()
        .replace(/\s+/g, ' ') // normalize whitespace
        .replace(/[-_]/g, ' '); // treat hyphens and underscores as spaces
    };
    
    const normalizedRequired = normalizeString(requiredRole);
    const normalizedResource = normalizeString(resourceRole);
    
    // Check for exact or close matches
    return (
      normalizedRequired === normalizedResource ||
      // Include partial matching to handle differences in wording
      normalizedRequired.includes(normalizedResource) ||
      normalizedResource.includes(normalizedRequired)
    );
  };
  
  // Calculate role fulfillment with enhanced matching
  const roleFulfillment = (project.requiredRoles || []).map(role => {
    // Find assigned resources with matching role (either by ID or by name)
    const matchingResources = assignedResources.filter(resource => {
      // Get role information from the resource
      const resourceRoleId = resource.roleId;
      const resourceRoleName = resource.roleName || resource.role || '';
      
      // 1. Check if resource role matches by ID
      if (resourceRoleId && resourceRoleId === role.id) {
        return true;
      }
      
      // 2. Check if resource role matches by name with enhanced string matching
      return isRoleMatch(role.name, resourceRoleName);
    });
    
    const assigned = matchingResources.length;
    
    return {
      ...role,
      assigned,
      fulfilled: assigned >= role.count,
      remaining: Math.max(0, role.count - assigned),
      matchingResources
    };
  });

  // Handle adding skill development recommendation
  const handleAddRecommendation = (skillId) => {
    setSelectedSkillId(skillId);
    setShowRecommendationForm(true);
  };
  
  // Handle generating AI recommendations
  const handleGenerateAiRecommendations = async () => {
    if (!project.id) return;
    
    try {
      setIsLoadingRecommendations(true);
      const recommendations = await generateRecommendations(project.id);
      setAiRecommendations(recommendations);
      setShowAiRecommendations(true);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      alert('Failed to generate recommendations. Please try again later.');
    } finally {
      setIsLoadingRecommendations(false);
    }
  };
  
  // Handle saving an AI recommendation
  const handleSaveAiRecommendation = async (recommendation) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Find the skill ID
        const skillObj = skills.find(s => s.name === recommendation.skillName);
        
        if (!skillObj) {
          console.error('Skill not found:', recommendation.skillName);
          alert(`Could not find the skill "${recommendation.skillName}" in the system.`);
          reject(new Error('Skill not found'));
          return;
        }
        
        // Prepare the recommendation data
        const recommendationData = {
          projectId: project.id,
          skillId: skillObj.id,
          title: recommendation.title,
          description: recommendation.description,
          resourceUrl: recommendation.resourceUrl,
          estimatedTimeHours: recommendation.estimatedTimeHours,
          cost: recommendation.cost,
          aiGenerated: true
        };
        
        // Call API to save the recommendation
        await saveRecommendation(project.id, recommendationData);
        
        // Fetch the updated list of recommendations
        await fetchSavedRecommendations();
        
        // Success! Close the modal if it's the last recommendation
        if (aiRecommendations.length === 1) {
          setShowAiRecommendations(false);
        }
        
        // Remove the saved recommendation from the AI recommendations list
        setAiRecommendations(prev => 
          prev.filter(rec => rec.skillName !== recommendation.skillName)
        );
        
        // Notify user of success
        alert('Recommendation saved successfully!');
        
        resolve();
      } catch (error) {
        console.error('Error saving recommendation:', error);
        alert('Failed to save recommendation. Please try again.');
        reject(error);
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              {project.projectNumber && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                  {project.projectNumber}
                </span>
              )}
              <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            </div>
            <p className="text-gray-600 mt-1">Client: {project.client}</p>
            {project.projectOwner && (
              <p className="text-gray-600">Owner: {project.projectOwner}</p>
            )}
          </div>
          <div className="flex space-x-2">
            {project.startDate && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Starts: {formatDate(project.startDate)}
              </span>
            )}
            {project.endDate && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Ends: {formatDate(project.endDate)}
              </span>
            )}
          </div>
        </div>
        
        {/* Project dates in more detail if present */}
        {(project.startDate || project.endDate) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-sm text-gray-700">Project Timeline</h3>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div>
                <span className="text-xs text-gray-500">Start Date</span>
                <p className="text-sm">{project.startDate ? formatDate(project.startDate) : 'Not specified'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">End Date</span>
                <p className="text-sm">{project.endDate ? formatDate(project.endDate) : 'Not specified'}</p>
                {project.endDate && (
                  <p className="text-xs text-gray-500">
                    {calculateDaysUntilEnd(project.endDate) <= 0 
                      ? 'Project has ended' 
                      : `${calculateDaysUntilEnd(project.endDate)} days remaining`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {project.description && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900">Description</h3>
            <p className="mt-1 text-gray-600">{project.description}</p>
          </div>
        )}
        
        {/* Required Roles Section */}
        {project.requiredRoles && project.requiredRoles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900">Required Roles</h3>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-2">
              {roleFulfillment.map((role, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border ${
                    role.fulfilled 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{role.name}</span>
                    <span className="text-sm px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                      Required: {role.count}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>Assigned:</span>
                    <span className={role.fulfilled ? 'text-green-600' : 'text-yellow-600'}>
                      {role.assigned}/{role.count}
                    </span>
                  </div>
                  {!role.fulfilled && (
                    <div className="text-xs text-yellow-600 mt-1 text-right">
                      Need {role.remaining} more
                    </div>
                  )}
                  {role.matchingResources && role.matchingResources.length > 0 && (
                    <div className="text-xs mt-1 text-gray-500">
                      {role.matchingResources.map(r => r.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Required Skills Section */}
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Required Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {project.requiredSkills && project.requiredSkills.length > 0 ? (
              project.requiredSkills.map((skill, idx) => {
                // Find the skill object to get additional info if available
                const skillObj = typeof skill === 'string' 
                  ? skills.find(s => s.name === skill) 
                  : skills.find(s => s.name === skill.name);
                
                const skillName = typeof skill === 'string' ? skill : skill.name;
                
                return (
                  <div key={`skill-${idx}`} className="relative group">
                    <SkillTag 
                      skill={skillName}
                      proficiency={typeof skill === 'object' ? skill.proficiencyLevel : null}
                      category={skillObj?.category}
                      onClick={() => handleAddRecommendation(skillObj?.id)}
                    />
                    <div className="hidden group-hover:block absolute z-10 -bottom-7 left-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      Click to add recommendation
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">No specific skills required</p>
            )}
          </div>
        </div>
        
        {/* Allocated Resources Section */}
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Allocated Resources</h3>
            <button 
              onClick={() => setShowAllocationForm(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Allocate Resource
            </button>
          </div>
          
          {assignedResources.length > 0 ? (
            <div className="overflow-hidden mt-2">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Get all allocations for this project across all resources, including multiple allocations per resource */}
                  {assignedResources.flatMap(resource => {
                    // Get all allocations for this resource and project
                    const allocationsForProject = resource.allocations 
                      ? resource.allocations.filter(a => a && a.projectId === project.id)
                      : (resource.allocation && resource.allocation.projectId === project.id 
                          ? [resource.allocation] 
                          : []);
                    
                    // Map each allocation to a table row
                    return allocationsForProject.map((allocation, allocIndex) => (
                      <tr key={`${resource.id}-${allocation.id || allocIndex}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            <Link to={`/resources/${resource.id}`} className="text-blue-600 hover:underline">
                              {resource.name}
                              {allocationsForProject.length > 1 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  (Allocation {allocIndex + 1}/{allocationsForProject.length})
                                </span>
                              )}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {resource.roleName || resource.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <UtilizationBar percentage={allocation.utilization} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>
                            <span className="text-xs text-gray-500">Start:</span> {formatDate(allocation.startDate)}
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">End:</span> {formatDate(allocation.endDate)}
                          </div>
                          <div className={`text-xs ${
                            calculateDaysUntilEnd(allocation.endDate) <= 7
                              ? "text-red-600"
                              : calculateDaysUntilEnd(allocation.endDate) <= 14
                              ? "text-yellow-600"
                              : "text-gray-500"
                          }`}>
                            {calculateDaysUntilEnd(allocation.endDate)} days left
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link 
                            to={`/resources/${resource.id}`} 
                            className="text-blue-600 hover:underline"
                          >
                            View / Edit
                          </Link>
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg mt-2 text-center">
              <p className="text-gray-500">No resources allocated to this project</p>
            </div>
          )}
        </div>
        
        {/* Skill Development Recommendations Section */}
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Skill Development Recommendations</h3>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowRecommendationForm(true)}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
              >
                Add Recommendation
              </button>
              
              {project.requiredSkills && project.requiredSkills.length > 0 && (
                <button 
                  onClick={handleGenerateAiRecommendations}
                  disabled={isLoadingRecommendations}
                  className={`flex items-center px-3 py-1 text-sm rounded ${
                    isLoadingRecommendations 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isLoadingRecommendations ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                      <span>AI Suggest</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* New SavedRecommendationsPanel component */}
          <SavedRecommendationsPanel 
            projectId={project.id}
            projectName={project.name}
            onRecommendationDeleted={(recommendationId) => {
              // Update the local state to remove the deleted recommendation
              setSavedRecommendations(prev => 
                prev.filter(rec => rec.id !== recommendationId)
              );
            }}
          />
          
          {/* Empty state shown only if no recommendations */}
          {savedRecommendations.length === 0 && (!project.skillRecommendations || project.skillRecommendations.length === 0) && (
            <div className="bg-gray-50 p-4 rounded-lg text-center mt-2">
              <p className="text-gray-500">No skill development recommendations added yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Add recommendations manually or use AI to generate suggestions based on project skills.
              </p>
            </div>
          )}
          
          {/* Legacy recommendations display if they exist */}
          {project.skillRecommendations && project.skillRecommendations.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="text-md font-medium text-gray-700">Legacy Recommendations</h4>
              {project.skillRecommendations.map((rec, idx) => (
                <div key={`rec-${idx}`} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{rec.title}</h4>
                    <span className="text-sm text-gray-600">
                      {rec.estimatedTimeHours && `${rec.estimatedTimeHours} hours`}
                      {rec.cost && rec.estimatedTimeHours && ' • '}
                      {rec.cost && `$${rec.cost}`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Skill: {rec.skillName}</p>
                  {rec.description && <p className="mt-1 text-sm">{rec.description}</p>}
                  {rec.resourceUrl && (
                    <a 
                      href={rec.resourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                    >
                      View Resource
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Financial Information Section */}
        <div className="mt-8 p-4 border rounded-lg">
          <ProjectFinancials 
            project={{
              ...project,
              // Ensure allocatedResources is passed to ProjectFinancials
              allocatedResources: assignedResources.map(resource => {
                // Find the allocation for this project
                const allocationForProject = resource.allocations 
                  ? resource.allocations.find(a => a && a.projectId === project.id)
                  : (resource.allocation && resource.allocation.projectId === project.id 
                      ? resource.allocation 
                      : null);
                
                if (!allocationForProject) return null;
                
                return {
                  id: resource.id,
                  name: resource.name,
                  role: resource.roleName || resource.role,
                  utilization: allocationForProject.utilization,
                  hourlyRate: resource.hourlyRate || allocationForProject.hourlyRate,
                  billableRate: resource.billableRate || allocationForProject.billableRate,
                  totalHours: allocationForProject.totalHours,
                  totalCost: allocationForProject.totalCost,
                  billableAmount: allocationForProject.billableAmount
                };
              }).filter(Boolean)
            }} 
          />
        </div>
      </div>
      
      {showAllocationForm && (
        <AllocationForm 
          projectId={project.id}
          onClose={() => setShowAllocationForm(false)}
        />
      )}
      
      {showRecommendationForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <SkillRecommendationForm 
            skillId={selectedSkillId}
            onClose={() => {
              setShowRecommendationForm(false);
              setSelectedSkillId(null);
            }}
          />
        </div>
      )}
      
      {showAiRecommendations && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <AiRecommendationDisplay 
            recommendations={aiRecommendations}
            onSave={handleSaveAiRecommendation}
            onCancel={() => setShowAiRecommendations(false)}
            isLoading={isLoadingRecommendations}
          />
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;