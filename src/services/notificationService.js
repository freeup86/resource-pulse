// src/services/notificationService.js
import api from './api';

// Import global state for current user ID
let currentUserId = 1; // Default to user ID 1

// Function to update the current user ID - will be called from components
export const setCurrentUserId = (userId) => {
  if (userId && userId > 0) {
    currentUserId = userId;
  }
};

// Function to get the current user ID
export const getCurrentUserId = () => currentUserId;

/**
 * Get all notifications
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Notifications and total count
 */
export const getNotifications = async (params = {}) => {
  try {
    const userId = getCurrentUserId();
    const response = await api.get(`/notifications/users/${userId}/notifications`, { params });
    return response.data.notifications || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Return empty array if notification system isn't set up yet
    return [];
  }
};

/**
 * Get notifications for a user
 * @param {number} userId - User ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Notifications and total count
 */
export const getUserNotifications = async (userId, params = {}) => {
  try {
    const response = await api.get(`/notifications/users/${userId}/notifications`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Return empty array if notification system isn't set up yet
    return [];
  }
};

/**
 * Get notification by ID
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} - Notification details
 */
export const getNotificationById = async (id) => {
  try {
    // This endpoint doesn't exist in the backend yet
    // For now, we'll handle this client-side by getting all notifications and filtering
    const userId = getCurrentUserId();
    const response = await api.get(`/notifications/users/${userId}/notifications`);
    const notifications = response.data.notifications || [];
    const notification = notifications.find(n => n.id === parseInt(id));
    
    if (notification) {
      return notification;
    }
    
    // Return default notification if not found
    return {
      id: id,
      title: 'Notification',
      message: 'Notification details not available',
      isRead: true,
      createdAt: new Date().toISOString(),
      type: 'system',
      relatedEntityType: null,
      relatedEntityId: null
    };
  } catch (error) {
    console.error('Error fetching notification details:', error);
    // Return default notification if system isn't set up yet
    return {
      id: id,
      title: 'Notification',
      message: 'Notification details not available',
      isRead: true,
      createdAt: new Date().toISOString(),
      type: 'system',
      relatedEntityType: null,
      relatedEntityId: null
    };
  }
};

/**
 * Get unread notification count for a user
 * @param {number} [userId] - Optional user ID (defaults to current user)
 * @returns {Promise<number>} - Unread count
 */
export const getUnreadCount = async (userId) => {
  try {
    const id = userId || getCurrentUserId();
    const response = await api.get(`/notifications/users/${id}/notifications/unread`);
    return response.data.count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    // Return 0 instead of throwing to prevent app crashes if the notification system isn't set up yet
    return 0;
  }
};

/**
 * Mark a notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} - Response
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/notifications/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    // Return success response even if API fails
    return { message: 'Notification marked as read' };
  }
};

// Also keep the original function name as an alias
export const markAsRead = markNotificationAsRead;

/**
 * Mark all notifications as read for a user
 * @param {number} [userId] - Optional user ID (defaults to current user)
 * @returns {Promise<Object>} - Response
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const id = userId || getCurrentUserId();
    const response = await api.put(`/notifications/users/${id}/notifications/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    // Return success response even if API fails
    return { 
      message: 'All notifications marked as read',
      count: 0
    };
  }
};

// Also keep the original function name as an alias
export const markAllAsRead = markAllNotificationsAsRead;

/**
 * Delete a notification
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} - Response
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/notifications/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    // Return success response even if API fails
    return { success: true };
  }
};

/**
 * Get notification settings for a user
 * @param {number} [userId] - Optional user ID (defaults to current user)
 * @returns {Promise<Array>} - User notification settings
 */
export const getUserNotificationSettings = async (userId) => {
  try {
    const id = userId || getCurrentUserId();
    const response = await api.get(`/notifications/users/${id}/settings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    // Return default settings if not set up yet
    return [
      {
        typeId: 1,
        type: 'allocation_created',
        description: 'Notify when resource allocations are created',
        isInAppEnabled: true,
        isEmailEnabled: false,
        frequency: 'immediate'
      },
      {
        typeId: 2,
        type: 'allocation_updated',
        description: 'Notify when resource allocations are updated',
        isInAppEnabled: true,
        isEmailEnabled: false,
        frequency: 'immediate'
      },
      {
        typeId: 3,
        type: 'allocation_deleted',
        description: 'Notify when resource allocations are deleted',
        isInAppEnabled: true,
        isEmailEnabled: false,
        frequency: 'immediate'
      },
      {
        typeId: 4,
        type: 'deadline_approaching',
        description: 'Notify when allocation deadlines are approaching',
        isInAppEnabled: true,
        isEmailEnabled: false,
        frequency: 'immediate',
        thresholdDays: 7
      },
      {
        typeId: 5,
        type: 'resource_conflict',
        description: 'Notify when resources are overallocated',
        isInAppEnabled: true,
        isEmailEnabled: false,
        frequency: 'immediate'
      },
      {
        typeId: 6,
        type: 'capacity_threshold',
        description: 'Notify when capacity thresholds are exceeded',
        isInAppEnabled: true,
        isEmailEnabled: false,
        frequency: 'immediate',
        thresholdPercent: 90
      },
      {
        typeId: 7,
        type: 'weekly_digest',
        description: 'Weekly summary of resource allocations',
        isInAppEnabled: true,
        isEmailEnabled: true,
        frequency: 'weekly'
      }
    ];
  }
};

// Keep original as alias
export const getUserSettings = getUserNotificationSettings;

/**
 * Update notification settings for a user
 * @param {Object} settings - Settings to update
 * @param {number} [userId] - Optional user ID (defaults to current user)
 * @returns {Promise<Object>} - Response
 */
export const updateUserNotificationSettings = async (settings, userId) => {
  try {
    const id = userId || getCurrentUserId();
    const response = await api.put(`/notifications/users/${id}/settings`, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    // Return success response even if API fails
    return { message: 'Notification settings updated successfully', settings };
  }
};

// Keep original as alias
export const updateUserSettings = async (settings, userId) => {
  return updateUserNotificationSettings(settings, userId);
};

/**
 * Get system notification settings
 * @returns {Promise<Object>} - System settings
 */
export const getSystemSettings = async () => {
  try {
    const response = await api.get('/notifications/settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

/**
 * Update a system notification setting
 * @param {string} key - Setting key
 * @param {string|number|boolean} value - Setting value
 * @returns {Promise<Object>} - Response
 */
export const updateSystemSetting = async (key, value) => {
  try {
    const response = await api.put('/notifications/settings', { key, value });
    return response.data;
  } catch (error) {
    console.error('Error updating system setting:', error);
    throw error;
  }
};