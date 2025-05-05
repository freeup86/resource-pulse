// notificationService.js
const { poolPromise, sql } = require('../db/config');
const nodemailer = require('nodemailer');
const Anthropic = require('@anthropic-ai/sdk');
const aiTelemetry = require('./aiTelemetry');
require('dotenv').config();

// Get API key from environment variables
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Initialize Claude client
const claude = CLAUDE_API_KEY ? new Anthropic({
  apiKey: CLAUDE_API_KEY,
}) : null;

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
      try {
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
        console.log(`Ethereal email web interface: https://ethereal.email/login`);
        console.log(`Username: ${testAccount.user}`);
        console.log(`Password: ${testAccount.pass}`);
      } catch (emailError) {
        console.error('Failed to create test email account:', emailError);
        
        // Create a fallback email transporter that logs emails instead of sending them
        emailTransporter = {
          sendMail: async (mail) => {
            console.log('-----------------------------');
            console.log('Email would have been sent:');
            console.log('From:', mail.from);
            console.log('To:', mail.to);
            console.log('Subject:', mail.subject);
            console.log('Text:', mail.text);
            console.log('-----------------------------');
            
            // Return a mock successful response
            return { 
              messageId: `mock-${Date.now()}@resourcepulse.com`,
              response: '250 Message accepted'
            };
          }
        };
        
        console.log('Using fallback email transport that logs emails to console');
      }
    }
    
    // Verify email transporter connection
    if (emailTransporter.verify) {
      try {
        await emailTransporter.verify();
        console.log('SMTP connection verified successfully');
      } catch (verifyError) {
        console.error('SMTP connection verification failed:', verifyError);
      }
    }
    
    // Create MessageId column if it doesn't exist
    try {
      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'EmailQueue' AND COLUMN_NAME = 'MessageId'
        )
        BEGIN
          ALTER TABLE EmailQueue ADD MessageId NVARCHAR(255) NULL;
          PRINT 'Added MessageId column to EmailQueue table';
        END
      `);
    } catch (alterError) {
      console.error('Error checking/adding MessageId column:', alterError);
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
 * @returns {Promise<boolean>} - Success status
 */
const queueEmail = async (notificationId, userId, subject, message) => {
  try {
    const pool = await poolPromise;
    
    // Verify EmailQueue table exists
    try {
      await pool.request().query(`SELECT TOP 1 * FROM EmailQueue`);
    } catch (tableError) {
      console.error('EmailQueue table does not exist or is not accessible:', tableError.message);
      return false;
    }
    
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
      return false;
    }
    
    const email = userResult.recordset[0].Email;
    
    // Validate email
    if (!validateEmail(email)) {
      console.warn(`Invalid email address for user ${userId}: ${email}`);
      return false;
    }
    
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
          NotificationID, Recipient, Subject, HtmlBody, TextBody, Status, CreatedAt
        )
        VALUES (
          @notificationId, @recipient, @subject, @htmlBody, @textBody, 'pending', GETDATE()
        )
      `);
    
    console.log(`Email queued for user ${userId} with notification ID ${notificationId}`);
    return true;
  } catch (error) {
    console.error('Failed to queue email:', error);
    // Don't throw, just return false to indicate failure
    return false;
  }
};

/**
 * Process email queue
 * @param {number} [limit=10] - Maximum number of emails to process
 */
const processEmailQueue = async (limit = 10) => {
  if (!emailTransporter) {
    console.warn('Email transporter not initialized - attempting to initialize now');
    const success = await initializeService();
    if (!success || !emailTransporter) {
      console.error('Failed to initialize email transporter');
      return;
    }
  }
  
  try {
    const pool = await poolPromise;
    
    // Verify EmailQueue table exists
    try {
      await pool.request().query(`SELECT TOP 1 * FROM EmailQueue`);
    } catch (tableError) {
      console.error('EmailQueue table does not exist or is not accessible:', tableError.message);
      return;
    }
    
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
      console.log('No pending emails to process');
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
        // Validate email before attempting to send
        if (!email.Recipient || !validateEmail(email.Recipient)) {
          console.error(`Invalid recipient email address: ${email.Recipient}`);
          await updateEmailStatus(pool, email.EmailQueueID, 'failed', 'Invalid recipient email address');
          continue;
        }
        
        // Send email
        const info = await emailTransporter.sendMail({
          from: fromEmail,
          to: email.Recipient,
          subject: email.Subject,
          text: email.TextBody,
          html: email.HtmlBody
        });
        
        // Update status
        await updateEmailStatus(pool, email.EmailQueueID, 'sent', null, info.messageId);
        
        console.log(`Email sent: ${info.messageId}`);
        if (process.env.NODE_ENV !== 'production' && info.messageUrl) {
          console.log(`Preview URL: ${info.messageUrl}`);
        }
      } catch (emailError) {
        console.error(`Failed to send email ${email.EmailQueueID}:`, emailError);
        await updateEmailStatus(pool, email.EmailQueueID, 'failed', emailError.message);
      }
    }
  } catch (error) {
    console.error('Failed to process email queue:', error);
    // Don't throw the error - just log it
  }
};

