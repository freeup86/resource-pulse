import React, { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useSkills } from '../../contexts/SkillsContext';
import { useSettings } from '../../contexts/SettingsContext';
import { formatDate, calculateDaysUntilEnd } from '../../utils/dateUtils';
import { calculateTotalUtilization } from '../../utils/allocationUtils';
import SkillTag from '../common/SkillTag';
import StatusBadge from '../common/StatusBadge';
import UtilizationBar from '../common/UtilizationBar';
import AllocationForm from '../allocations/AllocationForm';
import CertificationForm from '../skills/CertificationForm';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import ResourceFinancials from './ResourceFinancials';

const ResourceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { resources, loading: resourcesLoading, error: resourcesError, deleteResource } = useResources();
  const { projects } = useProjects();
  const { skills } = useSkills();
  const { settings } = useSettings();
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [showCertificationForm, setShowCertificationForm] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  const resourceId = parseInt(id);

  // Use useMemo to memoize the resource finding logic
  const resource = useMemo(() => {
    return resources.find(r => r.id === resourceId);
  }, [resources, resourceId]);

  const handleAddAllocation = () => {
    setSelectedAllocation(null);
    setShowAllocationForm(true);
  };

  const handleEditAllocation = (allocation) => {
    setSelectedAllocation(allocation);
    setShowAllocationForm(true);
  };

  const handleAddCertification = () => {
    setShowCertificationForm(true);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      deleteResource(resourceId);
      navigate('/resources');
    }
  };

  // Compute total utilization using the utility function
  const totalUtilization = useMemo(() => {
    if (!resource) return 0;
    return calculateTotalUtilization(resource);
  }, [resource]);

  // Check if allocation is allowed based on settings
  const systemMaxUtilization = settings.maxUtilizationPercentage || 100;
  const allowOverallocation = settings.allowOverallocation;
  const canAddAllocation = allowOverallocation ?
    totalUtilization < systemMaxUtilization :
    totalUtilization < 100;

  // If resources are still loading, show loading spinner
  if (resourcesLoading) return <LoadingSpinner />;

  // If there's an error fetching resources, show error message
  if (resourcesError) return <ErrorMessage message={resourcesError} />;

  // If resource is not found, show not found message
  if (!resource) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-gray-700">Resource not found</h2>
        <Link to="/resources" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Resources
        </Link>
      </div>
    );
  }

  // Get all allocations
  const allocations = resource.allocations || [];

  return (
    <div>
      <div className="mb-4">
        <Link to="/resources" className="text-blue-600 hover:underline">← Back to Resources</Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{resource.name}</h2>
              <p className="text-gray-600">{resource.role}</p>
              <div className="mt-1">
                <span className={`px-2 py-0.5 text-xs rounded-full ${resource.systemRole === 'Admin' ? 'bg-purple-100 text-purple-800' :
                    resource.systemRole === 'ProjectManager' ? 'bg-blue-100 text-blue-800' :
                      resource.systemRole === 'ResourceManager' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                  }`}>
                  {resource.systemRole || 'User'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {resource.skills.map((skill, idx) => {
                // Find the skill object to get additional info if available
                let skillName = typeof skill === 'string' ? skill : skill.name;
                const skillObj = skills.find(s => s.name === skillName);

                return (
                  <SkillTag
                    key={`skill-${idx}`}
                    skill={skill}
                    category={skillObj?.category}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Allocations</h3>
              <button
                onClick={handleAddAllocation}
                className={`bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 ${!canAddAllocation ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                disabled={!canAddAllocation}
              >
                Add Allocation
              </button>
            </div>

            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Total Utilization</span>
                <span className="text-sm font-medium">{totalUtilization}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${totalUtilization > systemMaxUtilization ? 'bg-red-600' :
                      totalUtilization > 100 ? 'bg-yellow-600' : 'bg-blue-600'
                    }`}
                  style={{ width: `${Math.min(totalUtilization, 100)}%` }}
                ></div>
              </div>
              {totalUtilization > systemMaxUtilization && (
                <p className="text-sm text-red-600 mt-1">
                  Warning: Total utilization exceeds {systemMaxUtilization}% (system maximum)
                </p>
              )}
              {totalUtilization > 100 && totalUtilization <= systemMaxUtilization && allowOverallocation && (
                <p className="text-sm text-yellow-600 mt-1">
                  Over-allocated: {totalUtilization}% (within {systemMaxUtilization}% limit)
                </p>
              )}
              {totalUtilization > 100 && !allowOverallocation && (
                <p className="text-sm text-red-600 mt-1">
                  Warning: Total utilization exceeds 100%
                </p>
              )}
            </div>

            {allocations.length > 0 ? (
              <div className="mt-4 space-y-4">
                {allocations.map((allocation, index) => {
                  // Find project by ID
                  const project = projects.find(p => p.id === allocation.projectId);

                  return (
                    <div key={`allocation-${allocation.id || index}`} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {project ? (
                              <Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">
                                {project.name}
                              </Link>
                            ) : (
                              allocation.projectName || 'Unknown Project'
                            )}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {formatDate(allocation.startDate)} - {formatDate(allocation.endDate)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEditAllocation(allocation)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Utilization</span>
                          <span>{allocation.utilization || 0}%</span>
                        </div>
                        <UtilizationBar percentage={allocation.utilization || 0} />
                      </div>

                      <div className="mt-2 text-sm">
                        <span className={`${calculateDaysUntilEnd(allocation.endDate) <= 7 ? 'text-red-600' :
                            calculateDaysUntilEnd(allocation.endDate) <= 14 ? 'text-yellow-600' :
                              'text-gray-500'
                          }`}>
                          {calculateDaysUntilEnd(allocation.endDate)} days remaining
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg mt-2 text-center">
                <p className="text-gray-500">This resource is currently unallocated</p>
                <button
                  onClick={handleAddAllocation}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Assign to Project
                </button>
              </div>
            )}
          </div>

          {/* Certifications Section */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900">Skill Certifications</h3>
            <div className="mt-2">
              {resource.certifications && resource.certifications.length > 0 ? (
                <div className="space-y-3">
                  {resource.certifications.map((cert, idx) => (
                    <div key={`cert-${idx}`} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{cert.certificationName}</h4>
                        <div className="flex space-x-2">
                          {cert.expiryDate && new Date(cert.expiryDate) < new Date() ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Expired</span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Skill: {cert.skillName}</p>
                      {cert.issuer && <p className="text-sm text-gray-600">Issuer: {cert.issuer}</p>}
                      <div className="flex space-x-4 mt-1 text-sm text-gray-500">
                        {cert.issueDate && <div>Issued: {formatDate(cert.issueDate)}</div>}
                        {cert.expiryDate && <div>Expires: {formatDate(cert.expiryDate)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-500">No certifications added yet</p>
                  <button
                    onClick={handleAddCertification}
                    className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Add Certification
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information Section */}
          <div className="mt-8 p-4 border rounded-lg">
            {resource.financials ? (
              <ResourceFinancials
                resource={resource}
                allocations={allocations}
                financialSummary={resource.financialSummary}
                currency={resource.currency || 'USD'}
              />
            ) : (
              <div className="text-center p-4">
                <h3 className="text-lg font-medium text-gray-900">Financial Information</h3>
                <p className="text-gray-500 mt-2">No financial data available for this resource</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAllocationForm && (
        <AllocationForm
          resourceId={resourceId}
          allocation={selectedAllocation}
          onClose={() => {
            setShowAllocationForm(false);
            setSelectedAllocation(null);
          }}
        />
      )}

      {showCertificationForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <CertificationForm
            resourceId={resourceId}
            onClose={() => setShowCertificationForm(false)}
          />
        </div>
      )}
    </div>
  );
};

export default ResourceDetail;