// notificationScheduler.js
const cron = require('node-cron');
const { poolPromise, sql } = require('../db/config');
const notificationService = require('./notificationService');

/**
 * Initialize scheduled notification jobs
 */
const initializeScheduledJobs = async () => {
  try {
    console.log('Initializing notification scheduler...');

    // Schedule email processing every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('Running scheduled email processing job');
        await notificationService.processEmailQueue(20);
      } catch (error) {
        console.error('Error processing email queue:', error);
      }
    });

    // Schedule daily check for approaching deadlines
    cron.schedule('0 8 * * *', async () => {
      try {
        console.log('Running deadline notification check');
        await checkDeadlines();
      } catch (error) {
        console.error('Error checking deadlines:', error);
      }
    });

    // Schedule daily check for capacity thresholds
    cron.schedule('0 9 * * *', async () => {
      try {
        console.log('Running capacity threshold check');
        await checkCapacityThresholds();
      } catch (error) {
        console.error('Error checking capacity thresholds:', error);
      }
    });

    // Schedule daily check for resource conflicts
    cron.schedule('0 10 * * *', async () => {
      try {
        console.log('Running resource conflict check');
        await checkResourceConflicts();
      } catch (error) {
        console.error('Error checking resource conflicts:', error);
      }
    });

    // Schedule weekly digest based on system settings
    initializeWeeklyDigest();

    console.log('Notification scheduler initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize notification scheduler:', error);
    return false;
  }
};

/**
 * Set up weekly digest job based on system settings
 */
const initializeWeeklyDigest = async () => {
  try {
    const pool = await poolPromise;
    
    // Get digest schedule settings from system settings
    const settingsResult = await pool.request()
      .query(`
        SELECT SettingValue
        FROM SystemNotificationSettings
        WHERE SettingKey IN ('digest_day', 'digest_time')
      `);
    
    // Default values
    let dayOfWeek = 1; // Monday
    let timeOfDay = '08:00';
    
    // Get values from settings
    if (settingsResult.recordset.length > 0) {
      settingsResult.recordset.forEach(setting => {
        if (setting.SettingKey === 'digest_day') {
          dayOfWeek = parseInt(setting.SettingValue);
        } else if (setting.SettingKey === 'digest_time') {
          timeOfDay = setting.SettingValue.substring(0, 5);
        }
      });
    }
    
    // Schedule weekly digest
    const cronExpression = `${timeOfDay.split(':')[1]} ${timeOfDay.split(':')[0]} * * ${dayOfWeek}`;
    
    cron.schedule(cronExpression, async () => {
      try {
        console.log('Running weekly digest job');
        await sendWeeklyDigests();
      } catch (error) {
        console.error('Error sending weekly digests:', error);
      }
    });
    
    console.log(`Weekly digest scheduled for day ${dayOfWeek} at ${timeOfDay}`);
  } catch (error) {
    console.error('Error initializing weekly digest:', error);
  }
};

/**
 * Check for approaching deadlines and send notifications
 */
const checkDeadlines = async () => {
  try {
    const pool = await poolPromise;
    
    // Get default threshold from settings
    const settingResult = await pool.request()
      .query(`
        SELECT SettingValue
        FROM SystemNotificationSettings
        WHERE SettingKey = 'deadline_warning_days'
      `);
    
    const defaultThreshold = parseInt(settingResult.recordset[0]?.SettingValue) || 7;
    
    // Find allocations ending within the threshold period
    const allocationsResult = await pool.request()
      .input('threshold', sql.Int, defaultThreshold)
      .query(`
        SELECT 
          a.AllocationID, 
          a.ResourceID,
          r.Name AS ResourceName,
          a.ProjectID,
          p.Name AS ProjectName,
          a.StartDate,
          a.EndDate,
          a.Utilization,
          DATEDIFF(day, GETDATE(), a.EndDate) AS DaysLeft,
          uns.ThresholdDays
        FROM Allocations a
        INNER JOIN Resources r ON a.ResourceID = r.ResourceID
        INNER JOIN Projects p ON a.ProjectID = p.ProjectID
        LEFT JOIN UserNotificationSettings uns 
          ON uns.UserID = a.ResourceID 
          AND uns.NotificationTypeID = (SELECT NotificationTypeID FROM NotificationTypes WHERE Name = 'deadline_approaching')
        WHERE a.EndDate >= GETDATE() 
        AND a.EndDate <= DATEADD(day, @threshold, GETDATE())
        AND NOT EXISTS (
          SELECT 1 FROM Notifications n 
          WHERE n.RelatedEntityType = 'allocation' 
          AND n.RelatedEntityID = a.AllocationID
          AND n.NotificationTypeID = (SELECT NotificationTypeID FROM NotificationTypes WHERE Name = 'deadline_approaching')
          AND n.CreatedAt > DATEADD(day, -3, GETDATE())
        )
      `);
    
    console.log(`Found ${allocationsResult.recordset.length} approaching deadlines`);
    
    // Send notifications for each approaching deadline
    for (const allocation of allocationsResult.recordset) {
      const threshold = allocation.ThresholdDays || defaultThreshold;
      
      // Only notify if within the user's custom threshold or the default
      if (allocation.DaysLeft <= threshold) {
        await notificationService.notifyDeadlineApproaching(
          {
            id: allocation.AllocationID,
            startDate: allocation.StartDate,
            endDate: allocation.EndDate,
            utilization: allocation.Utilization
          },
          {
            id: allocation.ResourceID,
            name: allocation.ResourceName
          },
          {
            id: allocation.ProjectID,
            name: allocation.ProjectName
          },
          allocation.DaysLeft
        );
        
        console.log(`Sent deadline notification for ${allocation.ResourceName} on ${allocation.ProjectName}`);
      }
    }
  } catch (error) {
    console.error('Error checking deadlines:', error);
    throw error;
  }
};

