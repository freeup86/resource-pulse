import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'allocated':
        return 'bg-green-100 text-green-800';
      case 'available':
        return 'bg-gray-100 text-gray-800';
      case 'ending-soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles()}`}>
      {status === 'allocated' ? 'Allocated' : 
       status === 'available' ? 'Available' : 
       status === 'ending-soon' ? 'Ending Soon' : 
       status === 'critical' ? 'Critical' : status}
    </span>
  );
};

export default StatusBadge;