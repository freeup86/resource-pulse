import React, { useState, useEffect } from 'react';
import TabNav from '../layout/TabNav';
import EndingSoonList from './EndingSoonList';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import * as allocationService from '../../services/allocationService';
import { useProjects } from '../../contexts/ProjectContext';

const EndingSoonPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { projects } = useProjects();

  useEffect(() => {
    const fetchEndingSoon = async () => {
      try {
        setLoading(true);
        const data = await allocationService.getResourcesEndingSoon(14); // 14 days threshold
        
        // Enhance the data with project information if not already present
        const enhancedData = data.map(resource => {
          // If the resource has allocations array, use that
          if (resource.allocations && resource.allocations.length > 0) {
            // Process each allocation to ensure it has project info
            const processedAllocations = resource.allocations.map(allocation => {
              if (!allocation.projectName && allocation.projectId) {
                const project = projects.find(p => p.id === allocation.projectId);
                if (project) {
                  return {
                    ...allocation,
                    projectName: project.name,
                    project: {
                      id: project.id,
                      name: project.name
                    }
                  };
                }
              }
              return allocation;
            });
            
            return {
              ...resource,
              allocations: processedAllocations,
              // Ensure the primary allocation property is also set
              allocation: processedAllocations[0]
            };
          } 
          // If it only has allocation property (older structure)
          else if (resource.allocation) {
            const allocation = resource.allocation;
            // If allocation is missing project info, try to add it
            if (!allocation.projectName && allocation.projectId) {
              const project = projects.find(p => p.id === allocation.projectId);
              if (project) {
                return {
                  ...resource,
                  allocation: {
                    ...allocation,
                    projectName: project.name,
                    project: {
                      id: project.id,
                      name: project.name
                    }
                  }
                };
              }
            }
          }
          
          return resource;
        });
        
        setResources(enhancedData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch resources ending soon');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEndingSoon();
  }, [projects]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Assignments Ending Soon</h2>
      <TabNav />
      <EndingSoonList resources={resources} />
    </div>
  );
};

export default EndingSoonPage;