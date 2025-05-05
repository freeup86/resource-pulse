import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import NotificationsList from './NotificationsList';
import { setCurrentUserId } from '../../services/notificationService';
import { useUser } from '../../contexts/UserContext';

const NotificationCenter = () => {
  const { currentUser } = useUser();
  
  useEffect(() => {
    // Update the current user ID in the notification service
    if (currentUser && currentUser.id) {
      setCurrentUserId(currentUser.id);
    }
  }, [currentUser]);
  
  return (
    <div className="max-h-96 overflow-y-auto text-gray-800">
      <div className="p-3 bg-blue-600 text-white border-b border-blue-700">
        <h3 className="font-medium">Notifications</h3>
      </div>
      <NotificationsList />
      <div className="p-2 text-center border-t">
        <Link 
          to="/notifications"
          className="text-sm text-blue-500 hover:text-blue-700 mx-2"
        >
          View All
        </Link>
        <Link 
          to="/notifications/settings" 
          className="text-sm text-blue-500 hover:text-blue-700 mx-2"
        >
          Settings
        </Link>
      </div>
    </div>
  );
};

export default NotificationCenter;