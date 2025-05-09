/**
 * Create required views for the application
 */

const { poolPromise, sql } = require('./config');

const createViews = async () => {
  try {
    console.log('Creating vw_ProjectFinancials view...');
    
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
    
    // Create the view
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
        FROM Projects p
      `);
      console.log('View created successfully.');
    } catch (err) {
      console.error('Error creating view:', err.message);
    }
    
    await pool.close();
    console.log('View creation complete.');
    
  } catch (err) {
    console.error('Fatal error:', err);
  }
};

createViews();