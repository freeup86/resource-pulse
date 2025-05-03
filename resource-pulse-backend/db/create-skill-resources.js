// create-skill-resources.js
const { poolPromise, sql } = require('./config');

async function createSkillResourcesTable() {
  try {
    console.log('Starting to create SkillResources table...');
    const pool = await poolPromise;

    // Check if the SkillResources table already exists
    const tableExistsResult = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'SkillResources'
    `);

    if (tableExistsResult.recordset[0].count > 0) {
      console.log('SkillResources table already exists.');
      return;
    }

    // Create the SkillResources table
    await pool.request().query(`
      CREATE TABLE SkillResources (
        ResourceID INT IDENTITY(1,1) PRIMARY KEY,
        SkillID INT NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX),
        ResourceURL NVARCHAR(500),
        EstimatedTimeHours INT,
        Cost DECIMAL(10, 2),
        AIGenerated BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (SkillID) REFERENCES Skills(SkillID)
      )
    `);

    console.log('SkillResources table created successfully!');

    // Add an index on SkillID for faster lookups
    await pool.request().query(`
      CREATE INDEX IX_SkillResources_SkillID ON SkillResources(SkillID)
    `);

    console.log('Index on SkillResources.SkillID created successfully!');

  } catch (error) {
    console.error('Error creating SkillResources table:', error);
  }
}

// Run the function
createSkillResourcesTable()
  .then(() => console.log('Script completed.'))
  .catch(err => console.error('Script failed:', err));