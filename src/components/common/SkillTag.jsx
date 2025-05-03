import React from 'react';

const SkillTag = ({ skill, proficiency, category, onClick }) => {
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
  const proficiencyColor = proficiency ? proficiencyColors[proficiency] : proficiencyColors.default;
  const categoryBorder = category ? categoryColors[category] : categoryColors.default;

  // Combine classes
  const classes = `px-2 py-1 text-xs rounded-full border ${proficiencyColor} ${categoryBorder} ${onClick ? 'cursor-pointer hover:shadow-sm' : ''}`;

  return (
    <span 
      className={classes}
      onClick={onClick ? () => onClick(skill) : null}
      title={proficiency ? `${skill} - ${proficiency}` : skill}
    >
      {skill}{proficiency && <span className="ml-1 font-semibold">[{proficiency.charAt(0)}]</span>}
    </span>
  );
};

export default SkillTag;