/**
 * Create required stored procedures for the application
 */

const { poolPromise, sql } = require('./config');

const createProcedures = async () => {
  try {
    console.log('Creating sp_RecalculateProjectFinancials procedure...');
    
    const pool = await poolPromise;
    
    // Drop procedure if it exists
    try {
      await pool.request().query(`
        IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RecalculateProjectFinancials')
        DROP PROCEDURE sp_RecalculateProjectFinancials
      `);
      console.log('Existing procedure dropped.');
    } catch (err) {
      console.error('Error dropping existing procedure:', err.message);
    }
    
    // Create the procedure
    try {
      await pool.request().query(`
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
        END
      `);
      console.log('Procedure created successfully.');
    } catch (err) {
      console.error('Error creating procedure:', err.message);
    }
    
    await pool.close();
    console.log('Procedure creation complete.');
    
  } catch (err) {
    console.error('Fatal error:', err);
  }
};

createProcedures();