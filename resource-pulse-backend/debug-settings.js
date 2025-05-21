// Debug script to check and initialize settings
const { poolPromise, sql } = require('./db/config');

async function debugSettings() {
  try {
    const pool = await poolPromise;
    
    console.log('Checking SystemSettings table...');
    
    // Check if table exists
    const tableCheck = await pool.request().query(`
      SELECT OBJECT_ID('SystemSettings') AS TableExists
    `);
    
    if (tableCheck.recordset[0].TableExists === null) {
      console.log('SystemSettings table does not exist. Creating it...');
      
      // Create the table
      await pool.request().query(`
        CREATE TABLE SystemSettings (
          SettingKey NVARCHAR(100) PRIMARY KEY,
          SettingValue NVARCHAR(MAX) NOT NULL,
          Description NVARCHAR(500),
          DataType NVARCHAR(50) DEFAULT 'string',
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          UpdatedAt DATETIME2 DEFAULT GETDATE()
        )
      `);
      
      console.log('SystemSettings table created.');
    } else {
      console.log('SystemSettings table exists.');
    }
    
    // Check current settings
    const settings = await pool.request().query(`
      SELECT SettingKey, SettingValue, DataType 
      FROM SystemSettings
    `);
    
    console.log('Current settings:', settings.recordset);
    
    // Initialize default settings if they don't exist
    const defaultSettings = [
      {
        key: 'allowOverallocation',
        value: 'true',
        description: 'Allow resources to be allocated beyond 100%',
        dataType: 'boolean'
      },
      {
        key: 'maxUtilizationPercentage',
        value: '150',
        description: 'Maximum allowed utilization percentage for resources',
        dataType: 'number'
      }
    ];
    
    for (const setting of defaultSettings) {
      const exists = await pool.request()
        .input('key', sql.NVarChar, setting.key)
        .query(`
          SELECT COUNT(*) as count FROM SystemSettings WHERE SettingKey = @key
        `);
      
      if (exists.recordset[0].count === 0) {
        console.log(`Creating setting: ${setting.key} = ${setting.value}`);
        await pool.request()
          .input('key', sql.NVarChar, setting.key)
          .input('value', sql.NVarChar, setting.value)
          .input('description', sql.NVarChar, setting.description)
          .input('dataType', sql.NVarChar, setting.dataType)
          .query(`
            INSERT INTO SystemSettings (SettingKey, SettingValue, Description, DataType)
            VALUES (@key, @value, @description, @dataType)
          `);
      } else {
        console.log(`Setting ${setting.key} already exists`);
      }
    }
    
    // Query final settings
    const finalSettings = await pool.request().query(`
      SELECT SettingKey, SettingValue, DataType 
      FROM SystemSettings
      WHERE SettingKey IN ('allowOverallocation', 'maxUtilizationPercentage')
    `);
    
    console.log('Final settings:', finalSettings.recordset);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

debugSettings();