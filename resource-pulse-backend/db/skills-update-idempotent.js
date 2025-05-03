const sql = require('mssql');

// Database config
const config = {
  server: 'cortez-sqlserver.database.windows.net',
  database: 'ResourcePulse',
  user: 'sysadmin',
  password: 'Dc0wboy$',
  options: {
    enableArithAbort: true,
    trustServerCertificate: true
  }
};

async function executeQuery(pool, query, errorMessage) {
  try {
    await pool.request().query(query);
    console.log('Success:', query.substring(0, 50) + '...');
    return true;
  } catch (err) {
    console.log('Skipped:', errorMessage, '(' + err.message + ')');
    return false;
  }
}

async function runScript() {
  let pool;
  try {
    // Connect to database
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    console.log('Connected successfully');
    
    // Create tables - use IF NOT EXISTS patterns
    console.log('Creating tables if they don\'t exist...');
    
    // Insert proficiency levels if table exists
    await executeQuery(
      pool, 
      `IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SkillProficiencyLevels')
       AND NOT EXISTS (SELECT * FROM SkillProficiencyLevels WHERE Name = 'Beginner')
       BEGIN
         INSERT INTO SkillProficiencyLevels (Name, Description, SortOrder)
         VALUES
           ('Beginner', 'Limited experience or knowledge', 1),
           ('Intermediate', 'Working knowledge and some practical experience', 2),
           ('Advanced', 'Thorough understanding and extensive experience', 3),
           ('Expert', 'Comprehensive expertise and recognized authority', 4)
       END`,
      'Insert proficiency levels'
    );
    
    // Insert categories if table exists
    await executeQuery(
      pool, 
      `IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SkillCategories')
       AND NOT EXISTS (SELECT * FROM SkillCategories WHERE Name = 'Technical')
       BEGIN
         INSERT INTO SkillCategories (Name, Description)
         VALUES
           ('Technical', 'Programming languages, tools, and technical frameworks'),
           ('Business', 'Business analysis, domain knowledge, and industry expertise'),
           ('Soft Skills', 'Communication, leadership, and interpersonal skills')
       END`,
      'Insert skill categories'
    );
    
    // Add ProficiencyLevel column to Skills if it doesn't exist
    await executeQuery(
      pool,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Skills') AND name = 'ProficiencyLevel')
       BEGIN
         ALTER TABLE Skills ADD ProficiencyLevel NVARCHAR(50) NULL
       END`,
      'Add ProficiencyLevel to Skills'
    );
    
    // Add Category column to Skills if it doesn't exist
    await executeQuery(
      pool,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Skills') AND name = 'Category')
       BEGIN
         ALTER TABLE Skills ADD Category NVARCHAR(100) NULL
       END`,
      'Add Category to Skills'
    );
    
    // Add Description column to Skills if it doesn't exist
    await executeQuery(
      pool,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Skills') AND name = 'Description')
       BEGIN
         ALTER TABLE Skills ADD Description NVARCHAR(500) NULL
       END`,
      'Add Description to Skills'
    );
    
    // Add IsActive column to Skills if it doesn't exist
    await executeQuery(
      pool,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Skills') AND name = 'IsActive')
       BEGIN
         ALTER TABLE Skills ADD IsActive BIT DEFAULT 1
       END`,
      'Add IsActive to Skills'
    );
    
    // Add ProficiencyLevelID column to ResourceSkills if it doesn't exist
    await executeQuery(
      pool,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ResourceSkills') AND name = 'ProficiencyLevelID')
       BEGIN
         ALTER TABLE ResourceSkills ADD ProficiencyLevelID INT NULL
       END`,
      'Add ProficiencyLevelID to ResourceSkills'
    );
    
    // Add Notes column to ResourceSkills if it doesn't exist
    await executeQuery(
      pool,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ResourceSkills') AND name = 'Notes')
       BEGIN
         ALTER TABLE ResourceSkills ADD Notes NVARCHAR(255) NULL
       END`,
      'Add Notes to ResourceSkills'
    );
    
    // Add ProficiencyLevelID column to ProjectSkills if it doesn't exist
    await executeQuery(
      pool,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ProjectSkills') AND name = 'ProficiencyLevelID')
       BEGIN
         ALTER TABLE ProjectSkills ADD ProficiencyLevelID INT NULL
       END`,
      'Add ProficiencyLevelID to ProjectSkills'
    );
    
    // Add Priority column to ProjectSkills if it doesn't exist
    await executeQuery(
      pool,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ProjectSkills') AND name = 'Priority')
       BEGIN
         ALTER TABLE ProjectSkills ADD Priority INT DEFAULT 0
       END`,
      'Add Priority to ProjectSkills'
    );
    
    // Create foreign key constraints if they don't exist
    await executeQuery(
      pool,
      `IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_ResourceSkills_ProficiencyLevel')
       AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ResourceSkills') AND name = 'ProficiencyLevelID')
       AND EXISTS (SELECT * FROM sys.tables WHERE name = 'SkillProficiencyLevels')
       BEGIN
         ALTER TABLE ResourceSkills ADD CONSTRAINT FK_ResourceSkills_ProficiencyLevel 
         FOREIGN KEY (ProficiencyLevelID) REFERENCES SkillProficiencyLevels(ProficiencyLevelID)
       END`,
      'Add FK to ResourceSkills'
    );
    
    await executeQuery(
      pool,
      `IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_ProjectSkills_ProficiencyLevel')
       AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ProjectSkills') AND name = 'ProficiencyLevelID')
       AND EXISTS (SELECT * FROM sys.tables WHERE name = 'SkillProficiencyLevels')
       BEGIN
         ALTER TABLE ProjectSkills ADD CONSTRAINT FK_ProjectSkills_ProficiencyLevel 
         FOREIGN KEY (ProficiencyLevelID) REFERENCES SkillProficiencyLevels(ProficiencyLevelID)
       END`,
      'Add FK to ProjectSkills'
    );
    
    // Create skill certifications table if it doesn't exist
    await executeQuery(
      pool,
      `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SkillCertifications')
       BEGIN
         CREATE TABLE SkillCertifications (
           CertificationID INT IDENTITY(1,1) PRIMARY KEY,
           ResourceID INT NOT NULL,
           SkillID INT NOT NULL,
           CertificationName NVARCHAR(200) NOT NULL,
           IssueDate DATE NULL,
           ExpiryDate DATE NULL,
           Issuer NVARCHAR(200) NULL,
           CertificationURL NVARCHAR(500) NULL,
           Notes NVARCHAR(500) NULL,
           CreatedAt DATETIME2 DEFAULT GETDATE(),
           UpdatedAt DATETIME2 DEFAULT GETDATE(),
           FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID) ON DELETE CASCADE,
           FOREIGN KEY (SkillID) REFERENCES Skills(SkillID) ON DELETE CASCADE
         )
       END`,
      'Create SkillCertifications table'
    );
    
    // Create skill development recommendations table if it doesn't exist
    await executeQuery(
      pool,
      `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SkillDevelopmentRecommendations')
       BEGIN
         CREATE TABLE SkillDevelopmentRecommendations (
           RecommendationID INT IDENTITY(1,1) PRIMARY KEY,
           SkillID INT NOT NULL,
           Title NVARCHAR(200) NOT NULL,
           Description NVARCHAR(500) NULL,
           ResourceURL NVARCHAR(500) NULL,
           EstimatedTimeHours INT NULL,
           Cost DECIMAL(10, 2) NULL,
           CreatedAt DATETIME2 DEFAULT GETDATE(),
           UpdatedAt DATETIME2 DEFAULT GETDATE(),
           FOREIGN KEY (SkillID) REFERENCES Skills(SkillID) ON DELETE CASCADE
         )
       END`,
      'Create SkillDevelopmentRecommendations table'
    );
    
    // Create/replace the view
    console.log('Creating gap analysis view...');
    await executeQuery(
      pool,
      `IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_SkillsGapAnalysis')
       BEGIN
         DROP VIEW vw_SkillsGapAnalysis
       END`,
      'Drop existing view'
    );
    
    await executeQuery(
      pool,
      `CREATE VIEW vw_SkillsGapAnalysis AS
       SELECT 
         s.SkillID,
         s.Name AS SkillName,
         s.Category,
         p.ProficiencyLevelID,
         p.Name AS ProficiencyLevel,
         (
           SELECT COUNT(*)
           FROM ResourceSkills rs
           WHERE rs.SkillID = s.SkillID
         ) AS ResourcesCount,
         (
           SELECT COUNT(*)
           FROM ProjectSkills ps
           WHERE ps.SkillID = s.SkillID
         ) AS ProjectRequirementsCount,
         (
           SELECT COUNT(*)
           FROM ResourceSkills rs
           WHERE rs.SkillID = s.SkillID
           AND rs.ProficiencyLevelID = p.ProficiencyLevelID
         ) AS ResourcesAtProficiencyCount,
         (
           SELECT COUNT(*)
           FROM ProjectSkills ps
           WHERE ps.SkillID = s.SkillID
           AND ps.ProficiencyLevelID = p.ProficiencyLevelID
         ) AS ProjectsRequiringProficiencyCount
       FROM 
         Skills s
       CROSS JOIN 
         SkillProficiencyLevels p`,
      'Create gap analysis view'
    );
    
    console.log('Database update completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

runScript();