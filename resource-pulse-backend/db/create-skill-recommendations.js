// create-skill-recommendations.js
const { poolPromise, sql } = require('./config');

async function createSkillRecommendationsTable() {
  try {
    console.log('Starting to create SkillRecommendations table...');
    const pool = await poolPromise;

    // Check if the SkillRecommendations table already exists
    const tableExistsResult = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'SkillRecommendations'
    `);

    if (tableExistsResult.recordset[0].count > 0) {
      console.log('SkillRecommendations table already exists.');
      return;
    }

    // Create the SkillRecommendations table
    await pool.request().query(`
      CREATE TABLE SkillRecommendations (
        RecommendationID INT IDENTITY(1,1) PRIMARY KEY,
        ProjectID INT NOT NULL,
        SkillID INT NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX),
        ResourceURL NVARCHAR(500),
        EstimatedTimeHours INT,
        Cost DECIMAL(10, 2),
        AIGenerated BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID),
        FOREIGN KEY (SkillID) REFERENCES Skills(SkillID)
      )
    `);

    console.log('SkillRecommendations table created successfully!');

    // Add indexes for faster lookups
    await pool.request().query(`
      CREATE INDEX IX_SkillRecommendations_ProjectID ON SkillRecommendations(ProjectID);
      CREATE INDEX IX_SkillRecommendations_SkillID ON SkillRecommendations(SkillID);
    `);

    console.log('Indexes on SkillRecommendations created successfully!');

  } catch (error) {
    console.error('Error creating SkillRecommendations table:', error);
  }
}

// Run the function
createSkillRecommendationsTable()
  .then(() => console.log('Script completed.'))
  .catch(err => console.error('Script failed:', err));