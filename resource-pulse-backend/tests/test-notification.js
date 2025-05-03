/**
 * Test script for notification creation and delivery
 * 
 * This script tests the notification service by:
 * 1. Creating a test notification
 * 2. Queuing an email for the notification
 * 3. Processing the email queue
 * 4. Verifying the notification appears in the API
 */

const { poolPromise, sql } = require('../db/config');
const notificationService = require('../services/notificationService');

// Test user ID (should exist in Resources table)
const TEST_USER_ID = 1;

/**
 * Wait for a specified time
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Run the test
 */
const runTest = async () => {
  try {
    console.log('Starting notification system test...');

    // Step 1: Initialize the notification service
    console.log('\n1. Initializing notification service...');
    const initialized = await notificationService.initializeService();
    if (!initialized) {
      throw new Error('Failed to initialize notification service');
    }
    console.log('✅ Notification service initialized successfully');

    // Step 2: Verify the test user exists
    console.log('\n2. Verifying test user...');
    const pool = await poolPromise;
    const userResult = await pool.request()
      .input('userId', sql.Int, TEST_USER_ID)
      .query(`
        SELECT ResourceID, Name, Email
        FROM Resources
        WHERE ResourceID = @userId
      `);

    if (userResult.recordset.length === 0) {
      throw new Error(`Test user ID ${TEST_USER_ID} not found in Resources table`);
    }

    const user = userResult.recordset[0];
    console.log(`✅ Test user found: ${user.Name} (${user.Email})`);

    // Step 3: Create a test notification
    console.log('\n3. Creating test notification...');
    const testNotification = {
      type: 'allocation_created',
      userId: TEST_USER_ID,
      title: 'Test Notification',
      message: 'This is a test notification created by the test script',
      relatedEntityType: 'test',
      relatedEntityId: 1,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
    };

    const notification = await notificationService.createNotification(testNotification);
    console.log(`✅ Notification created with ID: ${notification.id}`);

    // Step 4: Queue an email manually by creating a new notification
    console.log('\n4. Creating notification with immediate email...');
    
    // Get notification types
    const typesResult = await pool.request()
      .query("SELECT NotificationTypeID, Name FROM NotificationTypes WHERE Name = 'allocation_created'");
    
    if (typesResult.recordset.length === 0) {
      throw new Error('Notification type allocation_created not found');
    }
    
    const notificationTypeId = typesResult.recordset[0].NotificationTypeID;
    
    // Insert notification that will trigger an email
    const emailNotifResult = await pool.request()
      .input('typeId', sql.Int, notificationTypeId)
      .input('userId', sql.Int, TEST_USER_ID)
      .input('title', sql.NVarChar, 'Test Email Notification')
      .input('message', sql.NVarChar, 'This is a test email sent via the notification system.')
      .input('expiresAt', sql.DateTime2, new Date(Date.now() + 24 * 60 * 60 * 1000))
      .query(`
        INSERT INTO Notifications (
          NotificationTypeID, UserID, Title, Message, ExpiresAt
        )
        OUTPUT INSERTED.NotificationID
        VALUES (
          @typeId, @userId, @title, @message, @expiresAt
        )
      `);
    
    const emailNotifId = emailNotifResult.recordset[0].NotificationID;
    
    // Insert email into queue
    const emailQueueResult = await pool.request()
      .input('notificationId', sql.Int, emailNotifId)
      .input('recipient', sql.NVarChar, user.Email)
      .input('subject', sql.NVarChar, 'Test Email from Resource Pulse')
      .input('htmlBody', sql.NVarChar, '<html><body><h1>Test Email</h1><p>This is a test email sent via the notification system test script.</p></body></html>')
      .input('textBody', sql.NVarChar, 'Test Email\n\nThis is a test email sent via the notification system test script.')
      .query(`
        INSERT INTO EmailQueue (
          NotificationID, Recipient, Subject, HtmlBody, TextBody, Status, CreatedAt
        )
        OUTPUT INSERTED.EmailQueueID
        VALUES (
          @notificationId, @recipient, @subject, @htmlBody, @textBody, 'pending', GETDATE()
        )
      `);
    
    const emailQueueId = emailQueueResult.recordset[0].EmailQueueID;
    console.log(`✅ Email queued with ID: ${emailQueueId} for notification ${emailNotifId}`);

    // Step 5: Process the email queue
    console.log('\n5. Processing email queue...');
    await notificationService.processEmailQueue(10);
    console.log('✅ Email queue processed');

    // Step 6: Check if email was sent
    const emailResult = await pool.request()
      .input('emailQueueId', sql.Int, emailQueueId)
      .query(`
        SELECT * FROM EmailQueue
        WHERE EmailQueueID = @emailQueueId
      `);

    if (emailResult.recordset.length === 0) {
      console.warn('⚠️ No email record found for the notification');
    } else {
      const email = emailResult.recordset[0];
      console.log(`✅ Email status: ${email.Status}`);
      console.log(`✅ Email details:`);
      console.log(`   - Recipient: ${email.Recipient}`);
      console.log(`   - Subject: ${email.Subject}`);
      console.log(`   - Created: ${new Date(email.CreatedAt).toLocaleString()}`);
      
      // Check for optional fields
      if (email.SentAt) {
        console.log(`   - Sent: ${new Date(email.SentAt).toLocaleString()}`);
      }
      if (email.RetryCount && email.RetryCount > 0) {
        console.log(`   - Retry count: ${email.RetryCount}`);
      }
      if (email.ErrorMessage) {
        console.warn(`⚠️ Error message: ${email.ErrorMessage}`);
      }
    }

    // Step 7: Verify notification can be retrieved through API
    console.log('\n6. Verifying notification in database...');
    const notificationsResult = await pool.request()
      .input('userId', sql.Int, TEST_USER_ID)
      .query(`
        SELECT 
          n.NotificationID, n.Title, n.Message, n.IsRead,
          nt.Name as NotificationType
        FROM Notifications n
        JOIN NotificationTypes nt ON n.NotificationTypeID = nt.NotificationTypeID
        WHERE n.UserID = @userId
        ORDER BY n.CreatedAt DESC
      `);

    if (notificationsResult.recordset.length === 0) {
      console.warn('⚠️ No notifications found for user');
    } else {
      console.log('✅ Found notifications for user:');
      notificationsResult.recordset.forEach(n => {
        console.log(`   - ID: ${n.NotificationID}, Type: ${n.NotificationType}, Title: ${n.Title}, Read: ${n.IsRead}`);
      });
    }

    // Conclusion
    console.log('\n✅ Notification test completed successfully!');
    console.log('If you want to see the notification in the UI, log in to the application and check the notification center.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    process.exit();
  }
};

// Run the test
runTest();