/**
 * Fix Financial Tables
 * 
 * This script fixes any issues with the financial tables by running the ALTER statements directly.
 */

const { poolPromise, sql } = require('./config');

const fixFinancialTables = async () => {
  try {
    console.log('======================================================');
    console.log('STARTING FINANCIAL TABLES FIX');
    console.log('======================================================');
    
    const pool = await poolPromise;
    
    // Fix Projects table
    console.log('\nChecking and fixing Projects table...');
    
    // Add Budget column if it doesn't exist
    try {
      const checkBudget = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Projects' AND COLUMN_NAME = 'Budget'
      `);
      
      if (checkBudget.recordset[0].count === 0) {
        console.log('  Adding Budget column to Projects table');
        await pool.request().query(`
          ALTER TABLE Projects ADD Budget DECIMAL(14, 2) NULL
        `);
      } else {
        console.log('  Budget column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding Budget column:', err.message);
    }
    
    // Add ActualCost column if it doesn't exist
    try {
      const checkActualCost = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Projects' AND COLUMN_NAME = 'ActualCost'
      `);
      
      if (checkActualCost.recordset[0].count === 0) {
        console.log('  Adding ActualCost column to Projects table');
        await pool.request().query(`
          ALTER TABLE Projects ADD ActualCost DECIMAL(14, 2) NULL
        `);
      } else {
        console.log('  ActualCost column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding ActualCost column:', err.message);
    }
    
    // Add BudgetUtilization column if it doesn't exist
    try {
      const checkBudgetUtilization = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Projects' AND COLUMN_NAME = 'BudgetUtilization'
      `);
      
      if (checkBudgetUtilization.recordset[0].count === 0) {
        console.log('  Adding BudgetUtilization column to Projects table');
        await pool.request().query(`
          ALTER TABLE Projects ADD BudgetUtilization DECIMAL(5, 2) NULL
        `);
      } else {
        console.log('  BudgetUtilization column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding BudgetUtilization column:', err.message);
    }
    
    // Add Currency column if it doesn't exist
    try {
      const checkCurrency = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Projects' AND COLUMN_NAME = 'Currency'
      `);
      
      if (checkCurrency.recordset[0].count === 0) {
        console.log('  Adding Currency column to Projects table');
        await pool.request().query(`
          ALTER TABLE Projects ADD Currency VARCHAR(3) DEFAULT 'USD'
        `);
      } else {
        console.log('  Currency column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding Currency column:', err.message);
    }
    
    // Add FinancialNotes column if it doesn't exist
    try {
      const checkFinancialNotes = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Projects' AND COLUMN_NAME = 'FinancialNotes'
      `);
      
      if (checkFinancialNotes.recordset[0].count === 0) {
        console.log('  Adding FinancialNotes column to Projects table');
        await pool.request().query(`
          ALTER TABLE Projects ADD FinancialNotes NVARCHAR(MAX) NULL
        `);
      } else {
        console.log('  FinancialNotes column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding FinancialNotes column:', err.message);
    }
    
    // Add BillableAmount column if it doesn't exist
    try {
      const checkBillableAmount = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Projects' AND COLUMN_NAME = 'BillableAmount'
      `);
      
      if (checkBillableAmount.recordset[0].count === 0) {
        console.log('  Adding BillableAmount column to Projects table');
        await pool.request().query(`
          ALTER TABLE Projects ADD BillableAmount DECIMAL(14, 2) NULL
        `);
      } else {
        console.log('  BillableAmount column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding BillableAmount column:', err.message);
    }
    
    // Add ForecastedCost column if it doesn't exist
    try {
      const checkForecastedCost = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Projects' AND COLUMN_NAME = 'ForecastedCost'
      `);
      
      if (checkForecastedCost.recordset[0].count === 0) {
        console.log('  Adding ForecastedCost column to Projects table');
        await pool.request().query(`
          ALTER TABLE Projects ADD ForecastedCost DECIMAL(14, 2) NULL
        `);
      } else {
        console.log('  ForecastedCost column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding ForecastedCost column:', err.message);
    }
    
    // Fix Resources table
    console.log('\nChecking and fixing Resources table...');
    
    // Add HourlyRate column if it doesn't exist
    try {
      const checkHourlyRate = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Resources' AND COLUMN_NAME = 'HourlyRate'
      `);
      
      if (checkHourlyRate.recordset[0].count === 0) {
        console.log('  Adding HourlyRate column to Resources table');
        await pool.request().query(`
          ALTER TABLE Resources ADD HourlyRate DECIMAL(10, 2) NULL
        `);
      } else {
        console.log('  HourlyRate column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding HourlyRate column:', err.message);
    }
    
    // Add BillableRate column if it doesn't exist
    try {
      const checkBillableRate = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Resources' AND COLUMN_NAME = 'BillableRate'
      `);
      
      if (checkBillableRate.recordset[0].count === 0) {
        console.log('  Adding BillableRate column to Resources table');
        await pool.request().query(`
          ALTER TABLE Resources ADD BillableRate DECIMAL(10, 2) NULL
        `);
      } else {
        console.log('  BillableRate column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding BillableRate column:', err.message);
    }
    
    // Add Currency column if it doesn't exist
    try {
      const checkCurrency = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Resources' AND COLUMN_NAME = 'Currency'
      `);
      
      if (checkCurrency.recordset[0].count === 0) {
        console.log('  Adding Currency column to Resources table');
        await pool.request().query(`
          ALTER TABLE Resources ADD Currency VARCHAR(3) DEFAULT 'USD'
        `);
      } else {
        console.log('  Currency column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding Currency column:', err.message);
    }
    
    // Add CostCenter column if it doesn't exist
    try {
      const checkCostCenter = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Resources' AND COLUMN_NAME = 'CostCenter'
      `);
      
      if (checkCostCenter.recordset[0].count === 0) {
        console.log('  Adding CostCenter column to Resources table');
        await pool.request().query(`
          ALTER TABLE Resources ADD CostCenter VARCHAR(50) NULL
        `);
      } else {
        console.log('  CostCenter column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding CostCenter column:', err.message);
    }
    
    // Check Allocations table
    console.log('\nChecking and fixing Allocations table...');
    
    // Add HourlyRate column if it doesn't exist
    try {
      const checkHourlyRate = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Allocations' AND COLUMN_NAME = 'HourlyRate'
      `);
      
      if (checkHourlyRate.recordset[0].count === 0) {
        console.log('  Adding HourlyRate column to Allocations table');
        await pool.request().query(`
          ALTER TABLE Allocations ADD HourlyRate DECIMAL(10, 2) NULL
        `);
      } else {
        console.log('  HourlyRate column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding HourlyRate column:', err.message);
    }
    
    // Add BillableRate column if it doesn't exist
    try {
      const checkBillableRate = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Allocations' AND COLUMN_NAME = 'BillableRate'
      `);
      
      if (checkBillableRate.recordset[0].count === 0) {
        console.log('  Adding BillableRate column to Allocations table');
        await pool.request().query(`
          ALTER TABLE Allocations ADD BillableRate DECIMAL(10, 2) NULL
        `);
      } else {
        console.log('  BillableRate column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding BillableRate column:', err.message);
    }
    
    // Add TotalHours column if it doesn't exist
    try {
      const checkTotalHours = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Allocations' AND COLUMN_NAME = 'TotalHours'
      `);
      
      if (checkTotalHours.recordset[0].count === 0) {
        console.log('  Adding TotalHours column to Allocations table');
        await pool.request().query(`
          ALTER TABLE Allocations ADD TotalHours INT NULL
        `);
      } else {
        console.log('  TotalHours column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding TotalHours column:', err.message);
    }
    
    // Add IsBillable column if it doesn't exist
    try {
      const checkIsBillable = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Allocations' AND COLUMN_NAME = 'IsBillable'
      `);
      
      if (checkIsBillable.recordset[0].count === 0) {
        console.log('  Adding IsBillable column to Allocations table');
        await pool.request().query(`
          ALTER TABLE Allocations ADD IsBillable BIT DEFAULT 1
        `);
      } else {
        console.log('  IsBillable column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding IsBillable column:', err.message);
    }
    
    // Add TotalCost column if it doesn't exist
    try {
      const checkTotalCost = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Allocations' AND COLUMN_NAME = 'TotalCost'
      `);
      
      if (checkTotalCost.recordset[0].count === 0) {
        console.log('  Adding TotalCost column to Allocations table');
        await pool.request().query(`
          ALTER TABLE Allocations ADD TotalCost DECIMAL(14, 2) NULL
        `);
      } else {
        console.log('  TotalCost column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding TotalCost column:', err.message);
    }
    
    // Add BillableAmount column if it doesn't exist
    try {
      const checkBillableAmount = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Allocations' AND COLUMN_NAME = 'BillableAmount'
      `);
      
      if (checkBillableAmount.recordset[0].count === 0) {
        console.log('  Adding BillableAmount column to Allocations table');
        await pool.request().query(`
          ALTER TABLE Allocations ADD BillableAmount DECIMAL(14, 2) NULL
        `);
      } else {
        console.log('  BillableAmount column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding BillableAmount column:', err.message);
    }
    
    // Create ProjectBudgetItems table if it doesn't exist
    console.log('\nChecking and creating ProjectBudgetItems table if needed...');
    try {
      const checkTable = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'ProjectBudgetItems'
      `);
      
      if (checkTable.recordset[0].count === 0) {
        console.log('  Creating ProjectBudgetItems table');
        await pool.request().query(`
          CREATE TABLE ProjectBudgetItems (
            BudgetItemID INT IDENTITY(1,1) PRIMARY KEY,
            ProjectID INT NOT NULL,
            Category VARCHAR(100) NOT NULL,
            Description NVARCHAR(255) NULL,
            PlannedAmount DECIMAL(14, 2) NOT NULL,
            ActualAmount DECIMAL(14, 2) NULL,
            DateCreated DATETIME DEFAULT GETDATE(),
            LastUpdated DATETIME DEFAULT GETDATE(),
            CONSTRAINT FK_ProjectBudgetItems_Projects FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
          )
        `);
      } else {
        console.log('  ProjectBudgetItems table already exists');
      }
    } catch (err) {
      console.error('  Error checking/creating ProjectBudgetItems table:', err.message);
    }
    
    // Create ProjectFinancialSnapshots table if it doesn't exist
    console.log('\nChecking and creating ProjectFinancialSnapshots table if needed...');
    try {
      const checkTable = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'ProjectFinancialSnapshots'
      `);
      
      if (checkTable.recordset[0].count === 0) {
        console.log('  Creating ProjectFinancialSnapshots table');
        await pool.request().query(`
          CREATE TABLE ProjectFinancialSnapshots (
            SnapshotID INT IDENTITY(1,1) PRIMARY KEY,
            ProjectID INT NOT NULL,
            SnapshotDate DATETIME DEFAULT GETDATE(),
            PlannedBudget DECIMAL(14, 2) NULL,
            ActualCost DECIMAL(14, 2) NULL,
            ForecastedCost DECIMAL(14, 2) NULL,
            Notes NVARCHAR(MAX) NULL,
            CreatedBy VARCHAR(100) NULL,
            CONSTRAINT FK_ProjectFinancialSnapshots_Projects FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
          )
        `);
      } else {
        console.log('  ProjectFinancialSnapshots table already exists');
      }
    } catch (err) {
      console.error('  Error checking/creating ProjectFinancialSnapshots table:', err.message);
    }
    
    console.log('\n======================================================');
    console.log('FINANCIAL TABLES FIX COMPLETE');
    console.log('======================================================');
    console.log('The financial tables have been fixed.');
    
    // Close the database connection
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error fixing financial tables:', err);
    process.exit(1);
  }
};

// Run the fix
fixFinancialTables();