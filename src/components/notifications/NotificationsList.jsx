import React, { useState, useEffect } from 'react';
import NotificationItem from './NotificationItem';
import LoadingSpinner from '../common/LoadingSpinner';
import { getNotifications, markNotificationAsRead, markAllAsRead } from '../../services/notificationService';

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
      const data = await getNotifications({ limit: 10 });
      
      // Convert backend property names to frontend property names if needed
      const formattedNotifications = Array.isArray(data) ? data.map(notification => {
        // Ensure we have a valid date string or null
        let dateString = null;
        try {
          // Try to use the existing date or create a new one
          if (notification.createdAt && notification.createdAt.length > 0) {
            dateString = notification.createdAt;
          } else if (notification.created_at && notification.created_at.length > 0) {
            dateString = notification.created_at;
          } else {
            dateString = new Date().toISOString();
          }
          // Validate the date is parseable
          new Date(dateString);
        } catch (e) {
          console.warn('Invalid date format, using current date instead', e);
          dateString = new Date().toISOString();
        }
        
        return {
          ...notification,
          // Convert snake_case to camelCase if needed
          is_read: notification.isRead || notification.is_read || false,
          created_at: dateString
        };
      }) : [];
      
      setNotifications(formattedNotifications);
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

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(notification => ({ 
        ...notification, 
        is_read: true 
      })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(notif => !notif.is_read).length;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }
  
  if (notifications.length === 0) {
    return <div className="p-4 text-gray-600 text-center">No notifications</div>;
  }
  
  return (
    <div className="notifications-list text-gray-800">
      <div className="flex justify-between items-center p-3 border-b bg-gray-50">
        {unreadCount > 0 ? (
          <div className="flex items-center">
            <span className="text-xs bg-blue-500 text-white rounded-full px-2 py-1 mr-2">
              {unreadCount} new
            </span>
            <button 
              className="text-xs text-blue-600 hover:text-blue-800" 
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </button>
          </div>
        ) : (
          <span className="text-sm text-gray-500">All caught up</span>
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