/**
 * Check for capacity threshold violations
 */
const checkCapacityThresholds = async () => {
  try {
    const pool = await poolPromise;
    
    // Get default threshold from settings
    const settingResult = await pool.request()
      .query(`
        SELECT SettingValue
        FROM SystemNotificationSettings
        WHERE SettingKey = 'capacity_threshold_percent'
      `);
    
    const defaultThreshold = parseInt(settingResult.recordset[0]?.SettingValue) || 90;
    
    // Get current allocations and total utilization for each resource
    const result = await pool.request()
      .query(`
        WITH ResourceUtilization AS (
          SELECT 
            r.ResourceID,
            r.Name AS ResourceName,
            SUM(a.Utilization) AS TotalUtilization
          FROM Resources r
          JOIN Allocations a ON r.ResourceID = a.ResourceID
          WHERE a.StartDate <= GETDATE() AND a.EndDate >= GETDATE()
          GROUP BY r.ResourceID, r.Name
        )
        SELECT 
          ru.ResourceID,
          ru.ResourceName,
          ru.TotalUtilization,
          ISNULL(uns.ThresholdPercent, 
                (SELECT SettingValue FROM SystemNotificationSettings WHERE SettingKey = 'capacity_threshold_percent')) AS ThresholdPercent
        FROM ResourceUtilization ru
        LEFT JOIN UserNotificationSettings uns 
          ON uns.UserID = ru.ResourceID 
          AND uns.NotificationTypeID = (SELECT NotificationTypeID FROM NotificationTypes WHERE Name = 'capacity_threshold')
        WHERE ru.TotalUtilization > ISNULL(uns.ThresholdPercent, @defaultThreshold)
        AND NOT EXISTS (
          SELECT 1 FROM Notifications n 
          WHERE n.RelatedEntityType = 'resource' 
          AND n.RelatedEntityID = ru.ResourceID
          AND n.NotificationTypeID = (SELECT NotificationTypeID FROM NotificationTypes WHERE Name = 'capacity_threshold')
          AND n.CreatedAt > DATEADD(day, -1, GETDATE())
        )
      `)
      .input('defaultThreshold', sql.Int, defaultThreshold);
    
    console.log(`Found ${result.recordset.length} resources exceeding capacity thresholds`);
    
    // Send notifications for each resource over threshold
    for (const resource of result.recordset) {
      await notificationService.notifyCapacityThreshold(
        {
          id: resource.ResourceID,
          name: resource.ResourceName
        },
        resource.TotalUtilization,
        resource.ThresholdPercent
      );
      
      console.log(`Sent capacity threshold notification for ${resource.ResourceName}: ${resource.TotalUtilization}%`);
    }
  } catch (error) {
    console.error('Error checking capacity thresholds:', error);
    throw error;
  }
};

/**
 * Check for resource allocation conflicts
 */
