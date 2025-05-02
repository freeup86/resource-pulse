// notificationService.js
const { poolPromise, sql } = require('../db/config');
const nodemailer = require('nodemailer');

// Initialize email transport
let emailTransporter = null;

/**
 * Initialize the notification service
 */
const initializeService = async () => {
  try {
    const pool = await poolPromise;
    
    // Get email configuration from system settings
    const emailSettingsResult = await pool.request()
      .query(`
        SELECT SettingKey, SettingValue 
        FROM SystemNotificationSettings
        WHERE SettingKey LIKE 'notification_email%'
      `);
    
    const emailSettings = {};
    emailSettingsResult.recordset.forEach(setting => {
      emailSettings[setting.SettingKey] = setting.SettingValue;
    });
    
    // For development, you can use ethereal.email for testing
    // In production, configure with your actual SMTP settings
    if (process.env.NODE_ENV === 'production') {
      emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    } else {
      // Create a test account for development
      const testAccount = await nodemailer.createTestAccount();
      emailTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      console.log('Notification service initialized with test email account:', testAccount.user);
    }
    
    console.log('Notification service initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize notification service:', error);
    return false;
  }
};

/**
 * Create a new notification
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} - Created notification
 */
const createNotification = async (notification) => {
  try {
    const pool = await poolPromise;
    
    // Check if notification type exists
    const typeResult = await pool.request()
      .input('typeName', sql.NVarChar, notification.type)
      .query(`
        SELECT NotificationTypeID 
        FROM NotificationTypes 
        WHERE Name = @typeName AND IsActive = 1
      `);
    
    if (typeResult.recordset.length === 0) {
      throw new Error(`Invalid notification type: ${notification.type}`);
    }
    
    const notificationTypeId = typeResult.recordset[0].NotificationTypeID;
    
    // Insert notification
    const result = await pool.request()
      .input('notificationTypeId', sql.Int, notificationTypeId)
      .input('userId', sql.Int, notification.userId)
      .input('title', sql.NVarChar, notification.title)
      .input('message', sql.NVarChar, notification.message)
      .input('relatedEntityType', sql.NVarChar, notification.relatedEntityType || null)
      .input('relatedEntityId', sql.Int, notification.relatedEntityId || null)
      .input('expiresAt', sql.DateTime2, notification.expiresAt || null)
      .query(`
        INSERT INTO Notifications (
          NotificationTypeID, UserID, Title, Message,
          RelatedEntityType, RelatedEntityID, ExpiresAt
        )
        OUTPUT INSERTED.NotificationID
        VALUES (
          @notificationTypeId, @userId, @title, @message,
          @relatedEntityType, @relatedEntityId, @expiresAt
        )
      `);
    
    const notificationId = result.recordset[0].NotificationID;
    
    // Check if the user has email notifications enabled for this type
    if (notification.userId) {
      const userSettingsResult = await pool.request()
        .input('userId', sql.Int, notification.userId)
        .input('notificationTypeId', sql.Int, notificationTypeId)
        .query(`
          SELECT IsEmailEnabled, Frequency
          FROM UserNotificationSettings
          WHERE UserID = @userId AND NotificationTypeID = @notificationTypeId
        `);
      
      let shouldSendEmail = true;
      let frequency = 'immediate';
      
      if (userSettingsResult.recordset.length > 0) {
        shouldSendEmail = userSettingsResult.recordset[0].IsEmailEnabled;
        frequency = userSettingsResult.recordset[0].Frequency;
      }
      
      // Only queue immediate emails now, scheduled emails will be handled by a cron job
      if (shouldSendEmail && frequency === 'immediate') {
        await queueEmail(notificationId, notification.userId, notification.title, notification.message);
      }
    }
    
    return { id: notificationId, ...notification };
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};

/**
 * Queue an email for sending
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 */
const queueEmail = async (notificationId, userId, subject, message) => {
  try {
    const pool = await poolPromise;
    
    // Get user email
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT Email
        FROM Resources  -- Using resources as users for now
        WHERE ResourceID = @userId
      `);
    
    if (userResult.recordset.length === 0 || !userResult.recordset[0].Email) {
      console.warn(`Cannot queue email for user ${userId}: Email not found`);
      return;
    }
    
    const email = userResult.recordset[0].Email;
    
    // Create HTML body
    const htmlBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${subject}</h2>
            </div>
            <div class="content">
              <p>${message}</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from Resource Pulse.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Create text body (fallback)
    const textBody = `${subject}\n\n${message}\n\nThis is an automated notification from Resource Pulse.`;
    
    // Queue email
    await pool.request()
      .input('notificationId', sql.Int, notificationId)
      .input('recipient', sql.NVarChar, email)
      .input('subject', sql.NVarChar, subject)
      .input('htmlBody', sql.NVarChar, htmlBody)
      .input('textBody', sql.NVarChar, textBody)
      .query(`
        INSERT INTO EmailQueue (
          NotificationID, Recipient, Subject, HtmlBody, TextBody
        )
        VALUES (
          @notificationId, @recipient, @subject, @htmlBody, @textBody
        )
      `);
    
    console.log(`Email queued for user ${userId} with notification ID ${notificationId}`);
  } catch (error) {
    console.error('Failed to queue email:', error);
    throw error;
  }
};

/**
 * Process email queue
 * @param {number} [limit=10] - Maximum number of emails to process
 */
const processEmailQueue = async (limit = 10) => {
  if (!emailTransporter) {
    console.warn('Email transporter not initialized');
    return;
  }
  
  try {
    const pool = await poolPromise;
    
    // Get pending emails
    const pendingEmailsResult = await pool.request()
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          EmailQueueID, Recipient, Subject, HtmlBody, TextBody
        FROM EmailQueue
        WHERE Status = 'pending' AND (RetryCount < 3 OR RetryCount IS NULL)
        ORDER BY CreatedAt ASC
      `);
    
    const pendingEmails = pendingEmailsResult.recordset;
    
    if (pendingEmails.length === 0) {
      return;
    }
    
    console.log(`Processing ${pendingEmails.length} pending emails`);
    
    // Get sender email from settings
    const senderSettingResult = await pool.request()
      .query(`
        SELECT SettingValue
        FROM SystemNotificationSettings
        WHERE SettingKey = 'notification_email_from'
      `);
    
    const fromEmail = senderSettingResult.recordset.length > 0 ? 
      senderSettingResult.recordset[0].SettingValue : 
      'notifications@resourcepulse.com';
    
    // Process each email
    for (const email of pendingEmails) {
      try {
        // Send email
        const info = await emailTransporter.sendMail({
          from: fromEmail,
          to: email.Recipient,
          subject: email.Subject,
          text: email.TextBody,
          html: email.HtmlBody
        });
        
        // Update status
        await pool.request()
          .input('emailId', sql.Int, email.EmailQueueID)
          .input('messageId', sql.NVarChar, info.messageId)
          .query(`
            UPDATE EmailQueue
            SET 
              Status = 'sent',
              SentAt = GETDATE(),
              LastAttemptAt = GETDATE()
            WHERE EmailQueueID = @emailId
          `);
        
        console.log(`Email sent: ${info.messageId}`);
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
      } catch (emailError) {
        // Update retry count and error message
        await pool.request()
          .input('emailId', sql.Int, email.EmailQueueID)
          .input('errorMessage', sql.NVarChar, emailError.message)
          .query(`
            UPDATE EmailQueue
            SET 
              Status = 'failed',
              RetryCount = ISNULL(RetryCount, 0) + 1,
              LastAttemptAt = GETDATE(),
              ErrorMessage = @errorMessage
            WHERE EmailQueueID = @emailId
          `);
        
        console.error(`Failed to send email ${email.EmailQueueID}:`, emailError);
      }
    }
  } catch (error) {
    console.error('Failed to process email queue:', error);
    throw error;
  }
};