/**
 * Helper function to update email status
 */
const updateEmailStatus = async (pool, emailId, status, errorMessage = null, messageId = null) => {
  try {
    const request = pool.request()
      .input('emailId', sql.Int, emailId)
      .input('status', sql.NVarChar, status)
      .input('lastAttemptAt', sql.DateTime2, new Date());
    
    if (status === 'sent') {
      request.input('messageId', sql.NVarChar, messageId)
        .input('sentAt', sql.DateTime2, new Date())
        .query(`
          UPDATE EmailQueue
          SET 
            Status = @status,
            SentAt = @sentAt,
            LastAttemptAt = @lastAttemptAt,
            MessageId = @messageId
          WHERE EmailQueueID = @emailId
        `);
    } else if (status === 'failed') {
      request.input('errorMessage', sql.NVarChar, errorMessage)
        .query(`
          UPDATE EmailQueue
          SET 
            Status = @status,
            RetryCount = ISNULL(RetryCount, 0) + 1,
            LastAttemptAt = @lastAttemptAt,
            ErrorMessage = @errorMessage
          WHERE EmailQueueID = @emailId
        `);
    }
  } catch (error) {
    console.error(`Failed to update email status (ID: ${emailId}):`, error);
  }
};

/**
 * Helper function to validate email
 */
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
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

/**
 * Prioritize notifications using AI
 * @param {Array} notifications - List of notifications to prioritize
 * @param {Object} userContext - User context for personalization
 * @returns {Promise<Array>} - Prioritized notifications
 */
const prioritizeNotifications = async (notifications, userContext = {}) => {
  // Skip AI prioritization if no Claude API key
  if (!CLAUDE_API_KEY || !claude) {
    console.warn('Claude API key not configured. Skipping AI prioritization of notifications.');
    // Use simple default prioritization
    return prioritizeNotificationsDefault(notifications);
  }
  
  try {
    // Skip for very small sets
    if (notifications.length <= 1) {
      return notifications;
    }
    
    // Create prompt for Claude
    const prompt = `
<instructions>
You are an intelligent notification prioritization system. Given a list of notifications, you need to:
1. Analyze each notification's content, type, and context
2. Prioritize them based on urgency, importance, and relevance to the user
3. Return the notifications ordered by priority, with a calculated priorityScore (0.0-1.0)
4. For each notification, add a "suggestedAction" field with a brief sentence of what action the user should take

The prioritization should consider:
- Deadlines proximity (more urgent = higher priority)
- Resource utilization issues (over-allocation = high priority)
- Project status changes (critical changes = high priority)
- User role and responsibilities (match notifications to responsibilities)
- Notification age (newer generally more relevant, unless deadline-sensitive)

Return only a JSON array with the prioritized notifications.
Each object should have all original fields plus:
- priorityScore: number between 0 and 1
- priorityReason: brief explanation of why this priority was assigned
- suggestedAction: recommended next step for the user
</instructions>

<user_context>
User ID: ${userContext.userId || 'Unknown'}
User Role: ${userContext.role || 'Resource Manager'}
User Notifications Preferences: ${userContext.preferences || 'All notification types'}
</user_context>

<notifications>
${JSON.stringify(notifications, null, 2)}
</notifications>
`;

    // Make API request
    const response = await claude.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    // Process and parse response
    const responseText = response.content[0].text.trim();
    try {
      const prioritizedNotifications = JSON.parse(responseText);
      
      // Sort by priority score if available
      prioritizedNotifications.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
      
      return prioritizedNotifications;
    } catch (parseError) {
      console.error('Error parsing AI prioritization response:', parseError);
      // Fall back to default prioritization
      return prioritizeNotificationsDefault(notifications);
    }
  } catch (error) {
    console.error('Error prioritizing notifications with AI:', error);
    // Fall back to default prioritization
    return prioritizeNotificationsDefault(notifications);
  }
};

/**
 * Default notification prioritization without AI
 * @param {Array} notifications - List of notifications to prioritize
 * @returns {Array} - Prioritized notifications
 */
const prioritizeNotificationsDefault = (notifications) => {
  // Simple priority rules
  const typePriority = {
    'resource_conflict': 5,        // Highest priority
    'capacity_threshold': 4,
    'deadline_approaching': 3,
    'allocation_updated': 2,
    'allocation_created': 1,
    'allocation_deleted': 1,
    'weekly_digest': 0             // Lowest priority
  };
  
  // Sort by type priority and then by date (newer first)
  return notifications.sort((a, b) => {
    const priorityA = typePriority[a.type] || 0;
    const priorityB = typePriority[b.type] || 0;
    
    if (priorityB !== priorityA) {
      return priorityB - priorityA;
    }
    
    // If same priority, sort by date (newer first)
    const dateA = new Date(a.createdAt || a.created_at || Date.now());
    const dateB = new Date(b.createdAt || b.created_at || Date.now());
    return dateB - dateA;
  }).map(notification => ({
    ...notification,
    priorityScore: (typePriority[notification.type] || 0) / 5, // Normalized to 0-1
    priorityReason: `Based on notification type: ${notification.type}`,
    suggestedAction: generateDefaultSuggestedAction(notification)
  }));
};

