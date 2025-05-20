/**
 * Update the vw_ProjectFinancials view to use the correct profit calculation
 */

const { poolPromise, sql } = require('./db/config');

const updateFinancialView = async () => {
  try {
    console.log('Updating vw_ProjectFinancials view with correct profit calculation...');
    
    const pool = await poolPromise;
    
    // Drop view if it exists
    try {
      await pool.request().query(`
        IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ProjectFinancials')
        DROP VIEW vw_ProjectFinancials
      `);
      console.log('Existing view dropped.');
    } catch (err) {
      console.error('Error dropping existing view:', err.message);
    }
    
    // Create the updated view with correct profit calculation
    try {
      await pool.request().query(`
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
          -- NEW: Calculate profit using estimated revenue (Budget * 1.30) - ActualCost
          (ISNULL(p.Budget, 0) * 1.30) - ISNULL(p.ActualCost, 0) AS ProjectProfit,
          -- NEW: Calculate margin percentage using estimated revenue
          CASE 
            WHEN (ISNULL(p.Budget, 0) * 1.30) = 0 
            THEN 0
            ELSE (((ISNULL(p.Budget, 0) * 1.30) - ISNULL(p.ActualCost, 0)) / (ISNULL(p.Budget, 0) * 1.30)) * 100
          END AS ProfitMarginPercentage,
          -- Add estimated revenue field for clarity
          ISNULL(p.Budget, 0) * 1.30 AS EstimatedRevenue,
          p.StartDate,
          p.EndDate,
          p.Status,
          p.Currency
        FROM Projects p
      `);
      console.log('View updated successfully with new profit calculation.');
      console.log('New calculation: ProjectProfit = (Budget * 1.30) - ActualCost');
    } catch (err) {
      console.error('Error creating updated view:', err.message);
      throw err;
    }
    
    // Test the view
    try {
      console.log('Testing updated view...');
      const testResult = await pool.request().query(`
        SELECT TOP 5 
          ProjectName,
          PlannedBudget,
          EstimatedRevenue,
          ActualCost,
          ProjectProfit,
          ProfitMarginPercentage
        FROM vw_ProjectFinancials
        WHERE PlannedBudget > 0
        ORDER BY ProjectName
      `);
      
      console.log('Sample data from updated view:');
      testResult.recordset.forEach(row => {
        console.log(`- ${row.ProjectName}: Budget=$${row.PlannedBudget}, Est.Revenue=$${row.EstimatedRevenue}, Cost=$${row.ActualCost}, Profit=$${row.ProjectProfit}`);
      });
    } catch (err) {
      console.error('Error testing view:', err.message);
    }
    
    console.log('Financial view update complete.');
    
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
};

updateFinancialView();