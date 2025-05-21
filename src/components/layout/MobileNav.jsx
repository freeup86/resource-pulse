import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Calendar, Settings } from 'lucide-react';

const MobileNav = () => {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Determine active route
  const isActive = (path) => {
    if (path === '/' && pathname === '/') {
      return true;
    }
    return path !== '/' && pathname.startsWith(path);
  };
  
  // Get icon color based on active state
  const getIconColor = (path) => {
    return isActive(path) ? 'text-blue-600' : 'text-gray-500';
  };
  
  // Get text style based on active state
  const getTextStyle = (path) => {
    return isActive(path) ? 'text-blue-600 font-medium' : 'text-gray-500';
  };
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="grid grid-cols-5 h-16">
        {/* Dashboard */}
        <Link to="/" className="flex flex-col items-center justify-center">
          <LayoutDashboard className={`h-5 w-5 ${getIconColor('/')}`} />
          <span className={`text-xs mt-1 ${getTextStyle('/')}`}>Dashboard</span>
        </Link>
        
        {/* Resources */}
        <Link to="/resources" className="flex flex-col items-center justify-center">
          <Users className={`h-5 w-5 ${getIconColor('/resources')}`} />
          <span className={`text-xs mt-1 ${getTextStyle('/resources')}`}>Resources</span>
        </Link>
        
        {/* Projects */}
        <Link to="/projects" className="flex flex-col items-center justify-center">
          <Briefcase className={`h-5 w-5 ${getIconColor('/projects')}`} />
          <span className={`text-xs mt-1 ${getTextStyle('/projects')}`}>Projects</span>
        </Link>
        
        {/* Timeline */}
        <Link to="/timeline" className="flex flex-col items-center justify-center">
          <Calendar className={`h-5 w-5 ${getIconColor('/timeline')}`} />
          <span className={`text-xs mt-1 ${getTextStyle('/timeline')}`}>Timeline</span>
        </Link>
        
        {/* Settings */}
        <Link to="/admin/settings" className="flex flex-col items-center justify-center">
          <Settings className={`h-5 w-5 ${getIconColor('/admin/settings')}`} />
          <span className={`text-xs mt-1 ${getTextStyle('/admin/settings')}`}>Settings</span>
        </Link>
      </div>
    </div>
  );
};

export default MobileNav;