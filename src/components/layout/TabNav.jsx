import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Briefcase, Calendar, FileSearch } from 'lucide-react';

const TabNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const tabs = [
    { name: 'Resources', path: '/resources', icon: <Users className="w-5 h-5" /> },
    { name: 'Allocations', path: '/allocations', icon: <Briefcase className="w-5 h-5" /> },
    { name: 'Ending Soon', path: '/ending-soon', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Skill Matches', path: '/matches', icon: <FileSearch className="w-5 h-5" /> },
  ];
  
  return (
    <div className="overflow-x-auto">
      <div className="flex border-b border-gray-200 mb-4 min-w-max">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex items-center px-4 py-2 font-medium text-sm ${
              currentPath === tab.path
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline ml-2">{tab.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TabNav;