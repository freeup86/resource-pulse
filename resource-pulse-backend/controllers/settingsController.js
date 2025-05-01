// resource-pulse-backend/controllers/settingsController.js
const { poolPromise, sql } = require('../db/config');

// Get system settings
exports.getSettings = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Query settings table
    const result = await pool.request()
      .query(`
        SELECT 
          SettingKey, 
          SettingValue,
          Description,
          DataType
        FROM SystemSettings
      `);
    
    // Convert to key-value object
    const settings = {};
    result.recordset.forEach(setting => {
      // Convert value based on data type
      let value = setting.SettingValue;
      if (setting.DataType === 'boolean') {
        value = value.toLowerCase() === 'true';
      } else if (setting.DataType === 'number') {
        value = parseFloat(value);
      } else if (setting.DataType === 'json') {
        try {
          value = JSON.parse(value);
        } catch (err) {
          console.error(`Failed to parse JSON setting ${setting.SettingKey}:`, err);
        }
      }
      
      settings[setting.SettingKey] = {
        value,
        description: setting.Description,
        dataType: setting.DataType
      };
    });
    
    res.json(settings);
  } catch (err) {
    console.error('Error getting settings:', err);
    res.status(500).json({
      message: 'Error retrieving settings',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Update system settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ message: 'Valid settings object is required' });
    }
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        // Skip invalid entries
        if (!key) continue;
        
        // Get current setting to determine data type
        const currentSetting = await transaction.request()
          .input('key', sql.NVarChar, key)
          .query(`
            SELECT DataType FROM SystemSettings WHERE SettingKey = @key
          `);
        
        // Skip if setting doesn't exist
        if (currentSetting.recordset.length === 0) continue;
        
        const dataType = currentSetting.recordset[0].DataType;
        let stringValue;
        
      // Convert value to string based on data type
      if (dataType === 'json') {
        try {
          // If it's already a string, try to parse it to validate it's valid JSON
          if (typeof value === 'string') {
            // Test if it's valid JSON
            JSON.parse(value);
            stringValue = value;
          } else {
            // It's an object, so stringify it
            stringValue = JSON.stringify(value);
          }
        } catch (e) {
          // If parsing fails or any other error, use empty array as default
          console.error(`Failed to process JSON setting: ${key}`, e);
          stringValue = '[]';
        }
      } else if (value === undefined || value === null) {
        // Handle null/undefined values based on data type
        if (dataType === 'boolean') stringValue = 'false';
        else if (dataType === 'number') stringValue = '0';
        else stringValue = '';
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        stringValue = value.toString();
      } else {
        stringValue = String(value);
      }
        
        // Update the setting
        await transaction.request()
          .input('key', sql.NVarChar, key)
          .input('value', sql.NVarChar, stringValue)
          .query(`
            UPDATE SystemSettings
            SET SettingValue = @value,
                UpdatedAt = GETDATE()
            WHERE SettingKey = @key
          `);
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Return updated settings
      // Get the updated settings and return them
      const updatedSettings = await this.getSettings(req, res);
      return updatedSettings;
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({
      message: 'Error updating settings',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Initialize default settings if they don't exist
exports.initializeSettings = async () => {
  try {
    const pool = await poolPromise;
    
    // Check if settings table exists
    const tableResult = await pool.request()
      .query(`
        SELECT OBJECT_ID('SystemSettings') AS TableExists
      `);
    
    const tableExists = tableResult.recordset[0].TableExists !== null;
    
    if (!tableExists) {
      console.log('Creating SystemSettings table...');
      
      // Create settings table
      await pool.request()
        .query(`
          CREATE TABLE SystemSettings (
            SettingKey NVARCHAR(100) PRIMARY KEY,
            SettingValue NVARCHAR(MAX) NOT NULL,
            Description NVARCHAR(500),
            DataType NVARCHAR(50) DEFAULT 'string',
            CreatedAt DATETIME2 DEFAULT GETDATE(),
            UpdatedAt DATETIME2 DEFAULT GETDATE()
          )
        `);
    }
    
    // Default settings
    const defaultSettings = [
      {
        key: 'appName',
        value: 'ResourcePulse',
        description: 'Application name displayed in the UI',
        dataType: 'string'
      },
      {
        key: 'maxUtilizationPercentage',
        value: '100',
        description: 'Maximum allowed utilization percentage for resources',
        dataType: 'number'
      },
      {
        key: 'defaultEndingSoonDays',
        value: '14',
        description: 'Default number of days for "ending soon" resources view',
        dataType: 'number'
      },
      {
        key: 'allowOverallocation',
        value: 'false',
        description: 'Allow resources to be allocated beyond 100%',
        dataType: 'boolean'
      },
      {
        key: 'emailNotifications',
        value: 'false',
        description: 'Enable email notifications for allocation changes',
        dataType: 'boolean'
      },
      {
        key: 'resourceDefaultView',
        value: 'list',
        description: 'Default view for resources page (list/grid)',
        dataType: 'string'
      },
      {
        key: 'matchingThreshold',
        value: '60',
        description: 'Minimum matching score percentage for resource recommendations',
        dataType: 'number'
      },
      {
        key: 'externalSystemIntegration',
        value: 'false',
        description: 'Enable integration with external systems',
        dataType: 'boolean'
      },
      {
        key: 'defaultTimelineMonths',
        value: '3',
        description: 'Default number of months to display in timeline view',
        dataType: 'number'
      },
      {
        key: 'customFields',
        value: '[]',
        description: 'Custom fields configuration for resources and projects',
        dataType: 'json'
      }
    ];
    
    // Insert default settings if they don't exist
    for (const setting of defaultSettings) {
      await pool.request()
        .input('key', sql.NVarChar, setting.key)
        .input('value', sql.NVarChar, setting.value)
        .input('description', sql.NVarChar, setting.description)
        .input('dataType', sql.NVarChar, setting.dataType)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = @key)
          INSERT INTO SystemSettings (SettingKey, SettingValue, Description, DataType)
          VALUES (@key, @value, @description, @dataType)
        `);
    }
    
    console.log('System settings initialized');
  } catch (err) {
    console.error('Error initializing settings:', err);
  }
};