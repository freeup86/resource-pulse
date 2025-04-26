import React from 'react';
import { Link } from 'react-router-dom';
import CustomTimeline from '../timeline/CustomTimeline';

const TimelinePage = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Resource Timeline</h2>
        <div className="flex space-x-2">
          <Link to="/allocations" className="text-blue-600 hover:underline">
            View Allocations
          </Link>
        </div>
      </div>
      
      <CustomTimeline />
    </div>
  );
};

export default TimelinePage;