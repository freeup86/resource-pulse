// fix-scenario-constraints.js
// Script to fix the foreign key constraint issue between ScenarioAllocations and ScenarioPlans

const { poolPromise, sql } = require('./config');

async function fixScenarioConstraints() {
  try {
    console.log('Starting scenario foreign key constraint fix...');
    const pool = await poolPromise;

    // Check if tables exist
    const tablesResult = await pool.request().query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name IN ('ScenarioPlans', 'CapacityScenarios', 'ScenarioAllocations')
    `);

    const tables = tablesResult.recordset.map(record => record.table_name);
    console.log('Found tables:', tables);

    // Check foreign key constraints on ScenarioAllocations
    const fkResult = await pool.request().query(`
      SELECT 
        OBJECT_NAME(f.parent_object_id) AS TableName,
        OBJECT_NAME(f.referenced_object_id) AS ReferencedTableName,
        COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
        COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferencedColumnName,
        f.name AS ForeignKeyName
      FROM 
        sys.foreign_keys AS f
        INNER JOIN sys.foreign_key_columns AS fc
        ON f.object_id = fc.constraint_object_id
      WHERE 
        OBJECT_NAME(f.parent_object_id) = 'ScenarioAllocations'
    `);

    console.log('Foreign key constraints on ScenarioAllocations:');
    console.log(fkResult.recordset);

    // If ScenarioPlans and CapacityScenarios both exist, we need to update the foreign key
    if (tables.includes('ScenarioPlans') && tables.includes('CapacityScenarios')) {
      console.log('Both ScenarioPlans and CapacityScenarios exist. Fixing constraint...');
      
      // First, check if there's any data in ScenarioAllocations
      const dataResult = await pool.request().query(`
        SELECT COUNT(*) AS count FROM ScenarioAllocations
      `);
      
      const hasData = dataResult.recordset[0].count > 0;
      console.log(`ScenarioAllocations has ${dataResult.recordset[0].count} records.`);
      
      // Begin a transaction for the fix
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      
      try {
        // If there's a FK constraint pointing to ScenarioPlans, drop it
        if (fkResult.recordset.some(r => r.ReferencedTableName === 'ScenarioPlans')) {
          const fkName = fkResult.recordset.find(r => r.ReferencedTableName === 'ScenarioPlans').ForeignKeyName;
          console.log(`Dropping foreign key constraint: ${fkName}`);
          
          await transaction.request().query(`
            ALTER TABLE ScenarioAllocations
            DROP CONSTRAINT ${fkName}
          `);
        }
        
        // Add new foreign key constraint pointing to CapacityScenarios
        console.log('Adding new foreign key constraint to CapacityScenarios');
        await transaction.request().query(`
          ALTER TABLE ScenarioAllocations
          ADD CONSTRAINT FK_ScenarioAllocations_CapacityScenarios
          FOREIGN KEY (ScenarioID) REFERENCES CapacityScenarios(ScenarioID)
          ON DELETE CASCADE
        `);
        
        // Handle data migration if needed
        if (hasData) {
          console.log('Migrating ScenarioAllocations data...');
          
          // Get existing ScenarioIDs from ScenarioAllocations
          const scenarioIds = await transaction.request().query(`
            SELECT DISTINCT ScenarioID FROM ScenarioAllocations
          `);
          
          // Create corresponding CapacityScenarios records if they don't exist
          for (const row of scenarioIds.recordset) {
            const scenarioId = row.ScenarioID;
            
            // Check if this ScenarioID exists in CapacityScenarios
            const capacityScenarioCheck = await transaction.request()
              .input('scenarioId', sql.Int, scenarioId)
              .query(`
                SELECT COUNT(*) AS count FROM CapacityScenarios
                WHERE ScenarioID = @scenarioId
              `);
              
            if (capacityScenarioCheck.recordset[0].count === 0) {
              // Get data from ScenarioPlans if available
              const scenarioPlanCheck = await transaction.request()
                .input('scenarioId', sql.Int, scenarioId)
                .query(`
                  SELECT Name, Description, CreatedAt
                  FROM ScenarioPlans
                  WHERE ScenarioID = @scenarioId
                `);
                
              if (scenarioPlanCheck.recordset.length > 0) {
                const scenarioPlan = scenarioPlanCheck.recordset[0];
                
                // Create corresponding record in CapacityScenarios
                await transaction.request()
                  .input('scenarioId', sql.Int, scenarioId)
                  .input('name', sql.NVarChar, scenarioPlan.Name)
                  .input('description', sql.NVarChar, scenarioPlan.Description)
                  .input('createdAt', sql.DateTime2, scenarioPlan.CreatedAt)
                  .query(`
                    SET IDENTITY_INSERT CapacityScenarios ON;
                    
                    INSERT INTO CapacityScenarios (
                      ScenarioID, Name, Description, CreatedAt, UpdatedAt, IsActive
                    )
                    VALUES (
                      @scenarioId, @name, @description, @createdAt, GETDATE(), 1
                    );
                    
                    SET IDENTITY_INSERT CapacityScenarios OFF;
                  `);
                  
                console.log(`Created CapacityScenarios record for ID ${scenarioId}`);
              } else {
                // Create a default record
                await transaction.request()
                  .input('scenarioId', sql.Int, scenarioId)
                  .query(`
                    SET IDENTITY_INSERT CapacityScenarios ON;
                    
                    INSERT INTO CapacityScenarios (
                      ScenarioID, Name, Description, CreatedAt, UpdatedAt, IsActive
                    )
                    VALUES (
                      @scenarioId, 'Migrated Scenario ' + CAST(@scenarioId AS NVARCHAR), 
                      'Automatically migrated from ScenarioPlans', 
                      GETDATE(), GETDATE(), 1
                    );
                    
                    SET IDENTITY_INSERT CapacityScenarios OFF;
                  `);
                  
                console.log(`Created default CapacityScenarios record for ID ${scenarioId}`);
              }
            }
          }
        }
        
        await transaction.commit();
        console.log('Foreign key constraint fixed successfully');
      } catch (error) {
        await transaction.rollback();
        console.error('Error fixing foreign key constraint:', error);
        throw error;
      }
    } else if (!tables.includes('CapacityScenarios')) {
      console.log('CapacityScenarios table does not exist. Creating it...');
      
      // Create CapacityScenarios table
      await pool.request().query(`
        CREATE TABLE CapacityScenarios (
          ScenarioID INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(200) NOT NULL,
          Description NVARCHAR(MAX) NULL,
          CreatedBy INT NULL, -- User who created the scenario
          IsActive BIT DEFAULT 1,
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          UpdatedAt DATETIME2 DEFAULT GETDATE()
        );
      `);
      
      // Then call this function again to complete the fix
      return fixScenarioConstraints();
    } else {
      console.log('Error: ScenarioPlans table not found. Cannot fix constraint.');
    }

    return 'Scenario constraint fix completed';
  } catch (err) {
    console.error('Error in fixScenarioConstraints:', err);
    throw err;
  }
}

// Run the function
fixScenarioConstraints()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });