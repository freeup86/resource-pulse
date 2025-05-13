import React from 'react';

const SkillTag = ({ skill, proficiency, category, onClick }) => {
  // Extract skill name and proficiency if skill is an object
  let skillName = skill;
  let skillProficiency = proficiency;
  
  if (typeof skill === 'object' && skill !== null) {
    skillName = skill.name || '';
    // Use provided proficiency or the one from the skill object
    skillProficiency = proficiency || skill.proficiencyLevel;
  }

  // Color mapping for proficiency levels
  const proficiencyColors = {
    Beginner: 'bg-blue-100 text-blue-800',
    Intermediate: 'bg-green-100 text-green-800',
    Advanced: 'bg-purple-100 text-purple-800',
    Expert: 'bg-red-100 text-red-800',
    default: 'bg-blue-100 text-blue-800'
  };

  // Color mapping for categories
  const categoryColors = {
    Technical: 'border-blue-300',
    Business: 'border-green-300',
    'Soft Skills': 'border-purple-300',
    default: 'border-gray-300'
  };

  // Determine colors based on proficiency and category
  const proficiencyColor = skillProficiency ? proficiencyColors[skillProficiency] : proficiencyColors.default;
  const categoryBorder = category ? categoryColors[category] : categoryColors.default;

  // Combine classes
  const classes = `px-2 py-1 text-xs rounded-full border ${proficiencyColor} ${categoryBorder} ${onClick ? 'cursor-pointer hover:shadow-sm' : ''}`;

  // Get proficiency initial for display
  const proficiencyInitial = skillProficiency ? skillProficiency.charAt(0) : '';


  return (
    <span 
      className={classes}
      onClick={onClick ? () => onClick(skillName) : null}
      title={skillProficiency ? `${skillName} - ${skillProficiency}` : skillName}
    >
      {skillName}{skillProficiency && <span className="ml-1 font-semibold">[{proficiencyInitial}]</span>}
    </span>
  );
};

export default SkillTag;