/**
 * Create allocation change notification
 * @param {string} action - Create, update, or delete
 * @param {Object} allocation - Allocation data
 * @param {Object} resource - Resource data
 * @param {Object} project - Project data
 */
const notifyAllocationChange = async (action, allocation, resource, project) => {
  try {
    let type, title, message;
    
    switch (action) {
      case 'create':
        type = 'allocation_created';
        title = `New allocation: ${resource.name} to ${project.name}`;
        message = `${resource.name} has been allocated to ${project.name} from ${new Date(allocation.startDate).toLocaleDateString()} to ${new Date(allocation.endDate).toLocaleDateString()} at ${allocation.utilization}% utilization.`;
        break;
      case 'update':
        type = 'allocation_updated';
        title = `Updated allocation: ${resource.name} on ${project.name}`;
        message = `The allocation of ${resource.name} to ${project.name} has been updated. New dates: ${new Date(allocation.startDate).toLocaleDateString()} to ${new Date(allocation.endDate).toLocaleDateString()} at ${allocation.utilization}% utilization.`;
        break;
      case 'delete':
        type = 'allocation_deleted';
        title = `Removed allocation: ${resource.name} from ${project.name}`;
        message = `${resource.name} is no longer allocated to ${project.name}.`;
        break;
      default:
        throw new Error(`Invalid allocation action: ${action}`);
    }
    
    // Create notification for resource (if the resource has a user ID - for now resourceId = userId)
    await createNotification({
      type,
      userId: resource.id,
      title,
      message,
      relatedEntityType: 'allocation',
      relatedEntityId: allocation.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    // Could also create notification for project manager, team leads, etc.
  } catch (error) {
    console.error(`Failed to notify allocation ${action}:`, error);
    throw error;
  }
};

/**
 * Create deadline approaching notification
 * @param {Object} allocation - Allocation data
 * @param {Object} resource - Resource data
 * @param {Object} project - Project data
 * @param {number} daysRemaining - Days until deadline
 */
const notifyDeadlineApproaching = async (allocation, resource, project, daysRemaining) => {
  try {
    const title = `Allocation ending soon: ${project.name}`;
    const message = `Your allocation to ${project.name} will end in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. End date: ${new Date(allocation.endDate).toLocaleDateString()}.`;
    
    await createNotification({
      type: 'deadline_approaching',
      userId: resource.id,
      title,
      message,
      relatedEntityType: 'allocation',
      relatedEntityId: allocation.id,
      expiresAt: new Date(allocation.endDate)
    });
  } catch (error) {
    console.error('Failed to notify deadline approaching:', error);
    throw error;
  }
};

/**
 * Create capacity threshold alert
 * @param {Object} resource - Resource data
 * @param {number} utilization - Current utilization percentage
 * @param {number} threshold - Threshold percentage
 */
const notifyCapacityThreshold = async (resource, utilization, threshold) => {
  try {
    const title = 'Capacity threshold exceeded';
    const message = `${resource.name} is allocated at ${utilization}% utilization, which exceeds the ${threshold}% threshold.`;
    
    await createNotification({
      type: 'capacity_threshold',
      userId: resource.id, // Also notify resource manager
      title,
      message,
      relatedEntityType: 'resource',
      relatedEntityId: resource.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  } catch (error) {
    console.error('Failed to notify capacity threshold:', error);
    throw error;
  }
};

/**
 * Create resource conflict warning
 * @param {Object} resource - Resource data
 * @param {Array} conflictingAllocations - List of conflicting allocations
 * @param {number} totalUtilization - Total utilization percentage
 */
const notifyResourceConflict = async (resource, conflictingAllocations, totalUtilization) => {
  try {
    const title = 'Resource allocation conflict';
    
    let message = `${resource.name} has conflicting allocations that total ${totalUtilization}% utilization:\n`;
    
    conflictingAllocations.forEach(alloc => {
      message += `- ${alloc.projectName}: ${alloc.utilization}% from ${new Date(alloc.startDate).toLocaleDateString()} to ${new Date(alloc.endDate).toLocaleDateString()}\n`;
    });
    
    await createNotification({
      type: 'resource_conflict',
      userId: resource.id, // Also notify resource manager
      title,
      message,
      relatedEntityType: 'resource',
      relatedEntityId: resource.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  } catch (error) {
    console.error('Failed to notify resource conflict:', error);
    throw error;
  }
};

/**
 * Generate and send weekly resource status digest
 * @param {number} userId - User ID to send digest to
 */
const generateWeeklyDigest = async (userId) => {
  try {
    const pool = await poolPromise;
    
    // Get user's resource info
    const resourceResult = await pool.request()
      .input('resourceId', sql.Int, userId)
      .query(`
        SELECT Name, Role, Email
        FROM Resources
        WHERE ResourceID = @resourceId
      `);
    
    if (resourceResult.recordset.length === 0) {
      console.warn(`Resource not found for user ID ${userId}`);
      return;
    }
    
    const resource = resourceResult.recordset[0];
    
    // Get resource's current allocations
    const allocationsResult = await pool.request()
      .input('resourceId', sql.Int, userId)
      .query(`
        SELECT 
          a.AllocationID, a.StartDate, a.EndDate, a.Utilization,
          p.Name AS ProjectName
        FROM Allocations a
        JOIN Projects p ON a.ProjectID = p.ProjectID
        WHERE a.ResourceID = @resourceId
        AND a.EndDate >= GETDATE()
        ORDER BY a.EndDate ASC
      `);
    
    const allocations = allocationsResult.recordset;
    
    // Calculate total utilization
    let totalUtilization = 0;
    for (const allocation of allocations) {
      totalUtilization += allocation.Utilization;
    }
    
    // Get upcoming deadlines (within next 14 days)
    const upcomingDeadlines = allocations.filter(allocation => {
      const endDate = new Date(allocation.EndDate);
      const today = new Date();
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 14;
    });
    
    // Create digest message
    const title = 'Weekly Resource Status Digest';
    let message = `<h2>Weekly Status for ${resource.Name}</h2>`;
    
    message += `<p><strong>Current Utilization:</strong> ${totalUtilization}%</p>`;
    
    if (allocations.length > 0) {
      message += '<h3>Current Allocations</h3><ul>';
      for (const allocation of allocations) {
        message += `<li>${allocation.ProjectName}: ${allocation.Utilization}% (until ${new Date(allocation.EndDate).toLocaleDateString()})</li>`;
      }
      message += '</ul>';
    } else {
      message += '<p>You currently have no active allocations.</p>';
    }
    
    if (upcomingDeadlines.length > 0) {
      message += '<h3>Upcoming Deadlines</h3><ul>';
      for (const deadline of upcomingDeadlines) {
        const endDate = new Date(deadline.EndDate);
        const today = new Date();
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        message += `<li>${deadline.ProjectName}: Ending in ${diffDays} day${diffDays !== 1 ? 's' : ''} (${new Date(deadline.EndDate).toLocaleDateString()})</li>`;
      }
      message += '</ul>';
    }
    
    // Create notification with the digest
    const notificationResult = await createNotification({
      type: 'weekly_digest',
      userId,
      title,
      message,
      relatedEntityType: 'resource',
      relatedEntityId: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    // Queue email directly (bypass settings check since this is a digest)
    if (resource.Email) {
      await queueEmail(notificationResult.id, userId, title, message);
    }
    
    return notificationResult;
  } catch (error) {
    console.error('Failed to generate weekly digest:', error);
    throw error;
  }
};

module.exports = {
  initializeService,
  createNotification,
  processEmailQueue,
  notifyAllocationChange,
  notifyDeadlineApproaching,
  notifyCapacityThreshold,
  notifyResourceConflict,
  generateWeeklyDigest
};