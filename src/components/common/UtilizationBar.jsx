import React from 'react';

const UtilizationBar = ({ percentage }) => {
  return (
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{width: `${percentage}%`}}
        ></div>
      </div>
      <div className="text-xs text-right mt-1">
        {percentage}%
      </div>
    </div>
  );
};

export default UtilizationBar;