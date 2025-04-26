import { calculateDaysUntilEnd } from './dateUtils';

// Calculate match score between resource and project
export const calculateMatchScore = (resource, project) => {
    const matchedSkills = resource.skills.filter(skill => 
      project.requiredSkills.includes(skill)
    );
    
    return (matchedSkills.length / project.requiredSkills.length) * 100;
  };
  
  // Find matching resources for all projects
  export const findResourceMatches = (resources, projects) => {
    const matches = [];
    
    projects.forEach(project => {
      const matchingResources = resources.filter(resource => {
        // Check if resource is unallocated or ending soon (within 14 days)
        const isAvailable = !resource.allocation || 
                           (resource.allocation && calculateDaysUntilEnd(resource.allocation.endDate) <= 14);
        
        // Check if resource has at least one required skill
        const hasRequiredSkill = resource.skills.some(skill => 
          project.requiredSkills.includes(skill)
        );
        
        return isAvailable && hasRequiredSkill;
      });
      
      if (matchingResources.length > 0) {
        matches.push({
          project,
          resources: matchingResources,
          matchScore: matchingResources.map(resource => {
            const matchedSkills = resource.skills.filter(skill => 
              project.requiredSkills.includes(skill)
            );
            return {
              resourceId: resource.id,
              score: (matchedSkills.length / project.requiredSkills.length) * 100
            };
          })
        });
      }
    });
    
    return matches;
  };