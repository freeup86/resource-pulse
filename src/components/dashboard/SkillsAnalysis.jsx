import React, { useMemo } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';

const SkillsAnalysis = () => {
  const { resources, loading: resourcesLoading } = useResources();
  const { projects, loading: projectsLoading } = useProjects();
  
  const loading = resourcesLoading || projectsLoading;
  
  // Analyze skills gap
  const skillsAnalysis = useMemo(() => {
    if (loading) return [];
    
    // Collect all skills from resources
    const availableSkills = {};
    resources.forEach(resource => {
      resource.skills.forEach(skill => {
        if (!availableSkills[skill]) {
          availableSkills[skill] = 0;
        }
        availableSkills[skill]++;
      });
    });
    
    // Collect all required skills from projects
    const requiredSkills = {};
    projects.forEach(project => {
      project.requiredSkills.forEach(skill => {
        if (!requiredSkills[skill]) {
          requiredSkills[skill] = 0;
        }
        requiredSkills[skill]++;
      });
    });
    
    // Calculate demand vs supply for each skill
    const skillsGap = [];
    const allSkills = new Set([...Object.keys(availableSkills), ...Object.keys(requiredSkills)]);
    
    allSkills.forEach(skill => {
      const available = availableSkills[skill] || 0;
      const required = requiredSkills[skill] || 0;
      
      skillsGap.push({
        name: skill,
        available,
        required,
        gap: available - required,
        isShortage: available < required
      });
    });
    
    // Sort by gap (shortages first)
    return skillsGap.sort((a, b) => a.gap - b.gap);
  }, [resources, projects, loading]);
  
  // Only display top skills (shortages and abundance)
  const topSkills = useMemo(() => {
    if (skillsAnalysis.length <= 8) {
      return skillsAnalysis;
    }
    
    // Get top 4 shortages and top 4 abundances
    const shortages = skillsAnalysis.filter(s => s.isShortage).slice(0, 4);
    const abundances = skillsAnalysis.filter(s => !s.isShortage).slice(-4).reverse();
    
    return [...shortages, ...abundances];
  }, [skillsAnalysis]);
  
  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded"></div>;
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Skills Analysis</h3>
      
      <div className="space-y-3">
        {topSkills.map((skill, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{skill.name}</span>
              <span className={skill.isShortage ? 'text-red-600' : 'text-green-600'}>
                {skill.available} / {skill.required}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              {skill.isShortage ? (
                // Shortage
                <div 
                  className="bg-red-600 h-2.5 rounded-full" 
                  style={{width: `${Math.min((skill.available / skill.required) * 100, 100)}%`}}
                ></div>
              ) : (
                // Abundance or match
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{width: '100%'}}
                ></div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {skill.isShortage 
                ? `Shortage: Need ${skill.required - skill.available} more resources with this skill` 
                : `Abundance: ${skill.available - skill.required} extra resources have this skill`}
            </div>
          </div>
        ))}
        
        {skillsAnalysis.length === 0 && (
          <div className="text-center text-gray-500 my-8">
            No skills data available. Add resources and projects with skills to see analysis.
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsAnalysis;