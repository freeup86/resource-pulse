import React, { useState, useEffect } from 'react';
import NotificationItem from './NotificationItem';
import LoadingSpinner from '../common/LoadingSpinner';
import { getNotifications, markNotificationAsRead } from '../../services/notificationService';

const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: true } 
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const unreadCount = notifications.filter(notif => !notif.is_read).length;
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }
  
  if (notifications.length === 0) {
    return <div className="p-4 text-gray-500 text-center">No notifications</div>;
  }
  
  return (
    <div className="notifications-list">
      <div className="flex justify-between items-center p-3 border-b bg-gray-50">
        <h3 className="font-medium">Notifications</h3>
        {unreadCount > 0 && (
          <span className="text-xs bg-blue-500 text-white rounded-full px-2 py-1">
            {unreadCount} new
          </span>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map(notification => (
          <NotificationItem 
            key={notification.id} 
            notification={notification} 
            onMarkAsRead={handleMarkAsRead}
          />
        ))}
      </div>
      <div className="p-2 border-t text-center">
        <button 
          className="text-sm text-blue-500 hover:text-blue-700"
          onClick={fetchNotifications}
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default NotificationsList;