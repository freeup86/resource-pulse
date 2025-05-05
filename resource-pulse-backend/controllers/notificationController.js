// notificationController.js
const { poolPromise, sql } = require('../db/config');
const notificationService = require('../services/notificationService');

/**
 * Get notifications for a user with AI prioritization
 */
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0, unreadOnly = false, prioritize = 'true' } = req.query;
    
    // Use enhanced service method with AI prioritization
    if (prioritize === 'true') {
      const notifications = await notificationService.getUserNotifications(
        parseInt(userId),
        {
          limit: parseInt(limit),
          includeRead: unreadOnly !== 'true',
          prioritize: true
        }
      );
      
      // Get total count for pagination (simple count, no prioritization)
      const pool = await poolPromise;
      const countResult = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT COUNT(*) as total
          FROM Notifications 
          WHERE UserID = @userId ${unreadOnly === 'true' ? 'AND IsRead = 0' : ''}
        `);
      
      res.json({
        notifications,
        total: countResult.recordset[0].total
      });
      return;
    }
    
    // Fall back to original database query if prioritization is disabled
    const pool = await poolPromise;
    
    // Build query with optional unread filter
    let query = `
      SELECT 
        n.NotificationID as id,
        nt.Name as type,
        n.Title as title,
        n.Message as message,
        n.RelatedEntityType as relatedEntityType,
        n.RelatedEntityID as relatedEntityId,
        n.IsRead as isRead,
        n.CreatedAt as createdAt
      FROM Notifications n
      JOIN NotificationTypes nt ON n.NotificationTypeID = nt.NotificationTypeID
      WHERE n.UserID = @userId
    `;
    
    if (unreadOnly === 'true') {
      query += ' AND n.IsRead = 0';
    }
    
    query += `
      ORDER BY n.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('offset', sql.Int, parseInt(offset))
      .input('limit', sql.Int, parseInt(limit))
      .query(query);
    
    // Get total count for pagination
    const countResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) as total
        FROM Notifications 
        WHERE UserID = @userId ${unreadOnly === 'true' ? 'AND IsRead = 0' : ''}
      `);
    
    res.json({
      notifications: result.recordset,
      total: countResult.recordset[0].total
    });
  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({
      message: 'Error retrieving notifications',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Get unread notification count for a user
 */
const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) as count
        FROM Notifications
        WHERE UserID = @userId AND IsRead = 0
      `);
    
    res.json({ count: result.recordset[0].count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      message: 'Error retrieving unread count',
      error: process.env.NODE_ENV === 'production' ? 'Database error' : error.message
    });
  }
};

/**
 * Mark a notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const pool = await poolPromise;
    
    await pool.request()
      .input('notificationId', sql.Int, notificationId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1
        WHERE NotificationID = @notificationId
      `);
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      message: 'Error updating notification',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1
        WHERE UserID = @userId AND IsRead = 0
      `);
    
    res.json({ 
      message: 'All notifications marked as read',
      count: result.rowsAffected[0]
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      message: 'Error updating notifications',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Get user notification settings
 */
const getUserSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const pool = await poolPromise;
    
    // Get notification types with user settings
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          nt.NotificationTypeID as typeId,
          nt.Name as type,
          nt.Description as description,
          ISNULL(uns.IsEmailEnabled, 1) as isEmailEnabled,
          ISNULL(uns.IsInAppEnabled, 1) as isInAppEnabled,
          ISNULL(uns.Frequency, 'immediate') as frequency,
          uns.ThresholdDays as thresholdDays,
          uns.ThresholdPercent as thresholdPercent
        FROM NotificationTypes nt
        LEFT JOIN UserNotificationSettings uns 
          ON nt.NotificationTypeID = uns.NotificationTypeID 
          AND uns.UserID = @userId
        WHERE nt.IsActive = 1
        ORDER BY nt.Name
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting user notification settings:', error);
    res.status(500).json({
      message: 'Error retrieving notification settings',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Update user notification settings
 */
const updateUserSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { typeId, isEmailEnabled, isInAppEnabled, frequency, thresholdDays, thresholdPercent } = req.body;
    
    if (!typeId) {
      return res.status(400).json({ message: 'Notification type ID is required' });
    }
    
    const pool = await poolPromise;
    
    // Check if settings already exist for this user and type
    const existingResult = await pool.request()
      .input('userId', sql.Int, userId)
      .input('typeId', sql.Int, typeId)
      .query(`
        SELECT SettingID
        FROM UserNotificationSettings
        WHERE UserID = @userId AND NotificationTypeID = @typeId
      `);
    
    if (existingResult.recordset.length > 0) {
      // Update existing settings
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('typeId', sql.Int, typeId)
        .input('isEmailEnabled', sql.Bit, isEmailEnabled !== undefined ? isEmailEnabled : 1)
        .input('isInAppEnabled', sql.Bit, isInAppEnabled !== undefined ? isInAppEnabled : 1)
        .input('frequency', sql.NVarChar, frequency || 'immediate')
        .input('thresholdDays', sql.Int, thresholdDays || null)
        .input('thresholdPercent', sql.Int, thresholdPercent || null)
        .query(`
          UPDATE UserNotificationSettings
          SET 
            IsEmailEnabled = @isEmailEnabled,
            IsInAppEnabled = @isInAppEnabled,
            Frequency = @frequency,
            ThresholdDays = @thresholdDays,
            ThresholdPercent = @thresholdPercent,
            UpdatedAt = GETDATE()
          WHERE UserID = @userId AND NotificationTypeID = @typeId
        `);
    } else {
      // Create new settings
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('typeId', sql.Int, typeId)
        .input('isEmailEnabled', sql.Bit, isEmailEnabled !== undefined ? isEmailEnabled : 1)
        .input('isInAppEnabled', sql.Bit, isInAppEnabled !== undefined ? isInAppEnabled : 1)
        .input('frequency', sql.NVarChar, frequency || 'immediate')
        .input('thresholdDays', sql.Int, thresholdDays || null)
        .input('thresholdPercent', sql.Int, thresholdPercent || null)
        .query(`
          INSERT INTO UserNotificationSettings (
            UserID, NotificationTypeID, IsEmailEnabled, IsInAppEnabled,
            Frequency, ThresholdDays, ThresholdPercent
          )
          VALUES (
            @userId, @typeId, @isEmailEnabled, @isInAppEnabled,
            @frequency, @thresholdDays, @thresholdPercent
          )
        `);
    }
    
    res.json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Error updating user notification settings:', error);
    res.status(500).json({
      message: 'Error updating notification settings',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Get system notification settings
 */
const getSystemSettings = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .query(`
        SELECT 
          SettingKey as key,
          SettingValue as value,
          Description as description
        FROM SystemNotificationSettings
        ORDER BY SettingKey
      `);
    
    // Convert to object with key-value pairs
    const settings = {};
    result.recordset.forEach(setting => {
      settings[setting.key] = {
        value: setting.value,
        description: setting.description
      };
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error getting system notification settings:', error);
    res.status(500).json({
      message: 'Error retrieving system settings',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Update system notification settings
 */
const updateSystemSettings = async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ message: 'Key and value are required' });
    }
    
    const pool = await poolPromise;
    
    // Check if setting exists
    const existingResult = await pool.request()
      .input('key', sql.NVarChar, key)
      .query(`
        SELECT SettingKey
        FROM SystemNotificationSettings
        WHERE SettingKey = @key
      `);
    
    if (existingResult.recordset.length === 0) {
      return res.status(404).json({ message: `Setting with key '${key}' not found` });
    }
    
    // Update setting
    await pool.request()
      .input('key', sql.NVarChar, key)
      .input('value', sql.NVarChar, value.toString())
      .query(`
        UPDATE SystemNotificationSettings
        SET SettingValue = @value, UpdatedAt = GETDATE()
        WHERE SettingKey = @key
      `);
    
    res.json({ message: 'System setting updated successfully' });
  } catch (error) {
    console.error('Error updating system notification setting:', error);
    res.status(500).json({
      message: 'Error updating system setting',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Manually trigger a weekly digest for testing
 */
const triggerWeeklyDigest = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await notificationService.generateWeeklyDigest(parseInt(userId));
    
    res.json({ 
      message: 'Weekly digest triggered successfully',
      notification: result
    });
  } catch (error) {
    console.error('Error triggering weekly digest:', error);
    res.status(500).json({
      message: 'Error generating digest',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Manually process email queue for testing
 */
const processEmailQueue = async (req, res) => {
  try {
    const { limit } = req.query;
    
    await notificationService.processEmailQueue(parseInt(limit) || 10);
    
    res.json({ message: 'Email queue processing triggered' });
  } catch (error) {
    console.error('Error processing email queue:', error);
    res.status(500).json({
      message: 'Error processing emails',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Generate action suggestion for a notification
 */
const getActionSuggestion = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    // Get notification details
    const pool = await poolPromise;
    const notificationResult = await pool.request()
      .input('notificationId', sql.Int, notificationId)
      .query(`
        SELECT 
          n.NotificationID as id,
          nt.Name as type,
          n.Title as title,
          n.Message as message,
          n.RelatedEntityType as relatedEntityType,
          n.RelatedEntityID as relatedEntityId,
          n.UserID as userId
        FROM Notifications n
        JOIN NotificationTypes nt ON n.NotificationTypeID = nt.NotificationTypeID
        WHERE n.NotificationID = @notificationId
      `);
    
    if (notificationResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    const notification = notificationResult.recordset[0];
    
    // Get user role for context
    const userResult = await pool.request()
      .input('userId', sql.Int, notification.userId)
      .query(`
        SELECT Role
        FROM Resources
        WHERE ResourceID = @userId
      `);
    
    const userRole = userResult.recordset.length > 0 ? userResult.recordset[0].Role : 'Resource';
    
    // Generate AI action suggestion
    const enhancedNotification = await notificationService.generateActionSuggestion(
      notification,
      { userId: notification.userId, role: userRole }
    );
    
    res.json({
      suggestedAction: enhancedNotification.suggestedAction
    });
  } catch (error) {
    console.error('Error generating action suggestion:', error);
    res.status(500).json({
      message: 'Error generating action suggestion',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getUserSettings,
  updateUserSettings,
  getSystemSettings,
  updateSystemSettings,
  triggerWeeklyDigest,
  processEmailQueue,
  getActionSuggestion
};