const checkResourceConflicts = async () => {
  try {
    const pool = await poolPromise;
    
    // Get default capacity threshold from settings
    const settingResult = await pool.request()
      .query(`
        SELECT SettingValue
        FROM SystemNotificationSettings
        WHERE SettingKey = 'capacity_threshold_percent'
      `);
    
    const capacityThreshold = parseInt(settingResult.recordset[0]?.SettingValue) || 90;
    
    // Find resources with overlapping allocations exceeding 100%
    const result = await pool.request()
      .input('threshold', sql.Int, capacityThreshold)
      .query(`
        WITH ResourceUtilization AS (
          SELECT 
            r.ResourceID,
            r.Name AS ResourceName,
            SUM(a.Utilization) AS TotalUtilization
          FROM Resources r
          JOIN Allocations a ON r.ResourceID = a.ResourceID
          WHERE a.StartDate <= DATEADD(day, 14, GETDATE()) 
          AND a.EndDate >= GETDATE()
          GROUP BY r.ResourceID, r.Name
          HAVING SUM(a.Utilization) > 100
        )
        SELECT 
          ru.ResourceID,
          ru.ResourceName,
          ru.TotalUtilization,
          a.AllocationID,
          a.ProjectID,
          p.Name AS ProjectName,
          a.StartDate,
          a.EndDate,
          a.Utilization
        FROM ResourceUtilization ru
        JOIN Allocations a ON ru.ResourceID = a.ResourceID
        JOIN Projects p ON a.ProjectID = p.ProjectID
        WHERE a.StartDate <= DATEADD(day, 14, GETDATE()) 
        AND a.EndDate >= GETDATE()
        AND NOT EXISTS (
          SELECT 1 FROM Notifications n 
          WHERE n.RelatedEntityType = 'resource' 
          AND n.RelatedEntityID = ru.ResourceID
          AND n.NotificationTypeID = (SELECT NotificationTypeID FROM NotificationTypes WHERE Name = 'resource_conflict')
          AND n.CreatedAt > DATEADD(day, -1, GETDATE())
        )
        ORDER BY ru.ResourceID, a.StartDate
      `);
    
    // Group by resource
    const resourceConflicts = {};
    
    result.recordset.forEach(row => {
      if (!resourceConflicts[row.ResourceID]) {
        resourceConflicts[row.ResourceID] = {
          resource: {
            id: row.ResourceID,
            name: row.ResourceName
          },
          totalUtilization: row.TotalUtilization,
          allocations: []
        };
      }
      
      resourceConflicts[row.ResourceID].allocations.push({
        id: row.AllocationID,
        projectId: row.ProjectID,
        projectName: row.ProjectName,
        startDate: row.StartDate,
        endDate: row.EndDate,
        utilization: row.Utilization
      });
    });
    
    console.log(`Found ${Object.keys(resourceConflicts).length} resources with allocation conflicts`);
    
    // Send notifications for each resource conflict
    for (const resourceId in resourceConflicts) {
      const conflict = resourceConflicts[resourceId];
      
      await notificationService.notifyResourceConflict(
        conflict.resource,
        conflict.allocations,
        conflict.totalUtilization
      );
      
      console.log(`Sent resource conflict notification for ${conflict.resource.name}: ${conflict.totalUtilization}%`);
    }
  } catch (error) {
    console.error('Error checking resource conflicts:', error);
    throw error;
  }
};

/**
 * Send weekly digests to all users
 */
const sendWeeklyDigests = async () => {
  try {
    const pool = await poolPromise;
    
    // Get all active resources with emails
    const resourcesResult = await pool.request()
      .query(`
        SELECT 
          r.ResourceID, 
          r.Name,
          r.Email
        FROM Resources r
        WHERE r.Email IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM Allocations a 
          WHERE a.ResourceID = r.ResourceID 
          AND a.EndDate >= GETDATE()
        )
      `);
    
    console.log(`Sending weekly digest to ${resourcesResult.recordset.length} resources`);
    
    // Send digest to each resource
    for (const resource of resourcesResult.recordset) {
      try {
        await notificationService.generateWeeklyDigest(resource.ResourceID);
        console.log(`Sent weekly digest to ${resource.Name}`);
      } catch (error) {
        console.error(`Error sending digest to ${resource.Name}:`, error);
      }
    }
    
    // Update next run time in the database
    await pool.request().query(`
      UPDATE DigestSchedules
      SET LastRunAt = GETDATE(),
          NextRunAt = DATEADD(WEEK, 1, GETDATE())
      WHERE Frequency = 'weekly' AND IsActive = 1
    `);
    
    console.log('Weekly digest job completed');
  } catch (error) {
    console.error('Error sending weekly digests:', error);
    throw error;
  }
};

module.exports = {
  initializeScheduledJobs,
  checkDeadlines,
  checkCapacityThresholds,
  checkResourceConflicts,
  sendWeeklyDigests
};