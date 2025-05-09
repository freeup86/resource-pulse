/**
 * Create Default Roles
 * 
 * This script ensures that default roles exist in the system.
 */

const { poolPromise, sql } = require('./config');

const createDefaultRoles = async () => {
  try {
    console.log('======================================================');
    console.log('CREATING DEFAULT ROLES');
    console.log('======================================================');
    
    const pool = await poolPromise;
    
    // Define standard roles to ensure exist - adjusted for schema without Department column
    const standardRoles = [
      { name: 'Developer', description: 'Software developer or engineer in the Engineering department' },
      { name: 'Project Manager', description: 'Manages project scope, timeline, and resources in the Management department' },
      { name: 'Designer', description: 'UI/UX or graphic designer in the Design department' },
      { name: 'QA Engineer', description: 'Quality assurance specialist in the Engineering department' },
      { name: 'Business Analyst', description: 'Analyzes business needs and requirements in the Business department' },
      { name: 'Resource Manager', description: 'Manages resource allocation and capacity in the Management department' }
    ];
    
    // Check if Roles table exists
    const checkTable = await pool.request().query(`
      SELECT CASE WHEN EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Roles'
      ) THEN 1 ELSE 0 END AS TableExists
    `);
    
    if (checkTable.recordset[0].TableExists === 0) {
      console.log('Roles table does not exist. Creating...');
      await pool.request().query(`
        CREATE TABLE Roles (
          RoleID INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(255) NOT NULL UNIQUE,
          Description NVARCHAR(MAX) NULL,
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          UpdatedAt DATETIME2 DEFAULT GETDATE()
        )
      `);
      console.log('Roles table created.');
    } else {
      console.log('Roles table already exists.');
    }
    
    // Create each standard role if it doesn't exist
    for (const role of standardRoles) {
      const checkRole = await pool.request()
        .input('name', sql.NVarChar, role.name)
        .query(`
          SELECT COUNT(*) AS Count
          FROM Roles 
          WHERE Name = @name
        `);
      
      if (checkRole.recordset[0].Count === 0) {
        console.log(`Creating role: ${role.name}`);
        await pool.request()
          .input('name', sql.NVarChar, role.name)
          .input('description', sql.NVarChar, role.description)
          .query(`
            INSERT INTO Roles (Name, Description)
            VALUES (@name, @description)
          `);
      } else {
        console.log(`Role already exists: ${role.name}`);
      }
    }
    
    // Check if there's at least one role in the system
    const roleCount = await pool.request().query(`
      SELECT COUNT(*) AS Count FROM Roles
    `);
    
    console.log(`Total roles in system: ${roleCount.recordset[0].Count}`);
    
    console.log('======================================================');
    console.log('DEFAULT ROLES CREATION COMPLETE');
    console.log('======================================================');
    
    await pool.close();
    
  } catch (err) {
    console.error('Fatal error creating default roles:', err);
  }
};

// Run the script
createDefaultRoles();