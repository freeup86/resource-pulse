import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Settings, Bell, Lightbulb, LogOut, User, GitBranch } from 'lucide-react';
import NotificationCenter from '../notifications/NotificationCenter';
import { getUnreadCount } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const { currentUser, logout } = useAuth();
  
  // Refs for dropdown containers
  const adminDropdownRef = useRef(null);
  const aiDropdownRef = useRef(null);
  const notificationsDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  
  useEffect(() => {
    // Fetch unread notifications count
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount();
        setNotificationsCount(count);
      } catch (error) {
        console.error('Error fetching unread notifications count:', error);
      }
    };

    fetchUnreadCount();
    // Set up interval to check for new notifications
    const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close admin dropdown if clicked outside
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setIsAdminMenuOpen(false);
      }
      
      // Close AI dropdown if clicked outside
      if (aiDropdownRef.current && !aiDropdownRef.current.contains(event.target)) {
        setIsAiMenuOpen(false);
      }
      
      // Close notifications dropdown if clicked outside
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      
      // Close user dropdown if clicked outside
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      
      // Close mobile menu if clicked outside (but not on the mobile menu button)
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && 
          mobileMenuButtonRef.current && !mobileMenuButtonRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };
  
  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">ResourcePulse</Link>
        
        {/* Mobile menu button */}
        <button 
          ref={mobileMenuButtonRef}
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <ul className="flex space-x-4">
            <li><Link to="/" className="hover:underline">Dashboard</Link></li>
            <li><Link to="/resources" className="hover:underline">Resources</Link></li>
            <li><Link to="/projects" className="hover:underline">Projects</Link></li>
            <li><Link to="/timeline" className="hover:underline">Timeline</Link></li>
            <li><Link to="/whatif" className="hover:underline flex items-center"><GitBranch className="h-4 w-4 mr-1" />What-If</Link></li>
          </ul>
          
          {/* AI Features dropdown */}
          <div className="relative ml-2" ref={aiDropdownRef}>
            <button 
              className="flex items-center hover:underline"
              onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
            >
              <Lightbulb className="h-5 w-5 mr-1" />
              <span>AI Tools</span>
            </button>
            
            {isAiMenuOpen && (
              <div className="absolute left-0 mt-2 w-52 bg-white text-gray-800 rounded shadow-lg z-10">
                <Link 
                  to="/ai/forecast" 
                  className="block px-4 py-2 hover:bg-blue-100"
                  onClick={() => setIsAiMenuOpen(false)}
                >
                  Utilization Forecast
                </Link>
                <Link 
                  to="/ai/risk" 
                  className="block px-4 py-2 hover:bg-blue-100"
                  onClick={() => setIsAiMenuOpen(false)}
                >
                  Project Risk Analysis
                </Link>
                <Link 
                  to="/ai/skills" 
                  className="block px-4 py-2 hover:bg-blue-100"
                  onClick={() => setIsAiMenuOpen(false)}
                >
                  Skills Gap Analysis
                </Link>
              </div>
            )}
          </div>
          
          {/* Notifications Icon */}
          <div className="relative ml-2" ref={notificationsDropdownRef}>
            <button 
              className="relative hover:text-gray-200"
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationsCount > 99 ? '99+' : notificationsCount}
                </span>
              )}
            </button>
            
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50 text-gray-800">
                <NotificationCenter />
              </div>
            )}
          </div>

          {/* Admin dropdown */}
          <div className="relative ml-2" ref={adminDropdownRef}>
            <button
              className="flex items-center hover:underline"
              onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
            >
              <Settings className="h-5 w-5 mr-1" />
              <span>Admin</span>
            </button>
            
            {isAdminMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg z-10">
                <Link 
                  to="/admin/roles" 
                  className="block px-4 py-2 hover:bg-blue-100"
                  onClick={() => setIsAdminMenuOpen(false)}
                >
                  Role Management
                </Link>
                <Link 
                  to="/admin/skills" 
                  className="block px-4 py-2 hover:bg-blue-100"
                  onClick={() => setIsAdminMenuOpen(false)}
                >
                  Skills Management
                </Link>
                <Link 
                  to="/admin/import" 
                  className="block px-4 py-2 hover:bg-blue-100"
                  onClick={() => setIsAdminMenuOpen(false)}
                >
                  Import Data
                </Link>
                <Link 
                  to="/admin/export" 
                  className="block px-4 py-2 hover:bg-blue-100"
                  onClick={() => setIsAdminMenuOpen(false)}
                >
                  Export Data
                </Link>
                <Link 
                  to="/admin/sync" 
                  className="block px-4 py-2 hover:bg-blue-100"
                  onClick={() => setIsAdminMenuOpen(false)}
                >
                  External Sync
                </Link>
                <Link 
                  to="/admin/settings" 
                  className="block px-4 py-2 hover:bg-blue-100"
                  onClick={() => setIsAdminMenuOpen(false)}
                >
                  System Settings
                </Link>
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative ml-2" ref={userDropdownRef}>
            <button
              className="flex items-center hover:underline"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <User className="h-5 w-5 mr-1" />
              <span>{currentUser?.username || 'User'}</span>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg z-10">
                <div className="px-4 py-2 text-gray-600 border-b">
                  <div className="font-medium">{currentUser?.firstName || ''} {currentUser?.lastName || ''}</div>
                  <div className="text-xs text-gray-500">{currentUser?.email || ''}</div>
                </div>
                <Link
                  to="/profile"
                  className="block px-4 py-2 hover:bg-blue-100"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-blue-100 text-red-600"
                >
                  <div className="flex items-center">
                    <LogOut className="h-4 w-4 mr-1" />
                    <span>Logout</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </nav>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="absolute top-16 right-0 left-0 bg-blue-600 z-10 md:hidden" ref={mobileMenuRef}>
            <nav className="container mx-auto p-4">
              <ul className="flex flex-col space-y-2">
                <li>
                  <Link 
                    to="/" 
                    className="block p-2 hover:bg-blue-700 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/resources" 
                    className="block p-2 hover:bg-blue-700 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Resources
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/projects" 
                    className="block p-2 hover:bg-blue-700 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Projects
                  </Link>
                </li>
                <li>
                  <Link
                    to="/timeline"
                    className="block p-2 hover:bg-blue-700 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Timeline
                  </Link>
                </li>
                <li>
                  <Link
                    to="/whatif"
                    className="block p-2 hover:bg-blue-700 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <GitBranch className="h-4 w-4 mr-2" />
                      What-If Scenario Planning
                    </div>
                  </Link>
                </li>
                
                {/* AI Features for mobile */}
                <li className="pt-2 pb-1 px-2 text-gray-200 font-medium">
                  AI Tools
                </li>
                <li>
                  <Link 
                    to="/ai/forecast" 
                    className="block p-2 hover:bg-blue-700 rounded ml-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Utilization Forecast
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/ai/risk" 
                    className="block p-2 hover:bg-blue-700 rounded ml-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Project Risk Analysis
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/ai/skills" 
                    className="block p-2 hover:bg-blue-700 rounded ml-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Skills Gap Analysis
                  </Link>
                </li>
                
                {/* Admin section for mobile */}
                <li className="pt-2 pb-1 px-2 text-gray-200 font-medium">
                  Admin
                </li>
                <li>
                  <Link 
                    to="/admin/roles" 
                    className="block p-2 hover:bg-blue-700 rounded ml-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Role Management
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/skills" 
                    className="block p-2 hover:bg-blue-700 rounded ml-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Skills Management
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/import" 
                    className="block p-2 hover:bg-blue-700 rounded ml-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Import Data
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/export" 
                    className="block p-2 hover:bg-blue-700 rounded ml-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Export Data
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/sync" 
                    className="block p-2 hover:bg-blue-700 rounded ml-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    External Sync
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/settings" 
                    className="block p-2 hover:bg-blue-700 rounded ml-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    System Settings
                  </Link>
                </li>
                
                {/* Notifications for mobile */}
                <li>
                  <Link
                    to="/notifications"
                    className="block p-2 hover:bg-blue-700 rounded flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications
                    {notificationsCount > 0 && (
                      <span className="ml-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notificationsCount > 99 ? '99+' : notificationsCount}
                      </span>
                    )}
                  </Link>
                </li>

                {/* User/Logout for mobile */}
                <li className="pt-2 pb-1 px-2 text-gray-200 font-medium">
                  User
                </li>
                <li>
                  <div className="p-2 text-gray-200">
                    <div>{currentUser?.firstName || ''} {currentUser?.lastName || ''}</div>
                    <div className="text-xs text-gray-300">{currentUser?.email || ''}</div>
                  </div>
                </li>
                <li>
                  <Link
                    to="/profile"
                    className="block p-2 hover:bg-blue-700 rounded ml-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left p-2 hover:bg-blue-700 rounded ml-2 text-red-300"
                  >
                    <div className="flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Logout</span>
                    </div>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;