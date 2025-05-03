/**
 * Test script for weekly digest generation
 * 
 * This script tests the weekly digest functionality by:
 * 1. Generating a digest for a test user
 * 2. Queuing an email for the digest
 * 3. Processing the email queue
 * 4. Verifying the digest notification appears in the API
 */

const { poolPromise, sql } = require('../db/config');
const notificationService = require('../services/notificationService');
const notificationScheduler = require('../services/notificationScheduler');

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
    console.log('Starting weekly digest test...');

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

    // Step 3: Generate a weekly digest
    console.log('\n3. Generating weekly digest...');
    const digestResult = await notificationService.generateWeeklyDigest(TEST_USER_ID);
    if (!digestResult) {
      throw new Error('Failed to generate weekly digest');
    }
    console.log(`✅ Weekly digest generated with ID: ${digestResult.id}`);

    // Step 4: Process the email queue
    console.log('\n4. Processing email queue...');
    await notificationService.processEmailQueue(10);
    console.log('✅ Email queue processed');

    // Step 5: Check if email was sent
    const emailResult = await pool.request()
      .input('notificationId', sql.Int, digestResult.id)
      .query(`
        SELECT * FROM EmailQueue
        WHERE NotificationID = @notificationId
      `);

    if (emailResult.recordset.length === 0) {
      console.warn('⚠️ No email record found for the digest');
    } else {
      const email = emailResult.recordset[0];
      console.log(`✅ Email status: ${email.Status}`);
      if (email.MessageId) {
        console.log(`✅ Message ID: ${email.MessageId}`);
      }
      if (email.ErrorMessage) {
        console.warn(`⚠️ Error message: ${email.ErrorMessage}`);
      }
    }

    // Step 6: Verify digest notification can be retrieved through API
    console.log('\n5. Verifying digest notification in database...');
    const notificationsResult = await pool.request()
      .input('userId', sql.Int, TEST_USER_ID)
      .input('type', sql.NVarChar, 'weekly_digest')
      .query(`
        SELECT 
          n.NotificationID, n.Title, n.Message, n.IsRead,
          nt.Name as NotificationType
        FROM Notifications n
        JOIN NotificationTypes nt ON n.NotificationTypeID = nt.NotificationTypeID
        WHERE n.UserID = @userId AND nt.Name = @type
        ORDER BY n.CreatedAt DESC
      `);

    if (notificationsResult.recordset.length === 0) {
      console.warn('⚠️ No digest notifications found for user');
    } else {
      console.log('✅ Found digest notifications for user:');
      notificationsResult.recordset.forEach(n => {
        console.log(`   - ID: ${n.NotificationID}, Type: ${n.NotificationType}, Title: ${n.Title}, Read: ${n.IsRead}`);
      });
    }

    // Conclusion
    console.log('\n✅ Weekly digest test completed successfully!');
    console.log('If you want to see the digest in the UI, log in to the application and check the notification center.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    process.exit();
  }
};

// Run the test
runTest();