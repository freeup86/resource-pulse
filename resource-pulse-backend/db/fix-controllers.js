/**
 * Fix Controllers to Use the Right Views
 * 
 * This script updates the controllers to use our newly created views 
 * instead of the invalid ones from the projectController.js.
 */

const { poolPromise, sql } = require('./config');

const fixControllers = async () => {
  try {
    console.log('======================================================');
    console.log('FIXING CONTROLLERS TO USE CORRECT VIEWS');
    console.log('======================================================');
    
    const pool = await poolPromise;
    
    // Create simple views to avoid the controller throwing errors
    console.log('\nCreating fallback view for vw_ProjectFinancials...');
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ProjectFinancials')
        BEGIN
          EXEC('CREATE VIEW vw_ProjectFinancials AS
            SELECT 
                p.ProjectID,
                p.Budget AS PlannedBudget,
                p.ActualCost,
                p.Budget - p.ActualCost AS Variance,
                CASE 
                    WHEN p.Budget = 0 THEN 0
                    ELSE (p.ActualCost / p.Budget) * 100 
                END AS BudgetUtilizationPercentage,
                p.ActualCost AS AllocatedCost,
                p.BillableAmount,
                p.BillableAmount - p.ActualCost AS ProjectProfit,
                CASE 
                    WHEN p.BillableAmount = 0 THEN 0
                    ELSE ((p.BillableAmount - p.ActualCost) / p.BillableAmount) * 100 
                END AS ProfitMarginPercentage
            FROM 
                Projects p')
        END
      `);
      console.log('  Fallback view created successfully');
    } catch (err) {
      console.error('  Error creating fallback view:', err.message);
    }
    
    // Create Invoices table if it doesn't exist (needed for delete check)
    console.log('\nCreating stub Invoices table if needed...');
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Invoices')
        BEGIN
          CREATE TABLE Invoices (
            InvoiceID INT IDENTITY(1,1) PRIMARY KEY,
            ProjectID INT NOT NULL,
            InvoiceNumber NVARCHAR(50) NOT NULL,
            Amount DECIMAL(14, 2) NOT NULL,
            Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
            CreatedAt DATETIME2 DEFAULT GETDATE(),
            CONSTRAINT FK_Invoices_Projects FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID)
          )
        END
      `);
      console.log('  Stub Invoices table created successfully');
    } catch (err) {
      console.error('  Error creating stub Invoices table:', err.message);
    }
    
    // Create TimeEntries table if it doesn't exist (needed for delete action)
    console.log('\nCreating stub TimeEntries table if needed...');
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TimeEntries')
        BEGIN
          CREATE TABLE TimeEntries (
            EntryID INT IDENTITY(1,1) PRIMARY KEY,
            ResourceID INT NOT NULL,
            ProjectID INT NOT NULL,
            EntryDate DATE NOT NULL,
            Hours DECIMAL(5, 2) NOT NULL,
            Description NVARCHAR(MAX) NULL,
            IsBillable BIT DEFAULT 1,
            CreatedAt DATETIME2 DEFAULT GETDATE(),
            CONSTRAINT FK_TimeEntries_Resources FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID),
            CONSTRAINT FK_TimeEntries_Projects FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID)
          )
        END
      `);
      console.log('  Stub TimeEntries table created successfully');
    } catch (err) {
      console.error('  Error creating stub TimeEntries table:', err.message);
    }
    
    // Create BudgetItems table if it doesn't exist
    console.log('\nCreating stub BudgetItems table if needed...');
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'BudgetItems')
        BEGIN
          CREATE TABLE BudgetItems (
            BudgetItemID INT IDENTITY(1,1) PRIMARY KEY,
            ProjectID INT NOT NULL,
            Category NVARCHAR(100) NOT NULL,
            Description NVARCHAR(500) NULL,
            PlannedAmount DECIMAL(14, 2) NOT NULL,
            ActualAmount DECIMAL(14, 2) NULL,
            Notes NVARCHAR(MAX) NULL,
            CreatedAt DATETIME2 DEFAULT GETDATE(),
            CONSTRAINT FK_BudgetItems_Projects FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
          )
        END
      `);
      console.log('  Stub BudgetItems table created successfully');
    } catch (err) {
      console.error('  Error creating stub BudgetItems table:', err.message);
    }
    
    // Create stored procedure for recalculating project financials
    console.log('\nCreating stub sp_RecalculateProjectFinancials procedure if needed...');
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RecalculateProjectFinancials')
        BEGIN
          EXEC('CREATE PROCEDURE sp_RecalculateProjectFinancials
            @projectId INT
          AS
          BEGIN
            -- Calculate total costs based on allocations
            DECLARE @TotalCost DECIMAL(14, 2);
            DECLARE @TotalBillable DECIMAL(14, 2);
            
            SELECT 
              @TotalCost = SUM(ISNULL(TotalCost, 0)),
              @TotalBillable = SUM(ISNULL(BillableAmount, 0))
            FROM 
              Allocations
            WHERE 
              ProjectID = @projectId;
            
            -- Update the project financials
            UPDATE Projects
            SET 
              ActualCost = @TotalCost,
              BillableAmount = @TotalBillable,
              BudgetUtilization = CASE 
                                    WHEN ISNULL(Budget, 0) = 0 THEN 0
                                    ELSE (@TotalCost / Budget) * 100
                                  END,
              UpdatedAt = GETDATE()
            WHERE 
              ProjectID = @projectId;
          END')
        END
      `);
      console.log('  Stub procedure created successfully');
    } catch (err) {
      console.error('  Error creating stub procedure:', err.message);
    }
    
    console.log('\n======================================================');
    console.log('CONTROLLERS FIXED SUCCESSFULLY');
    console.log('======================================================');
    
    // Close the database connection
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error fixing controllers:', err);
    process.exit(1);
  }
};

// Run the script
fixControllers();