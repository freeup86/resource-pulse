import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Settings } from 'lucide-react';
import NotificationCenter from '../notifications/NotificationCenter';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  
  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">ResourcePulse</Link>
        
        <div className="flex items-center md:hidden">
          {/* Mobile notification center */}
          <div className="mr-4">
            <NotificationCenter />
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <ul className="flex space-x-4">
            <li><Link to="/" className="hover:underline">Dashboard</Link></li>
            <li><Link to="/resources" className="hover:underline">Resources</Link></li>
            <li><Link to="/projects" className="hover:underline">Projects</Link></li>
            <li><Link to="/allocations" className="hover:underline">Allocations</Link></li>
            <li><Link to="/timeline" className="hover:underline">Timeline</Link></li>
            <li><Link to="/capacity" className="hover:underline">Capacity</Link></li>
            <li><Link to="/analytics" className="hover:underline">Analytics</Link></li>
          </ul>
          
          {/* Notification Center */}
          <div className="relative mx-4">
            <NotificationCenter />
          </div>
          
          {/* Admin dropdown */}
          <div className="relative ml-4">
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
        </nav>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="absolute top-16 right-0 left-0 bg-blue-600 z-10 md:hidden">
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
                    to="/allocations" 
                    className="block p-2 hover:bg-blue-700 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Allocations
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
                    to="/capacity" 
                    className="block p-2 hover:bg-blue-700 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Capacity
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/roles" 
                    className="block p-2 hover:bg-blue-700 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Role Management
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/import" 
                    className="block p-2 hover:bg-blue-700 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Import Data
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/export" 
                    className="block px-4 py-2 hover:bg-blue-100"
                    onClick={() => setIsAdminMenuOpen(false)}
                  >
                    Export Data
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/sync" 
                    className="block px-4 py-2 hover:bg-blue-100"
                    onClick={() => setIsAdminMenuOpen(false)}
                  >
                    External Sync
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/settings" 
                    className="block px-4 py-2 hover:bg-blue-100"
                    onClick={() => setIsAdminMenuOpen(false)}
                  >
                    System Settings
                  </Link>
                </li>
                <li>
                  <Link to="/analytics" className="hover:underline">Analytics</Link>
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