/**
 * Create Financial Views
 * 
 * This script creates or updates the views needed for financial data.
 */

const { poolPromise, sql } = require('./config');

const createFinancialViews = async () => {
  try {
    console.log('======================================================');
    console.log('CREATING FINANCIAL VIEWS');
    console.log('======================================================');
    
    const pool = await poolPromise;
    
    // Create or update ProjectFinancialMetrics view
    console.log('\nCreating/updating ProjectFinancialMetrics view...');
    try {
      await pool.request().query(`
        CREATE OR ALTER VIEW ProjectFinancialMetrics AS
        SELECT 
            p.ProjectID,
            p.Name AS ProjectName,
            p.Budget,
            p.ActualCost,
            p.BillableAmount,
            ISNULL(p.Budget, 0) - ISNULL(p.ActualCost, 0) AS Variance,
            CASE 
                WHEN ISNULL(p.Budget, 0) = 0 THEN 0
                ELSE (ISNULL(p.ActualCost, 0) / ISNULL(p.Budget, 0)) * 100 
            END AS BudgetUtilizationPercentage,
            ISNULL(p.BillableAmount, 0) - ISNULL(p.ActualCost, 0) AS Profit,
            CASE 
                WHEN ISNULL(p.BillableAmount, 0) = 0 THEN 0
                ELSE ((ISNULL(p.BillableAmount, 0) - ISNULL(p.ActualCost, 0)) / ISNULL(p.BillableAmount, 0)) * 100 
            END AS ProfitMargin,
            p.Currency,
            p.FinancialNotes
        FROM 
            Projects p;
      `);
      console.log('  ProjectFinancialMetrics view created/updated successfully');
    } catch (err) {
      console.error('  Error creating ProjectFinancialMetrics view:', err.message);
    }
    
    // Create or update ResourceFinancialMetrics view
    console.log('\nCreating/updating ResourceFinancialMetrics view...');
    try {
      await pool.request().query(`
        CREATE OR ALTER VIEW ResourceFinancialMetrics AS
        SELECT 
            r.ResourceID,
            r.Name AS ResourceName,
            r.HourlyRate,
            r.BillableRate,
            r.Currency,
            r.CostCenter,
            COUNT(a.AllocationID) AS TotalAllocations,
            SUM(a.TotalHours) AS TotalAllocatedHours,
            SUM(a.TotalCost) AS TotalCost,
            SUM(a.BillableAmount) AS TotalBillableAmount,
            SUM(a.BillableAmount) - SUM(a.TotalCost) AS TotalProfit,
            CASE 
                WHEN SUM(a.BillableAmount) = 0 THEN 0
                ELSE ((SUM(a.BillableAmount) - SUM(a.TotalCost)) / SUM(a.BillableAmount)) * 100 
            END AS ProfitMargin,
            SUM(CASE WHEN a.IsBillable = 1 THEN (a.Utilization * DATEDIFF(DAY, a.StartDate, a.EndDate)) ELSE 0 END) / 
                NULLIF(SUM(a.Utilization * DATEDIFF(DAY, a.StartDate, a.EndDate)), 0) * 100 AS BillablePercentage
        FROM 
            Resources r
        LEFT JOIN 
            Allocations a ON r.ResourceID = a.ResourceID
        GROUP BY 
            r.ResourceID, r.Name, r.HourlyRate, r.BillableRate, r.Currency, r.CostCenter;
      `);
      console.log('  ResourceFinancialMetrics view created/updated successfully');
    } catch (err) {
      console.error('  Error creating ResourceFinancialMetrics view:', err.message);
    }
    
    // Create or update AllocationFinancialMetrics view
    console.log('\nCreating/updating AllocationFinancialMetrics view...');
    try {
      await pool.request().query(`
        CREATE OR ALTER VIEW AllocationFinancialMetrics AS
        SELECT 
            a.AllocationID,
            a.ResourceID,
            r.Name AS ResourceName,
            a.ProjectID,
            p.Name AS ProjectName,
            a.StartDate,
            a.EndDate,
            a.Utilization,
            COALESCE(a.HourlyRate, r.HourlyRate) AS HourlyRate,
            COALESCE(a.BillableRate, r.BillableRate) AS BillableRate,
            a.TotalHours,
            a.TotalCost,
            a.BillableAmount,
            a.IsBillable,
            a.BillableAmount - a.TotalCost AS Profit,
            CASE 
                WHEN a.BillableAmount = 0 THEN 0
                ELSE ((a.BillableAmount - a.TotalCost) / a.BillableAmount) * 100 
            END AS ProfitMargin,
            COALESCE(r.Currency, p.Currency, 'USD') AS Currency
        FROM 
            Allocations a
        JOIN 
            Resources r ON a.ResourceID = r.ResourceID
        JOIN 
            Projects p ON a.ProjectID = p.ProjectID;
      `);
      console.log('  AllocationFinancialMetrics view created/updated successfully');
    } catch (err) {
      console.error('  Error creating AllocationFinancialMetrics view:', err.message);
    }
    
    console.log('\n======================================================');
    console.log('FINANCIAL VIEWS CREATED/UPDATED');
    console.log('======================================================');
    
    // Close the database connection
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error creating financial views:', err);
    process.exit(1);
  }
};

// Run the script
createFinancialViews();