/**
 * Generate default suggested action for a notification
 * @param {Object} notification - Notification object
 * @returns {string} - Suggested action
 */
const generateDefaultSuggestedAction = (notification) => {
  switch (notification.type) {
    case 'resource_conflict':
      return 'Review and resolve the allocation conflict.';
    case 'capacity_threshold':
      return 'Adjust resource allocation to reduce overallocation.';
    case 'deadline_approaching':
      return 'Verify if the allocation needs to be extended.';
    case 'allocation_updated':
      return 'Review the updated allocation details.';
    case 'allocation_created':
      return 'Confirm the new allocation details.';
    case 'allocation_deleted':
      return 'Verify if the resource needs reallocation.';
    case 'weekly_digest':
      return 'Review your resource status and upcoming deadlines.';
    default:
      return 'Review this notification.';
  }
};

/**
 * Generate action suggestion for a notification using AI
 * @param {Object} notification - Notification to generate suggestion for
 * @param {Object} userContext - User context for personalization
 * @returns {Promise<Object>} - Notification with suggested action
 */
const generateActionSuggestion = async (notification, userContext = {}) => {
  // Skip AI suggestion if no Claude API key
  if (!CLAUDE_API_KEY || !claude) {
    console.warn('Claude API key not configured. Using default action suggestion.');
    return {
      ...notification,
      suggestedAction: generateDefaultSuggestedAction(notification)
    };
  }
  
  try {
    // Create prompt for Claude
    const prompt = `
<instructions>
You are an intelligent notification system assistant. Given a notification from a resource management system, you need to:
1. Analyze the notification content and type
2. Generate a concise, actionable suggestion for what the user should do next
3. Ensure the suggestion is specific and helpful
4. Return ONLY the suggested action text (1-2 sentences maximum)

The suggested action should:
- Be direct and start with a verb
- Be specific to the notification content
- Provide clear next steps
- Be concise (maximum 15 words if possible)
</instructions>

<notification>
${JSON.stringify(notification, null, 2)}
</notification>

<user_context>
User ID: ${userContext.userId || 'Unknown'}
User Role: ${userContext.role || 'Resource Manager'}
</user_context>
`;

    // Make API request
    const response = await claude.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 200,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    // Extract suggestion
    const suggestedAction = response.content[0].text.trim();
    
    return {
      ...notification,
      suggestedAction
    };
  } catch (error) {
    console.error('Error generating action suggestion with AI:', error);
    // Fall back to default suggestion
    return {
      ...notification,
      suggestedAction: generateDefaultSuggestedAction(notification)
    };
  }
};

/**
 * Get user's notifications with prioritization
 * @param {number} userId - User ID
 * @param {Object} options - Options for filtering
 * @returns {Promise<Array>} - Prioritized notifications
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const pool = await poolPromise;
    const { limit = 50, includeRead = false, prioritize = true } = options;
    
    // Get user info for context
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT Role
        FROM Resources
        WHERE ResourceID = @userId
      `);
    
    const userRole = userResult.recordset.length > 0 ? userResult.recordset[0].Role : 'Resource';
    
    // Get user's notifications
    let query = `
      SELECT 
        n.NotificationID,
        n.NotificationTypeID,
        nt.Name as Type,
        n.Title,
        n.Message,
        n.RelatedEntityType,
        n.RelatedEntityID,
        n.IsRead,
        n.CreatedAt,
        n.ExpiresAt
      FROM Notifications n
      INNER JOIN NotificationTypes nt ON n.NotificationTypeID = nt.NotificationTypeID
      WHERE n.UserID = @userId
    `;
    
    if (!includeRead) {
      query += ` AND n.IsRead = 0`;
    }
    
    query += ` ORDER BY n.CreatedAt DESC`;
    
    if (limit > 0) {
      query += ` OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY`;
    }
    
    const notificationsResult = await pool.request()
      .input('userId', sql.Int, userId)
      .input('limit', sql.Int, limit)
      .query(query);
    
    let notifications = notificationsResult.recordset.map(notification => ({
      id: notification.NotificationID,
      type: notification.Type,
      title: notification.Title,
      message: notification.Message,
      relatedEntityType: notification.RelatedEntityType,
      relatedEntityId: notification.RelatedEntityID,
      isRead: notification.IsRead,
      createdAt: notification.CreatedAt,
      expiresAt: notification.ExpiresAt
    }));
    
    // Apply AI prioritization if requested
    if (prioritize && notifications.length > 0) {
      notifications = await prioritizeNotifications(notifications, { userId, role: userRole });
    }
    
    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
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
  generateWeeklyDigest,
  prioritizeNotifications,
  generateActionSuggestion,
  getUserNotifications
};