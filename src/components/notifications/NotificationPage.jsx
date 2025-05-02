import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { getNotificationById, markNotificationAsRead } from '../../services/notificationService';
import MainLayout from '../layout/MainLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const NotificationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchNotification();
  }, [id]);
  
  const fetchNotification = async () => {
    try {
      setLoading(true);
      const data = await getNotificationById(id);
      setNotification(data);
      
      // Mark as read if it's not already
      if (!data.is_read) {
        await markNotificationAsRead(id);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load notification');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'allocation_change':
        return <i className="fas fa-exchange-alt text-blue-500 text-2xl"></i>;
      case 'deadline_approaching':
        return <i className="fas fa-clock text-yellow-500 text-2xl"></i>;
      case 'resource_conflict':
        return <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>;
      case 'capacity_threshold':
        return <i className="fas fa-battery-three-quarters text-orange-500 text-2xl"></i>;
      case 'weekly_digest':
        return <i className="fas fa-envelope text-green-500 text-2xl"></i>;
      default:
        return <i className="fas fa-bell text-gray-500 text-2xl"></i>;
    }
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto p-4">
          <ErrorMessage message={error} />
          <button 
            className="mt-4 text-blue-500 hover:text-blue-700"
            onClick={handleBack}
          >
            &larr; Back
          </button>
        </div>
      </MainLayout>
    );
  }
  
  if (!notification) {
    return (
      <MainLayout>
        <div className="container mx-auto p-4">
          <div className="bg-yellow-100 p-4 rounded text-yellow-800">
            Notification not found
          </div>
          <button 
            className="mt-4 text-blue-500 hover:text-blue-700"
            onClick={handleBack}
          >
            &larr; Back
          </button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <button 
            className="mb-4 text-blue-500 hover:text-blue-700 flex items-center"
            onClick={handleBack}
          >
            <i className="fas fa-arrow-left mr-2"></i> Back to notifications
          </button>
          
          <div className="flex items-start mb-6">
            <div className="mr-4">
              {getNotificationIcon(notification.type)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{notification.title || 'Notification'}</h1>
              <p className="text-gray-500">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <p className="text-lg">{notification.message}</p>
          </div>
          
          {notification.details && (
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">Details</h2>
              <div className="p-4 bg-gray-50 rounded">
                <pre className="whitespace-pre-wrap">{notification.details}</pre>
              </div>
            </div>
          )}
          
          {notification.link && (
            <div className="mt-4">
              <a 
                href={notification.link} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded inline-block"
              >
                View Related Item
              </a>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default NotificationPage;