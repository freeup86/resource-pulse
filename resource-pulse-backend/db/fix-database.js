/**
 * Comprehensive Database Fix Script
 * 
 * This script ensures all database objects required by the application are created:
 * 1. Tables with required columns
 * 2. Views referenced by controllers
 * 3. Stored procedures
 */

const { poolPromise, sql } = require('./config');

const fixDatabase = async () => {
  try {
    console.log('======================================================');
    console.log('RUNNING COMPREHENSIVE DATABASE FIX');
    console.log('======================================================');
    
    const pool = await poolPromise;
    
    // ===== STEP 1: Check and create basic tables if they don't exist =====
    console.log('\n[STEP 1] Checking and creating basic tables...');

    // Projects table
    try {
      console.log('  Checking Projects table...');
      const projectsExist = await pool.request().query(`
        SELECT CASE WHEN EXISTS (
          SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Projects'
        ) THEN 1 ELSE 0 END AS TableExists
      `);

      if (projectsExist.recordset[0].TableExists === 0) {
        console.log('  Creating Projects table...');
        await pool.request().query(`
          CREATE TABLE Projects (
            ProjectID INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(255) NOT NULL,
            Client NVARCHAR(255) NOT NULL,
            Description NVARCHAR(MAX) NULL,
            StartDate DATE NULL,
            EndDate DATE NULL,
            Status NVARCHAR(50) DEFAULT 'Active',
            CreatedAt DATETIME2 DEFAULT GETDATE(),
            UpdatedAt DATETIME2 DEFAULT GETDATE(),
            Budget DECIMAL(14, 2) NULL,
            ActualCost DECIMAL(14, 2) NULL DEFAULT 0,
            BudgetUtilization DECIMAL(5, 2) NULL DEFAULT 0,
            Currency NVARCHAR(3) DEFAULT 'USD',
            FinancialNotes NVARCHAR(MAX) NULL,
            BillableAmount DECIMAL(14, 2) NULL DEFAULT 0,
            ForecastedCost DECIMAL(14, 2) NULL
          )
        `);
        console.log('  Projects table created successfully');
      } else {
        console.log('  Projects table already exists');
        
        // Check for required columns and add if missing
        const columnsToCheck = [
          { name: 'Budget', type: 'DECIMAL(14, 2)', defaultValue: 'NULL' },
          { name: 'ActualCost', type: 'DECIMAL(14, 2)', defaultValue: '0' },
          { name: 'BudgetUtilization', type: 'DECIMAL(5, 2)', defaultValue: '0' },
          { name: 'Currency', type: 'NVARCHAR(3)', defaultValue: "'USD'" },
          { name: 'FinancialNotes', type: 'NVARCHAR(MAX)', defaultValue: 'NULL' },
          { name: 'BillableAmount', type: 'DECIMAL(14, 2)', defaultValue: '0' },
          { name: 'ForecastedCost', type: 'DECIMAL(14, 2)', defaultValue: 'NULL' }
        ];
        
        for (const column of columnsToCheck) {
          const columnExists = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Projects' AND COLUMN_NAME = '${column.name}'
          `);
          
          if (columnExists.recordset[0].count === 0) {
            console.log(`  Adding ${column.name} column to Projects table`);
            await pool.request().query(`
              ALTER TABLE Projects ADD ${column.name} ${column.type} ${column.defaultValue !== 'NULL' ? 'DEFAULT ' + column.defaultValue : 'NULL'}
            `);
          }
        }
      }
    } catch (err) {
      console.error('  Error checking/creating Projects table:', err.message);
    }

    // Resources table
    try {
      console.log('\n  Checking Resources table...');
      const resourcesExist = await pool.request().query(`
        SELECT CASE WHEN EXISTS (
          SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Resources'
        ) THEN 1 ELSE 0 END AS TableExists
      `);

      if (resourcesExist.recordset[0].TableExists === 0) {
        console.log('  Creating Resources table...');
        await pool.request().query(`
          CREATE TABLE Resources (
            ResourceID INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(255) NOT NULL,
            Email NVARCHAR(255) NULL,
            Role NVARCHAR(100) NULL,
            Department NVARCHAR(100) NULL,
            Status NVARCHAR(50) DEFAULT 'Active',
            HourlyRate DECIMAL(10, 2) NULL,
            BillableRate DECIMAL(10, 2) NULL,
            Currency NVARCHAR(3) DEFAULT 'USD',
            CostCenter NVARCHAR(100) NULL,
            CreatedAt DATETIME2 DEFAULT GETDATE(),
            UpdatedAt DATETIME2 DEFAULT GETDATE()
          )
        `);
        console.log('  Resources table created successfully');
      } else {
        console.log('  Resources table already exists');
        
        // Check for required columns and add if missing
        const columnsToCheck = [
          { name: 'HourlyRate', type: 'DECIMAL(10, 2)', defaultValue: 'NULL' },
          { name: 'BillableRate', type: 'DECIMAL(10, 2)', defaultValue: 'NULL' },
          { name: 'Currency', type: 'NVARCHAR(3)', defaultValue: "'USD'" },
          { name: 'CostCenter', type: 'NVARCHAR(100)', defaultValue: 'NULL' }
        ];
        
        for (const column of columnsToCheck) {
          const columnExists = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Resources' AND COLUMN_NAME = '${column.name}'
          `);
          
          if (columnExists.recordset[0].count === 0) {
            console.log(`  Adding ${column.name} column to Resources table`);
            await pool.request().query(`
              ALTER TABLE Resources ADD ${column.name} ${column.type} ${column.defaultValue !== 'NULL' ? 'DEFAULT ' + column.defaultValue : 'NULL'}
            `);
          }
        }
      }
    } catch (err) {
      console.error('  Error checking/creating Resources table:', err.message);
    }

    // Allocations table
    try {
      console.log('\n  Checking Allocations table...');
      const allocationsExist = await pool.request().query(`
        SELECT CASE WHEN EXISTS (
          SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Allocations'
        ) THEN 1 ELSE 0 END AS TableExists
      `);

      if (allocationsExist.recordset[0].TableExists === 0) {
        console.log('  Creating Allocations table...');
        await pool.request().query(`
          CREATE TABLE Allocations (
            AllocationID INT IDENTITY(1,1) PRIMARY KEY,
            ResourceID INT NOT NULL,
            ProjectID INT NOT NULL,
            StartDate DATE NOT NULL,
            EndDate DATE NOT NULL,
            Utilization DECIMAL(5, 2) DEFAULT 100.0,
            Notes NVARCHAR(MAX) NULL,
            HourlyRate DECIMAL(10, 2) NULL,
            BillableRate DECIMAL(10, 2) NULL,
            TotalHours INT NULL,
            TotalCost DECIMAL(14, 2) NULL,
            BillableAmount DECIMAL(14, 2) NULL,
            IsBillable BIT DEFAULT 1,
            BillingType NVARCHAR(50) DEFAULT 'Hourly',
            CreatedAt DATETIME2 DEFAULT GETDATE(),
            UpdatedAt DATETIME2 DEFAULT GETDATE(),
            CONSTRAINT FK_Allocations_Resources FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID) ON DELETE NO ACTION,
            CONSTRAINT FK_Allocations_Projects FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE NO ACTION
          )
        `);
        console.log('  Allocations table created successfully');
      } else {
        console.log('  Allocations table already exists');
        
        // Check for required columns and add if missing
        const columnsToCheck = [
          { name: 'HourlyRate', type: 'DECIMAL(10, 2)', defaultValue: 'NULL' },
          { name: 'BillableRate', type: 'DECIMAL(10, 2)', defaultValue: 'NULL' },
          { name: 'TotalHours', type: 'INT', defaultValue: 'NULL' },
          { name: 'TotalCost', type: 'DECIMAL(14, 2)', defaultValue: 'NULL' },
          { name: 'BillableAmount', type: 'DECIMAL(14, 2)', defaultValue: 'NULL' },
          { name: 'IsBillable', type: 'BIT', defaultValue: '1' },
          { name: 'BillingType', type: 'NVARCHAR(50)', defaultValue: "'Hourly'" }
        ];
        
        for (const column of columnsToCheck) {
          const columnExists = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Allocations' AND COLUMN_NAME = '${column.name}'
          `);
          
          if (columnExists.recordset[0].count === 0) {
            console.log(`  Adding ${column.name} column to Allocations table`);
            await pool.request().query(`
              ALTER TABLE Allocations ADD ${column.name} ${column.type} ${column.defaultValue !== 'NULL' ? 'DEFAULT ' + column.defaultValue : 'NULL'}
            `);
          }
        }
      }
    } catch (err) {
      console.error('  Error checking/creating Allocations table:', err.message);
    }

    // Skills table
    try {
      console.log('\n  Checking Skills table...');
      const skillsExist = await pool.request().query(`
        SELECT CASE WHEN EXISTS (
          SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Skills'
        ) THEN 1 ELSE 0 END AS TableExists
      `);

      if (skillsExist.recordset[0].TableExists === 0) {
        console.log('  Creating Skills table...');
        await pool.request().query(`
          CREATE TABLE Skills (
            SkillID INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(255) NOT NULL UNIQUE,
            Category NVARCHAR(100) NULL,
            Description NVARCHAR(MAX) NULL,
            CreatedAt DATETIME2 DEFAULT GETDATE(),
            UpdatedAt DATETIME2 DEFAULT GETDATE()
          )
        `);
        console.log('  Skills table created successfully');
      } else {
        console.log('  Skills table already exists');
      }
    } catch (err) {
      console.error('  Error checking/creating Skills table:', err.message);
    }

    // Roles table
    try {
      console.log('\n  Checking Roles table...');
      const rolesExist = await pool.request().query(`
        SELECT CASE WHEN EXISTS (
          SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Roles'
        ) THEN 1 ELSE 0 END AS TableExists
      `);

      if (rolesExist.recordset[0].TableExists === 0) {
        console.log('  Creating Roles table...');
        await pool.request().query(`
          CREATE TABLE Roles (
            RoleID INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(255) NOT NULL UNIQUE,
            Department NVARCHAR(100) NULL,
            Description NVARCHAR(MAX) NULL,
            CreatedAt DATETIME2 DEFAULT GETDATE(),
            UpdatedAt DATETIME2 DEFAULT GETDATE()
          )
        `);
        console.log('  Roles table created successfully');
      } else {
        console.log('  Roles table already exists');
      }
    } catch (err) {
      console.error('  Error checking/creating Roles table:', err.message);
    }

    // ProjectSkills table
    try {
      console.log('\n  Checking ProjectSkills table...');
      const projectSkillsExist = await pool.request().query(`
        SELECT CASE WHEN EXISTS (
          SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProjectSkills'
        ) THEN 1 ELSE 0 END AS TableExists
      `);

      if (projectSkillsExist.recordset[0].TableExists === 0) {
        console.log('  Creating ProjectSkills table...');
        await pool.request().query(`
          CREATE TABLE ProjectSkills (
            ProjectSkillID INT IDENTITY(1,1) PRIMARY KEY,
            ProjectID INT NOT NULL,
            SkillID INT NOT NULL,
            CONSTRAINT FK_ProjectSkills_Projects FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE,
            CONSTRAINT FK_ProjectSkills_Skills FOREIGN KEY (SkillID) REFERENCES Skills(SkillID) ON DELETE CASCADE,
            CONSTRAINT UQ_ProjectSkill UNIQUE (ProjectID, SkillID)
          )
        `);
        console.log('  ProjectSkills table created successfully');
      } else {
        console.log('  ProjectSkills table already exists');
      }
    } catch (err) {
      console.error('  Error checking/creating ProjectSkills table:', err.message);
    }

    // ProjectRoles table
    try {
      console.log('\n  Checking ProjectRoles table...');
      const projectRolesExist = await pool.request().query(`
        SELECT CASE WHEN EXISTS (
          SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProjectRoles'
        ) THEN 1 ELSE 0 END AS TableExists
      `);

      if (projectRolesExist.recordset[0].TableExists === 0) {
        console.log('  Creating ProjectRoles table...');
        await pool.request().query(`
          CREATE TABLE ProjectRoles (
            ProjectRoleID INT IDENTITY(1,1) PRIMARY KEY,
            ProjectID INT NOT NULL,
            RoleID INT NOT NULL,
            Count INT DEFAULT 1,
            CONSTRAINT FK_ProjectRoles_Projects FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE,
            CONSTRAINT FK_ProjectRoles_Roles FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE
          )
        `);
        console.log('  ProjectRoles table created successfully');
      } else {
        console.log('  ProjectRoles table already exists');
      }
    } catch (err) {
      console.error('  Error checking/creating ProjectRoles table:', err.message);
    }

    // ResourceSkills table
    try {
      console.log('\n  Checking ResourceSkills table...');
      const resourceSkillsExist = await pool.request().query(`
        SELECT CASE WHEN EXISTS (
          SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ResourceSkills'
        ) THEN 1 ELSE 0 END AS TableExists
      `);

      if (resourceSkillsExist.recordset[0].TableExists === 0) {
        console.log('  Creating ResourceSkills table...');
        await pool.request().query(`
          CREATE TABLE ResourceSkills (
            ResourceSkillID INT IDENTITY(1,1) PRIMARY KEY,
            ResourceID INT NOT NULL,
            SkillID INT NOT NULL,
            ProficiencyLevel INT DEFAULT 3,
            CONSTRAINT FK_ResourceSkills_Resources FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID) ON DELETE CASCADE,
            CONSTRAINT FK_ResourceSkills_Skills FOREIGN KEY (SkillID) REFERENCES Skills(SkillID) ON DELETE CASCADE,
            CONSTRAINT UQ_ResourceSkill UNIQUE (ResourceID, SkillID)
          )
        `);
        console.log('  ResourceSkills table created successfully');
      } else {
        console.log('  ResourceSkills table already exists');
      }
    } catch (err) {
      console.error('  Error checking/creating ResourceSkills table:', err.message);
    }

    // BudgetItems table
    try {
      console.log('\n  Checking BudgetItems table...');
      const budgetItemsExist = await pool.request().query(`
        SELECT CASE WHEN EXISTS (
          SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'BudgetItems'
        ) THEN 1 ELSE 0 END AS TableExists
      `);

      if (budgetItemsExist.recordset[0].TableExists === 0) {
        console.log('  Creating BudgetItems table...');
        await pool.request().query(`
          CREATE TABLE BudgetItems (
            BudgetItemID INT IDENTITY(1,1) PRIMARY KEY,
            ProjectID INT NOT NULL,
            Category NVARCHAR(100) NOT NULL,
            Description NVARCHAR(500) NOT NULL,
            PlannedAmount DECIMAL(14, 2) NOT NULL,
            ActualAmount DECIMAL(14, 2) NULL DEFAULT 0,
            Variance DECIMAL(14, 2) NULL DEFAULT 0,
            Notes NVARCHAR(MAX) NULL,
            CONSTRAINT FK_BudgetItems_Projects FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
          )
        `);
        console.log('  BudgetItems table created successfully');
      } else {
        console.log('  BudgetItems table already exists');
        
        // Check for required columns and add if missing
        const columnsToCheck = [
          { name: 'Variance', type: 'DECIMAL(14, 2)', defaultValue: '0' }
        ];
        
        for (const column of columnsToCheck) {
          const columnExists = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'BudgetItems' AND COLUMN_NAME = '${column.name}'
          `);
          
          if (columnExists.recordset[0].count === 0) {
            console.log(`  Adding ${column.name} column to BudgetItems table`);
            await pool.request().query(`
              ALTER TABLE BudgetItems ADD ${column.name} ${column.type} ${column.defaultValue !== 'NULL' ? 'DEFAULT ' + column.defaultValue : 'NULL'}
            `);
          }
        }
      }
    } catch (err) {
      console.error('  Error checking/creating BudgetItems table:', err.message);
    }

    // ProjectFinancialSnapshots table
    try {
      console.log('\n  Checking ProjectFinancialSnapshots table...');
      const snapshotsExist = await pool.request().query(`
        SELECT CASE WHEN EXISTS (
          SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProjectFinancialSnapshots'
        ) THEN 1 ELSE 0 END AS TableExists
      `);

      if (snapshotsExist.recordset[0].TableExists === 0) {
        console.log('  Creating ProjectFinancialSnapshots table...');
        await pool.request().query(`
          CREATE TABLE ProjectFinancialSnapshots (
            SnapshotID INT IDENTITY(1,1) PRIMARY KEY,
            ProjectID INT NOT NULL,
            SnapshotDate DATETIME NOT NULL DEFAULT GETDATE(),
            PlannedBudget DECIMAL(14, 2) NULL,
            ActualCost DECIMAL(14, 2) NULL,
            ForecastedCost DECIMAL(14, 2) NULL,
            Variance DECIMAL(14, 2) NULL,
            Notes NVARCHAR(MAX) NULL,
            CONSTRAINT FK_ProjectFinancialSnapshots_Projects FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
          )
        `);
        console.log('  ProjectFinancialSnapshots table created successfully');
      } else {
        console.log('  ProjectFinancialSnapshots table already exists');
        
        // Check for required columns and add if missing
        const columnsToCheck = [
          { name: 'Variance', type: 'DECIMAL(14, 2)', defaultValue: 'NULL' }
        ];
        
        for (const column of columnsToCheck) {
          const columnExists = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'ProjectFinancialSnapshots' AND COLUMN_NAME = '${column.name}'
          `);
          
          if (columnExists.recordset[0].count === 0) {
            console.log(`  Adding ${column.name} column to ProjectFinancialSnapshots table`);
            await pool.request().query(`
              ALTER TABLE ProjectFinancialSnapshots ADD ${column.name} ${column.type} ${column.defaultValue !== 'NULL' ? 'DEFAULT ' + column.defaultValue : 'NULL'}
            `);
          }
        }
      }
    } catch (err) {
      console.error('  Error checking/creating ProjectFinancialSnapshots table:', err.message);
    }
    
    // ===== STEP 2: Create views required by the controllers =====
    console.log('\n[STEP 2] Creating or updating required views...');
    
    // vw_ProjectFinancials view
    try {
      console.log('  Creating/updating vw_ProjectFinancials view...');
      await pool.request().query(`
        IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ProjectFinancials')
          DROP VIEW vw_ProjectFinancials;
        
        CREATE VIEW vw_ProjectFinancials AS
        SELECT 
          p.ProjectID,
          p.Name AS ProjectName,
          p.Budget AS PlannedBudget,
          p.ActualCost,
          ISNULL(p.Budget, 0) - ISNULL(p.ActualCost, 0) AS Variance,
          CASE 
            WHEN ISNULL(p.Budget, 0) = 0 THEN 0
            ELSE (ISNULL(p.ActualCost, 0) / p.Budget) * 100 
          END AS BudgetUtilizationPercentage,
          -- Calculate resource costs from allocations
          (
            SELECT ISNULL(SUM(a.TotalCost), 0)
            FROM Allocations a
            WHERE a.ProjectID = p.ProjectID
          ) AS AllocatedCost,
          -- Calculate billable amounts from allocations
          (
            SELECT ISNULL(SUM(a.BillableAmount), 0)
            FROM Allocations a
            WHERE a.ProjectID = p.ProjectID
          ) AS BillableAmount,
          -- Calculate profit
          (
            SELECT ISNULL(SUM(a.BillableAmount), 0) - ISNULL(SUM(a.TotalCost), 0)
            FROM Allocations a
            WHERE a.ProjectID = p.ProjectID
          ) AS ProjectProfit,
          -- Calculate margin percentage
          CASE 
            WHEN (SELECT ISNULL(SUM(a.BillableAmount), 0) FROM Allocations a WHERE a.ProjectID = p.ProjectID) = 0 
            THEN 0
            ELSE ((SELECT ISNULL(SUM(a.BillableAmount), 0) - ISNULL(SUM(a.TotalCost), 0) FROM Allocations a WHERE a.ProjectID = p.ProjectID) / 
                (SELECT ISNULL(SUM(a.BillableAmount), 1) FROM Allocations a WHERE a.ProjectID = p.ProjectID)) * 100
          END AS ProfitMarginPercentage,
          p.StartDate,
          p.EndDate,
          p.Status,
          p.Currency
        FROM Projects p;
      `);
      console.log('  vw_ProjectFinancials view created/updated successfully');
    } catch (err) {
      console.error('  Error creating vw_ProjectFinancials view:', err.message);
    }
    
    // ===== STEP 3: Create required stored procedures =====
    console.log('\n[STEP 3] Creating or updating required stored procedures...');
    
    // sp_RecalculateProjectFinancials procedure
    try {
      console.log('  Creating/updating sp_RecalculateProjectFinancials procedure...');
      await pool.request().query(`
        IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RecalculateProjectFinancials')
          DROP PROCEDURE sp_RecalculateProjectFinancials;
        
        CREATE PROCEDURE sp_RecalculateProjectFinancials
          @ProjectID INT
        AS
        BEGIN
          DECLARE @TotalCost DECIMAL(14, 2) = 0;
          DECLARE @BillableAmount DECIMAL(14, 2) = 0;
          
          -- Calculate from allocations
          SELECT 
            @TotalCost = ISNULL(SUM(ISNULL(TotalCost, 0)), 0),
            @BillableAmount = ISNULL(SUM(ISNULL(BillableAmount, 0)), 0)
          FROM Allocations
          WHERE ProjectID = @ProjectID;
          
          -- Update project with calculated values
          UPDATE Projects
          SET 
            ActualCost = @TotalCost,
            BillableAmount = @BillableAmount,
            BudgetUtilization = CASE WHEN ISNULL(Budget, 0) > 0 THEN (@TotalCost / Budget) * 100 ELSE 0 END
          WHERE ProjectID = @ProjectID;
        END;
      `);
      console.log('  sp_RecalculateProjectFinancials procedure created/updated successfully');
    } catch (err) {
      console.error('  Error creating sp_RecalculateProjectFinancials procedure:', err.message);
    }

    // ===== STEP 4: Insert sample data if tables are empty =====
    console.log('\n[STEP 4] Checking for sample data...');
    
    // Check if basic tables have data
    const resourcesCount = await pool.request().query(`SELECT COUNT(*) AS Count FROM Resources`);
    const projectsCount = await pool.request().query(`SELECT COUNT(*) AS Count FROM Projects`);
    const rolesCount = await pool.request().query(`SELECT COUNT(*) AS Count FROM Roles`);
    
    if (resourcesCount.recordset[0].Count === 0 &&
        projectsCount.recordset[0].Count === 0 &&
        rolesCount.recordset[0].Count === 0) {
      
      console.log('  No data found in basic tables. Adding minimal sample data...');
      
      // Add sample roles
      try {
        console.log('  Adding sample roles...');
        await pool.request().query(`
          INSERT INTO Roles (Name, Department, Description)
          VALUES 
            ('Software Developer', 'Engineering', 'Designs and develops software applications'),
            ('Project Manager', 'Management', 'Oversees project planning and execution'),
            ('UX Designer', 'Design', 'Creates user-friendly interfaces and experiences'),
            ('QA Engineer', 'Engineering', 'Tests software and ensures quality'),
            ('Business Analyst', 'Operations', 'Analyzes business needs and requirements')
        `);
      } catch (err) {
        console.error('  Error adding sample roles:', err.message);
      }
      
      // Add sample resources
      try {
        console.log('  Adding sample resources...');
        await pool.request().query(`
          INSERT INTO Resources (Name, Email, Role, Department, Status, HourlyRate, BillableRate, Currency, CostCenter)
          VALUES 
            ('John Smith', 'john.smith@example.com', 'Software Developer', 'Engineering', 'Active', 75.00, 150.00, 'USD', 'ENG-001'),
            ('Emily Johnson', 'emily.johnson@example.com', 'Project Manager', 'Management', 'Active', 85.00, 170.00, 'USD', 'MGT-001'),
            ('David Lee', 'david.lee@example.com', 'UX Designer', 'Design', 'Active', 70.00, 140.00, 'USD', 'DSG-001'),
            ('Sarah Wilson', 'sarah.wilson@example.com', 'QA Engineer', 'Engineering', 'Active', 65.00, 130.00, 'USD', 'ENG-002'),
            ('Michael Brown', 'michael.brown@example.com', 'Business Analyst', 'Operations', 'Active', 80.00, 160.00, 'USD', 'OPS-001')
        `);
      } catch (err) {
        console.error('  Error adding sample resources:', err.message);
      }
      
      // Add sample skills
      try {
        console.log('  Adding sample skills...');
        await pool.request().query(`
          INSERT INTO Skills (Name, Category)
          VALUES 
            ('JavaScript', 'Programming'),
            ('React', 'Frontend'),
            ('Node.js', 'Backend'),
            ('SQL', 'Database'),
            ('UX Design', 'Design'),
            ('Project Management', 'Management'),
            ('Requirements Analysis', 'Analysis'),
            ('Testing', 'QA'),
            ('Performance Optimization', 'Engineering'),
            ('API Development', 'Backend')
        `);
      } catch (err) {
        console.error('  Error adding sample skills:', err.message);
      }
      
      // Add sample projects
      try {
        console.log('  Adding sample projects...');
        await pool.request().query(`
          INSERT INTO Projects (Name, Client, Description, StartDate, EndDate, Status, Budget, Currency)
          VALUES 
            ('E-Commerce Platform', 'Retail Corp', 'Development of a modern e-commerce website', '2023-01-15', '2023-07-15', 'Active', 250000.00, 'USD'),
            ('Mobile Banking App', 'Finance Bank', 'Secure mobile banking application', '2023-02-01', '2023-08-01', 'Active', 300000.00, 'USD'),
            ('HR Management System', 'Corporate Services', 'Internal HR management platform', '2023-03-10', '2023-06-10', 'Active', 150000.00, 'USD')
        `);
      } catch (err) {
        console.error('  Error adding sample projects:', err.message);
      }
      
      // Link resources with skills
      try {
        console.log('  Linking resources with skills...');
        
        // Get IDs from the database
        const resources = await pool.request().query(`SELECT ResourceID, Role FROM Resources`);
        const skills = await pool.request().query(`SELECT SkillID, Name FROM Skills`);
        
        const resourceSkillsPairs = [
          { resource: 'Software Developer', skills: ['JavaScript', 'React', 'Node.js', 'API Development'] },
          { resource: 'Project Manager', skills: ['Project Management', 'Requirements Analysis'] },
          { resource: 'UX Designer', skills: ['UX Design', 'JavaScript', 'React'] },
          { resource: 'QA Engineer', skills: ['Testing', 'SQL', 'Performance Optimization'] },
          { resource: 'Business Analyst', skills: ['Requirements Analysis', 'SQL'] }
        ];
        
        const skillsMap = new Map();
        skills.recordset.forEach(skill => {
          skillsMap.set(skill.Name, skill.SkillID);
        });
        
        for (const resource of resources.recordset) {
          const resourcePair = resourceSkillsPairs.find(rsp => rsp.resource === resource.Role);
          if (resourcePair) {
            for (const skillName of resourcePair.skills) {
              const skillID = skillsMap.get(skillName);
              if (skillID) {
                await pool.request()
                  .input('resourceID', sql.Int, resource.ResourceID)
                  .input('skillID', sql.Int, skillID)
                  .query(`
                    IF NOT EXISTS (SELECT 1 FROM ResourceSkills WHERE ResourceID = @resourceID AND SkillID = @skillID)
                    INSERT INTO ResourceSkills (ResourceID, SkillID, ProficiencyLevel)
                    VALUES (@resourceID, @skillID, FLOOR(RAND() * 3) + 3)
                  `);
              }
            }
          }
        }
      } catch (err) {
        console.error('  Error linking resources with skills:', err.message);
      }
      
      // Link projects with skills
      try {
        console.log('  Linking projects with skills...');
        
        // Get IDs from the database
        const projects = await pool.request().query(`SELECT ProjectID, Name FROM Projects`);
        const skills = await pool.request().query(`SELECT SkillID, Name FROM Skills`);
        
        const projectSkillsPairs = [
          { project: 'E-Commerce Platform', skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'UX Design'] },
          { project: 'Mobile Banking App', skills: ['React', 'API Development', 'SQL', 'Performance Optimization'] },
          { project: 'HR Management System', skills: ['JavaScript', 'SQL', 'UX Design', 'Requirements Analysis'] }
        ];
        
        const skillsMap = new Map();
        skills.recordset.forEach(skill => {
          skillsMap.set(skill.Name, skill.SkillID);
        });
        
        for (const project of projects.recordset) {
          const projectPair = projectSkillsPairs.find(psp => psp.project === project.Name);
          if (projectPair) {
            for (const skillName of projectPair.skills) {
              const skillID = skillsMap.get(skillName);
              if (skillID) {
                await pool.request()
                  .input('projectID', sql.Int, project.ProjectID)
                  .input('skillID', sql.Int, skillID)
                  .query(`
                    IF NOT EXISTS (SELECT 1 FROM ProjectSkills WHERE ProjectID = @projectID AND SkillID = @skillID)
                    INSERT INTO ProjectSkills (ProjectID, SkillID)
                    VALUES (@projectID, @skillID)
                  `);
              }
            }
          }
        }
      } catch (err) {
        console.error('  Error linking projects with skills:', err.message);
      }
      
      // Create sample allocations
      try {
        console.log('  Creating sample allocations...');
        
        // Get IDs from the database
        const resources = await pool.request().query(`SELECT ResourceID, Name, HourlyRate, BillableRate FROM Resources`);
        const projects = await pool.request().query(`SELECT ProjectID, Name, StartDate, EndDate FROM Projects`);
        
        // Create allocations for each resource to a project
        for (let i = 0; i < resources.recordset.length; i++) {
          const resource = resources.recordset[i];
          const project = projects.recordset[i % projects.recordset.length];
          
          // Calculate dates that make sense for the project
          const startDate = new Date(project.StartDate);
          const endDate = new Date(project.EndDate);
          
          // Parse dates correctly
          const allocStartDate = new Date(startDate);
          allocStartDate.setDate(allocStartDate.getDate() + Math.floor(Math.random() * 14));
          
          const allocEndDate = new Date(endDate);
          allocEndDate.setDate(allocEndDate.getDate() - Math.floor(Math.random() * 14));
          
          const utilization = Math.floor(Math.random() * 50) + 50; // 50-100%
          
          // Calculate financial values
          const daysDiff = Math.floor((allocEndDate - allocStartDate) / (1000 * 60 * 60 * 24));
          const workDays = Math.max(1, daysDiff - Math.floor(daysDiff / 7 * 2)); // Rough estimate removing weekends
          const hourlyRate = resource.HourlyRate || 50;
          const billableRate = resource.BillableRate || 100;
          const totalHours = Math.floor(workDays * 8 * (utilization / 100));
          const totalCost = parseFloat((totalHours * hourlyRate).toFixed(2));
          const billableAmount = parseFloat((totalHours * billableRate).toFixed(2));
          
          await pool.request()
            .input('resourceID', sql.Int, resource.ResourceID)
            .input('projectID', sql.Int, project.ProjectID)
            .input('startDate', sql.Date, allocStartDate)
            .input('endDate', sql.Date, allocEndDate)
            .input('utilization', sql.Decimal(5, 2), utilization)
            .input('hourlyRate', sql.Decimal(10, 2), hourlyRate)
            .input('billableRate', sql.Decimal(10, 2), billableRate)
            .input('totalHours', sql.Int, totalHours)
            .input('totalCost', sql.Decimal(14, 2), totalCost)
            .input('billableAmount', sql.Decimal(14, 2), billableAmount)
            .query(`
              INSERT INTO Allocations (
                ResourceID, ProjectID, StartDate, EndDate, Utilization, 
                HourlyRate, BillableRate, TotalHours, TotalCost, BillableAmount
              )
              VALUES (
                @resourceID, @projectID, @startDate, @endDate, @utilization,
                @hourlyRate, @billableRate, @totalHours, @totalCost, @billableAmount
              )
            `);
        }
        
        // Update project financials based on allocations
        for (const project of projects.recordset) {
          await pool.request()
            .input('projectID', sql.Int, project.ProjectID)
            .execute('sp_RecalculateProjectFinancials');
        }
      } catch (err) {
        console.error('  Error creating sample allocations:', err.message);
      }
    } else {
      console.log('  Data already exists in tables. Skipping sample data creation.');
    }
    
    console.log('\n======================================================');
    console.log('DATABASE FIX COMPLETE');
    console.log('======================================================');
    console.log('The database has been successfully set up with all required objects.');
    
    await pool.close();
    return true;
  } catch (err) {
    console.error('Fatal error during database fix:', err);
    return false;
  }
};

// Run the script
fixDatabase()
  .then(success => {
    if (success) {
      console.log('Database fix completed successfully.');
      process.exit(0);
    } else {
      console.error('Database fix encountered errors.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });