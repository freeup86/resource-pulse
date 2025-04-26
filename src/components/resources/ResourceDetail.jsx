import React, { useState } from 'react';
import { useProjects } from '../../contexts/ProjectContext';
import { formatDate, calculateDaysUntilEnd } from '../../utils/dateUtils';
import SkillTag from '../common/SkillTag';
import StatusBadge from '../common/StatusBadge';
import UtilizationBar from '../common/UtilizationBar';
import AllocationForm from '../allocations/AllocationForm';

const ResourceDetail = ({ resource }) => {
  const { projects } = useProjects();
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  
  if (!resource) {
    return <div className="text-center p-8">Resource not found</div>;
  }
  
  const project = resource.allocation 
    ? projects.find(p => p.id === resource.allocation.projectId) 
    : null;
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{resource.name}</h2>
            <p className="text-gray-600">{resource.role}</p>
          </div>
          <StatusBadge 
            status={
              !resource.allocation ? 'available' : 
              calculateDaysUntilEnd(resource.allocation.endDate) <= 7 ? 'critical' :
              calculateDaysUntilEnd(resource.allocation.endDate) <= 14 ? 'ending-soon' : 
              'allocated'
            } 
          />
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900">Skills</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {resource.skills.map((skill, idx) => (
              <SkillTag key={idx} skill={skill} />
            ))}
          </div>
        </div>
        
        {resource.allocation ? (
          <div className="mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Current Allocation</h3>
              <button 
                onClick={() => setShowAllocationForm(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit Allocation
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg mt-2">
              <p className="font-medium">{project?.name}</p>
              <p className="text-sm text-gray-500">Client: {project?.client}</p>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Utilization</span>
                  <span>{resource.allocation.utilization}%</span>
                </div>
                <UtilizationBar percentage={resource.allocation.utilization} />
              </div>
              
              <div className="mt-4 flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{formatDate(resource.allocation.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Days Remaining</p>
                  <p className={`font-medium ${
                    calculateDaysUntilEnd(resource.allocation.endDate) <= 7 ? 'text-red-600' :
                    calculateDaysUntilEnd(resource.allocation.endDate) <= 14 ? 'text-yellow-600' :
                    'text-gray-900'
                  }`}>
                    {calculateDaysUntilEnd(resource.allocation.endDate)} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900">Current Allocation</h3>
            <div className="bg-gray-50 p-4 rounded-lg mt-2 text-center">
              <p className="text-gray-500">This resource is currently unallocated</p>
              <button 
                onClick={() => setShowAllocationForm(true)}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Assign to Project
              </button>
            </div>
          </div>
        )}
      </div>
      
      {showAllocationForm && (
        <AllocationForm 
          resourceId={resource.id}
          allocation={resource.allocation}
          onClose={() => setShowAllocationForm(false)}
        />
      )}
    </div>
  );
};

export default ResourceDetail;