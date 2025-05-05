import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { getNotifications, markAllNotificationsAsRead, deleteNotification } from '../../services/notificationService';
import MainLayout from '../layout/MainLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import StatusBadge from '../common/StatusBadge';

const NotificationsListPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      
      // Process and validate notification data
      const processedData = Array.isArray(data) ? data.map(notification => {
        // Ensure we have a valid date string
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
          // Ensure consistent property names
          is_read: notification.isRead || notification.is_read || false,
          created_at: dateString
        };
      }) : [];
      
      setNotifications(processedData);
      setError(null);
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Failed to mark all notifications as read');
    }
  };
  
  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
    }
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'allocation_change':
        return <i className="fas fa-exchange-alt text-blue-500"></i>;
      case 'deadline_approaching':
        return <i className="fas fa-clock text-yellow-500"></i>;
      case 'resource_conflict':
        return <i className="fas fa-exclamation-triangle text-red-500"></i>;
      case 'capacity_threshold':
        return <i className="fas fa-battery-three-quarters text-orange-500"></i>;
      case 'weekly_digest':
        return <i className="fas fa-envelope text-green-500"></i>;
      default:
        return <i className="fas fa-bell text-gray-500"></i>;
    }
  };
  
  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.is_read);
      case 'read':
        return notifications.filter(n => n.is_read);
      case 'all':
      default:
        return notifications;
    }
  };
  
  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <div className="flex items-center">
              <Link 
                to="/notifications/settings" 
                className="mr-4 text-blue-500 hover:text-blue-700"
              >
                <i className="fas fa-cog mr-1"></i> Settings
              </Link>
              {unreadCount > 0 && (
                <button 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  onClick={handleMarkAllAsRead}
                >
                  Mark All as Read
                </button>
              )}
            </div>
          </div>
          
          {error && <ErrorMessage message={error} />}
          
          <div className="border-b flex">
            <button 
              className={`px-4 py-2 font-medium ${filter === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`px-4 py-2 font-medium ${filter === 'unread' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setFilter('unread')}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button 
              className={`px-4 py-2 font-medium ${filter === 'read' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setFilter('read')}
            >
              Read
            </button>
          </div>
          
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <i className="fas fa-bell text-gray-300 text-5xl mb-4"></i>
              <p>No notifications to display</p>
            </div>
          ) : (
            <div>
              {filteredNotifications.map(notification => (
                <Link 
                  key={notification.id} 
                  to={`/notifications/${notification.id}`}
                  className={`block border-b p-4 hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex">
                    <div className="mr-3 pt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className={`text-sm ${!notification.is_read ? 'font-bold' : ''}`}>
                          {notification.title || notification.type.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-3">
                            {notification.created_at ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : 'Just now'}
                          </span>
                          <button 
                            className="text-gray-400 hover:text-red-500"
                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                            title="Delete notification"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                      <p className={`mt-1 ${!notification.is_read ? 'font-semibold' : ''}`}>
                        {notification.message}
                      </p>
                      {!notification.is_read && (
                        <div className="mt-2">
                          <StatusBadge status="new" text="New" />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default NotificationsListPage;