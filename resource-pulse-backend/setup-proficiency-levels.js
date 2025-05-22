const { poolPromise } = require('./db/config');

async function setupProficiencyLevels() {
  try {
    const pool = await poolPromise;
    
    console.log('Setting up skill proficiency levels...');
    
    // Check if SkillProficiencyLevels table exists
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as tableExists
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'SkillProficiencyLevels'
    `);
    
    if (tableCheck.recordset[0].tableExists === 0) {
      console.log('Creating SkillProficiencyLevels table...');
      
      // Create the table
      await pool.request().query(`
        CREATE TABLE SkillProficiencyLevels (
          ProficiencyLevelID INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(50) NOT NULL UNIQUE,
          Description NVARCHAR(255) NULL,
          SortOrder INT NOT NULL DEFAULT 0
        )
      `);
      
      console.log('SkillProficiencyLevels table created successfully.');
    } else {
      console.log('SkillProficiencyLevels table already exists.');
    }
    
    // Check if data exists
    const dataCheck = await pool.request().query(`
      SELECT COUNT(*) as dataExists
      FROM SkillProficiencyLevels
    `);
    
    if (dataCheck.recordset[0].dataExists === 0) {
      console.log('Inserting default proficiency levels...');
      
      // Insert default proficiency levels
      await pool.request().query(`
        INSERT INTO SkillProficiencyLevels (Name, Description, SortOrder)
        VALUES
          ('Beginner', 'Limited experience or knowledge', 1),
          ('Intermediate', 'Working knowledge and some practical experience', 2),
          ('Advanced', 'Thorough understanding and extensive experience', 3),
          ('Expert', 'Comprehensive expertise and recognized authority', 4)
      `);
      
      console.log('Default proficiency levels inserted successfully.');
    } else {
      console.log('Proficiency levels data already exists.');
    }
    
    // Check if SkillCategories table exists
    const categoryTableCheck = await pool.request().query(`
      SELECT COUNT(*) as tableExists
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'SkillCategories'
    `);
    
    if (categoryTableCheck.recordset[0].tableExists === 0) {
      console.log('Creating SkillCategories table...');
      
      await pool.request().query(`
        CREATE TABLE SkillCategories (
          CategoryID INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(100) NOT NULL UNIQUE,
          Description NVARCHAR(255) NULL
        )
      `);
      
      // Insert default categories
      await pool.request().query(`
        INSERT INTO SkillCategories (Name, Description)
        VALUES
          ('Technical', 'Programming languages, tools, and technical frameworks'),
          ('Business', 'Business analysis, domain knowledge, and industry expertise'),
          ('Soft Skills', 'Communication, leadership, and interpersonal skills')
      `);
      
      console.log('SkillCategories table created and populated.');
    } else {
      console.log('SkillCategories table already exists.');
    }
    
    // Update ResourceSkills table to add ProficiencyLevelID if it doesn't exist
    const proficiencyColumnCheck = await pool.request().query(`
      SELECT COUNT(*) as columnExists
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'ResourceSkills' AND COLUMN_NAME = 'ProficiencyLevelID'
    `);
    
    if (proficiencyColumnCheck.recordset[0].columnExists === 0) {
      console.log('Adding ProficiencyLevelID column to ResourceSkills table...');
      
      await pool.request().query(`
        ALTER TABLE ResourceSkills 
        ADD ProficiencyLevelID INT NULL
      `);
      
      // Add foreign key constraint
      await pool.request().query(`
        ALTER TABLE ResourceSkills 
        ADD CONSTRAINT FK_ResourceSkills_ProficiencyLevel 
        FOREIGN KEY (ProficiencyLevelID) REFERENCES SkillProficiencyLevels(ProficiencyLevelID)
      `);
      
      console.log('ProficiencyLevelID column added to ResourceSkills table.');
    } else {
      console.log('ProficiencyLevelID column already exists in ResourceSkills table.');
    }
    
    // Verify the setup
    const verification = await pool.request().query(`
      SELECT 
        ProficiencyLevelID as id,
        Name as name,
        Description as description,
        SortOrder as sortOrder
      FROM SkillProficiencyLevels
      ORDER BY SortOrder
    `);
    
    console.log('✅ Setup complete! Available proficiency levels:');
    verification.recordset.forEach(level => {
      console.log(`  - ${level.name} (ID: ${level.id}): ${level.description}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up proficiency levels:', error);
  }
}

// Run the setup
setupProficiencyLevels();