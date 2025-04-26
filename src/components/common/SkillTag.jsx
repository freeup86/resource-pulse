import React from 'react';

const SkillTag = ({ skill }) => {
  return (
    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
      {skill}
    </span>
  );
};

export default SkillTag;