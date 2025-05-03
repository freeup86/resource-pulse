import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import NotificationsList from './NotificationsList';
import { getUnreadCount, setCurrentUserId } from '../../services/notificationService';
import { useUser } from '../../contexts/UserContext';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(false);
  const dropdownRef = useRef(null);
  const { currentUser } = useUser();
  
  useEffect(() => {
    // Update the current user ID in the notification service
    if (currentUser && currentUser.id) {
      setCurrentUserId(currentUser.id);
    }
  }, [currentUser]);
  
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [currentUser]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const fetchUnreadCount = async () => {
    try {
      setError(false);
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setError(true);
      setUnreadCount(0);
    }
  };
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // If there was an error getting the count, don't show the notification icon
  if (error) {
    return null;
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50">
          <NotificationsList />
          <div className="p-2 text-center border-t">
            <Link 
              to="/notifications/settings" 
              className="text-sm text-blue-500 hover:text-blue-700"
              onClick={() => setIsOpen(false)}
            >
              Notification Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;