// debug-allocation.js
// This script helps debug allocation issues by checking project details and creating a test allocation

const { poolPromise, sql } = require('./db/config');

async function debugProjectById(projectId) {
  try {
    const pool = await poolPromise;
    console.log(`Debug: Checking project with ID ${projectId}`);
    
    // Check project details
    const projectResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          p.ProjectID,
          p.Name,
          p.Client,
          p.ProjectNumber,
          p.StartDate,
          p.EndDate,
          p.Status
        FROM Projects p
        WHERE p.ProjectID = @projectId
      `);
    
    if (projectResult.recordset.length === 0) {
      console.log(`Debug: Project with ID ${projectId} not found`);
      return;
    }
    
    const project = projectResult.recordset[0];
    console.log('Debug: Project found:', project);
    
    // Check existing allocations
    const allocationsResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          a.AllocationID,
          a.ResourceID,
          r.Name AS ResourceName,
          a.StartDate,
          a.EndDate,
          a.Utilization,
          a.CreatedAt,
          a.UpdatedAt
        FROM Allocations a
        INNER JOIN Resources r ON a.ResourceID = r.ResourceID
        WHERE a.ProjectID = @projectId
      `);
    
    console.log(`Debug: Found ${allocationsResult.recordset.length} existing allocations for project`);
    console.log('Debug: Allocations:', allocationsResult.recordset);
    
    // Get available resources
    const resourcesResult = await pool.request()
      .input('projectId', sql.Int, projectId) // Add the missing @projectId input parameter
      .query(`
        SELECT TOP 5
          r.ResourceID,
          r.Name,
          r.Role
        FROM Resources r
        WHERE NOT EXISTS (
          SELECT 1
          FROM Allocations a
          WHERE a.ResourceID = r.ResourceID AND a.ProjectID = @projectId
        )
        ORDER BY r.ResourceID
      `);
    
    if (resourcesResult.recordset.length === 0) {
      console.log('Debug: No available resources found that are not already allocated to this project');
      return;
    }
    
    console.log('Debug: Available resources:', resourcesResult.recordset);
    
    // Try to create a test allocation
    const resourceId = resourcesResult.recordset[0].ResourceID;
    console.log(`Debug: Attempting to create test allocation for resource ID ${resourceId} to project ID ${projectId}`);
    
    // Set allocation data
    const startDate = new Date('2023-06-01');
    const endDate = new Date('2023-09-30');
    const utilization = 25;
    
    // Calculate workdays between dates (excluding weekends)
    const daysDiff = await pool.request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(`
        SELECT 
          DATEDIFF(day, @startDate, @endDate) + 1 AS TotalDays,
          DATEDIFF(day, @startDate, @endDate) + 1 - 
          (2 * DATEDIFF(week, @startDate, @endDate)) AS WorkDays
      `);
    
    const workDays = daysDiff.recordset[0].WorkDays;
    
    // Get resource hourly rate
    const resourceInfo = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT HourlyRate, BillableRate
        FROM Resources
        WHERE ResourceID = @resourceId
      `);
    
    const hourlyRate = resourceInfo.recordset[0].HourlyRate || 50;
    const billableRate = resourceInfo.recordset[0].BillableRate || 100;
    
    // Calculate total allocation hours (8 hours per workday * utilization percentage)
    const totalHours = workDays * 8 * (utilization / 100);
    
    // Calculate financial amounts
    const totalCost = hourlyRate * totalHours;
    const billableAmount = billableRate * totalHours;
    
    console.log('Debug: Allocation parameters:', {
      resourceId,
      projectId,
      startDate,
      endDate,
      utilization,
      hourlyRate,
      billableRate,
      totalHours,
      totalCost,
      billableAmount,
      workDays
    });
    
    // Create the allocation
    try {
      const allocationResult = await pool.request()
        .input('resourceId', sql.Int, resourceId)
        .input('projectId', sql.Int, projectId)
        .input('startDate', sql.Date, startDate)
        .input('endDate', sql.Date, endDate)
        .input('utilization', sql.Int, utilization)
        .input('hourlyRate', sql.Decimal(10, 2), hourlyRate)
        .input('billableRate', sql.Decimal(10, 2), billableRate)
        .input('totalHours', sql.Int, totalHours)
        .input('totalCost', sql.Decimal(14, 2), totalCost)
        .input('billableAmount', sql.Decimal(14, 2), billableAmount)
        .input('isBillable', sql.Bit, true)
        .input('billingType', sql.NVarChar(50), 'Hourly')
        .query(`
          INSERT INTO Allocations (
            ResourceID, 
            ProjectID, 
            StartDate, 
            EndDate, 
            Utilization,
            HourlyRate,
            BillableRate,
            TotalHours,
            TotalCost,
            BillableAmount,
            IsBillable,
            BillingType
          )
          OUTPUT INSERTED.AllocationID
          VALUES (
            @resourceId, 
            @projectId, 
            @startDate, 
            @endDate, 
            @utilization,
            @hourlyRate,
            @billableRate,
            @totalHours,
            @totalCost,
            @billableAmount,
            @isBillable,
            @billingType
          )
        `);
      
      console.log('Debug: Test allocation created successfully with ID:', allocationResult.recordset[0].AllocationID);
      
      // Now let's check if the allocation exists
      const verifyResult = await pool.request()
        .input('allocationId', sql.Int, allocationResult.recordset[0].AllocationID)
        .query(`
          SELECT *
          FROM Allocations
          WHERE AllocationID = @allocationId
        `);
      
      if (verifyResult.recordset.length > 0) {
        console.log('Debug: Verified allocation exists in the database');
        console.log('Debug: Allocation record:', verifyResult.recordset[0]);
      } else {
        console.log('Debug: ERROR - Allocation was not found in database after creation!');
      }
      
      // Check for any potential constraints or data issues
      const checkConstraints = await pool.request()
        .query(`
          SELECT name
          FROM sys.key_constraints
          WHERE OBJECT_NAME(parent_object_id) = 'Allocations'
        `);
      
      console.log('Debug: Allocation table constraints:', checkConstraints.recordset);
      
      // Return success
      return {
        success: true,
        allocationId: allocationResult.recordset[0].AllocationID
      };
    } catch (err) {
      console.error('Debug: Error creating test allocation:', err);
      
      // Additional error details for SQL errors
      if (err.originalError) {
        console.error('Debug: Original error:', {
          message: err.originalError.message,
          code: err.originalError.code,
          number: err.number,
          lineNumber: err.lineNumber,
          state: err.state,
          class: err.class,
          serverName: err.serverName,
          procName: err.procName
        });
      }
      
      return {
        success: false,
        error: err.message
      };
    }
  } catch (err) {
    console.error('Debug: Error in debugProjectById:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

async function lookupProjectByNumber(projectNumber) {
  try {
    const pool = await poolPromise;
    console.log(`Debug: Looking up project with number ${projectNumber}`);
    
    const result = await pool.request()
      .input('projectNumber', sql.NVarChar, projectNumber)
      .query(`
        SELECT 
          p.ProjectID,
          p.Name,
          p.Client,
          p.ProjectNumber,
          p.StartDate,
          p.EndDate,
          p.Status
        FROM Projects p
        WHERE p.ProjectNumber = @projectNumber
      `);
    
    if (result.recordset.length === 0) {
      console.log(`Debug: Project with number ${projectNumber} not found`);
      return null;
    }
    
    console.log('Debug: Found project:', result.recordset[0]);
    return result.recordset[0];
  } catch (err) {
    console.error('Debug: Error looking up project by number:', err);
    return null;
  }
}

async function run() {
  try {
    // Find project by number
    const projectNumber = 'PRJ-2023-045';
    const project = await lookupProjectByNumber(projectNumber);
    
    if (!project) {
      console.log(`Debug: Project with number ${projectNumber} not found`);
      process.exit(1);
    }
    
    // Debug the project
    await debugProjectById(project.ProjectID);
    
    console.log('Debug: Script completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Debug: Script failed:', err);
    process.exit(1);
  }
}

run();