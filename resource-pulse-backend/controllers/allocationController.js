// allocationController.js
const { poolPromise, sql } = require('../db/config');

// Helper function to get the maximum utilization percentage from settings
const getMaxUtilizationPercentage = async (pool) => {
  try {
    const result = await pool.request()
      .query(`
        SELECT SettingValue 
        FROM SystemSettings 
        WHERE SettingKey = 'maxUtilizationPercentage'
      `);
    
    if (result.recordset.length > 0) {
      return parseInt(result.recordset[0].SettingValue) || 100;
    }
    return 100; // Default value if setting not found
  } catch (err) {
    console.error('Error fetching max utilization setting:', err);
    return 100; // Default value on error
  }
};

// Create or update an allocation
const updateAllocation = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { 
      projectId, 
      startDate, 
      endDate, 
      utilization,
      // Financial parameters
      hourlyRate,
      billableRate,
      totalHours,
      isBillable,
      billingType
    } = req.body;
    
    // Validate input parameters
    if (!resourceId) {
      return res.status(400).json({ message: 'Resource ID is required' });
    }

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    if (!startDate) {
      return res.status(400).json({ message: 'Start date is required' });
    }

    if (!endDate) {
      return res.status(400).json({ message: 'End date is required' });
    }

    if (utilization === undefined || utilization === null) {
      return res.status(400).json({ message: 'Utilization is required' });
    }
    
    // Validate utilization
    if (utilization < 1 || utilization > 150) { // Increased upper limit to 150 as a safeguard
      return res.status(400).json({ 
        message: 'Utilization must be between 1 and 150' 
      });
    }
    
    const pool = await poolPromise;
    
    // Get the max utilization percentage from settings
    const maxUtilizationPercentage = await getMaxUtilizationPercentage(pool);
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Check if resource exists and get hourly rate if not provided
      const resourceCheck = await transaction.request()
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT 
            ResourceID, 
            HourlyRate,
            BillableRate
          FROM Resources 
          WHERE ResourceID = @resourceId
        `);
      
      if (resourceCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      // Get resource hourly and billable rates if not provided
      const resourceHourlyRate = hourlyRate || resourceCheck.recordset[0].HourlyRate;
      const resourceBillableRate = billableRate || resourceCheck.recordset[0].BillableRate;
      
      // Check if project exists
      const projectCheck = await transaction.request()
        .input('projectId', sql.Int, projectId)
        .query(`
          SELECT ProjectID FROM Projects WHERE ProjectID = @projectId
        `);
      
      if (projectCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Validate start and end dates
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (startDateObj > endDateObj) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Start date must be before or equal to end date' });
      }
      
      // Check utilization constraint against system setting
      const utilizationCheck = await transaction.request()
        .input('resourceId', sql.Int, resourceId)
        .input('startDate', sql.Date, startDateObj)
        .input('endDate', sql.Date, endDateObj)
        .input('projectId', sql.Int, projectId)
        .query(`
          SELECT SUM(Utilization) AS TotalUtilization
          FROM Allocations
          WHERE ResourceID = @resourceId
          AND ProjectID != @projectId
          AND (
            (StartDate <= @endDate AND EndDate >= @startDate)
          )
        `);
      
      const existingUtilization = utilizationCheck.recordset[0].TotalUtilization || 0;
      
      // Use the max utilization from settings instead of hardcoded 100
      if (existingUtilization + utilization > maxUtilizationPercentage) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `This allocation would exceed ${maxUtilizationPercentage}% utilization. Current utilization in this period: ${existingUtilization}%` 
        });
      }
      
      // Calculate financial metrics
      
      // Calculate workdays between dates (excluding weekends)
      const daysDiff = await transaction.request()
        .input('startDate', sql.Date, startDateObj)
        .input('endDate', sql.Date, endDateObj)
        .query(`
          SELECT 
            DATEDIFF(day, @startDate, @endDate) + 1 AS TotalDays,
            DATEDIFF(day, @startDate, @endDate) + 1 - 
            (2 * DATEDIFF(week, @startDate, @endDate)) AS WorkDays
        `);
      
      const workDays = daysDiff.recordset[0].WorkDays;
      
      // Calculate total allocation hours (8 hours per workday * utilization percentage)
      const calculatedTotalHours = workDays * 8 * (utilization / 100);
      const allocationTotalHours = totalHours || calculatedTotalHours;
      
      // Calculate financial amounts
      const allocationIsBillable = isBillable === undefined ? true : isBillable;
      const totalCost = resourceHourlyRate ? resourceHourlyRate * allocationTotalHours : null;
      const billableAmount = allocationIsBillable && resourceBillableRate ? 
        resourceBillableRate * allocationTotalHours : null;
      
      // Check for existing allocation to this project
      const existingAllocation = await transaction.request()
        .input('resourceId', sql.Int, resourceId)
        .input('projectId', sql.Int, projectId)
        .query(`
          SELECT AllocationID
          FROM Allocations
          WHERE ResourceID = @resourceId
          AND ProjectID = @projectId
          AND EndDate >= GETDATE()
        `);
      
      if (existingAllocation.recordset.length > 0) {
        // Update existing allocation
        await transaction.request()
          .input('resourceId', sql.Int, resourceId)
          .input('projectId', sql.Int, projectId)
          .input('startDate', sql.Date, startDateObj)
          .input('endDate', sql.Date, endDateObj)
          .input('utilization', sql.Int, utilization)
          .input('hourlyRate', sql.Decimal(10, 2), resourceHourlyRate)
          .input('billableRate', sql.Decimal(10, 2), resourceBillableRate)
          .input('totalHours', sql.Int, allocationTotalHours)
          .input('totalCost', sql.Decimal(14, 2), totalCost)
          .input('billableAmount', sql.Decimal(14, 2), billableAmount)
          .input('isBillable', sql.Bit, allocationIsBillable)
          .input('billingType', sql.NVarChar(50), billingType || 'Hourly')
          .input('updatedAt', sql.DateTime2, new Date())
          .query(`
            UPDATE Allocations
            SET StartDate = @startDate,
                EndDate = @endDate,
                Utilization = @utilization,
                HourlyRate = @hourlyRate,
                BillableRate = @billableRate,
                TotalHours = @totalHours,
                TotalCost = @totalCost,
                BillableAmount = @billableAmount,
                IsBillable = @isBillable,
                BillingType = @billingType,
                UpdatedAt = @updatedAt
            WHERE ResourceID = @resourceId
            AND ProjectID = @projectId
            AND EndDate >= GETDATE()
          `);
      } else {
        // Create new allocation
        await transaction.request()
          .input('resourceId', sql.Int, resourceId)
          .input('projectId', sql.Int, projectId)
          .input('startDate', sql.Date, startDateObj)
          .input('endDate', sql.Date, endDateObj)
          .input('utilization', sql.Int, utilization)
          .input('hourlyRate', sql.Decimal(10, 2), resourceHourlyRate)
          .input('billableRate', sql.Decimal(10, 2), resourceBillableRate)
          .input('totalHours', sql.Int, allocationTotalHours)
          .input('totalCost', sql.Decimal(14, 2), totalCost)
          .input('billableAmount', sql.Decimal(14, 2), billableAmount)
          .input('isBillable', sql.Bit, allocationIsBillable)
          .input('billingType', sql.NVarChar(50), billingType || 'Hourly')
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
      }
      
      // Recalculate project financial metrics
      await transaction.request()
        .input('projectId', sql.Int, projectId)
        .input('createSnapshot', sql.Bit, 0)
        .execute('sp_RecalculateProjectFinancials');
      
      // Commit transaction
      await transaction.commit();
      
      // Fetch updated allocations for this resource
      const result = await pool.request()
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT 
            a.AllocationID,
            a.ResourceID,
            r.Name AS ResourceName,
            a.ProjectID,
            p.Name AS ProjectName,
            a.StartDate,
            a.EndDate,
            a.Utilization,
            a.HourlyRate,
            a.BillableRate,
            a.TotalHours,
            a.TotalCost,
            a.BillableAmount,
            a.IsBillable,
            a.BillingType
          FROM Allocations a
          INNER JOIN Resources r ON a.ResourceID = r.ResourceID
          INNER JOIN Projects p ON a.ProjectID = p.ProjectID
          WHERE a.ResourceID = @resourceId
          AND a.EndDate >= GETDATE()
        `);
      
      const allocations = result.recordset.map(allocation => ({
        id: allocation.AllocationID,
        resourceId: allocation.ResourceID,
        projectId: allocation.ProjectID,
        projectName: allocation.ProjectName,
        startDate: allocation.StartDate,
        endDate: allocation.EndDate,
        utilization: allocation.Utilization,
        hourlyRate: allocation.HourlyRate,
        billableRate: allocation.BillableRate,
        totalHours: allocation.TotalHours,
        totalCost: allocation.TotalCost,
        billableAmount: allocation.BillableAmount,
        isBillable: allocation.IsBillable,
        billingType: allocation.BillingType
      }));
      
      res.json(allocations);
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('Transaction error:', err);
      res.status(500).json({
        message: 'Error processing allocation',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
      });
    }
  } catch (err) {
    console.error('Allocation update error:', err);
    res.status(500).json({
      message: 'Unexpected error occurred',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Get resource allocations
const getResourceAllocations = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const pool = await poolPromise;
    
    // Check if resource exists
    const resourceCheck = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT 
          ResourceID, 
          Name, 
          Role, 
          HourlyRate, 
          BillableRate,
          Currency
        FROM Resources 
        WHERE ResourceID = @resourceId
      `);
    
    if (resourceCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    const resource = resourceCheck.recordset[0];
    
    // Get all allocations for this resource with financial data
    const result = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT 
          a.AllocationID,
          a.ResourceID,
          r.Name AS ResourceName,
          a.ProjectID,
          p.Name AS ProjectName,
          a.StartDate,
          a.EndDate,
          a.Utilization,
          a.HourlyRate,
          a.BillableRate,
          a.TotalHours,
          a.TotalCost,
          a.BillableAmount,
          a.IsBillable,
          a.BillingType,
          p.Currency
        FROM Allocations a
        INNER JOIN Resources r ON a.ResourceID = r.ResourceID
        INNER JOIN Projects p ON a.ProjectID = p.ProjectID
        WHERE a.ResourceID = @resourceId
        AND a.EndDate >= GETDATE()
        ORDER BY a.StartDate
      `);
    
    // Calculate total financial metrics for this resource
    const financialsResult = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT 
          SUM(TotalHours) AS TotalAllocatedHours,
          SUM(TotalCost) AS TotalCost,
          SUM(CASE WHEN IsBillable = 1 THEN BillableAmount ELSE 0 END) AS TotalBillableAmount,
          AVG(CASE WHEN IsBillable = 1 THEN BillableRate ELSE NULL END) AS AvgBillableRate
        FROM Allocations
        WHERE ResourceID = @resourceId
        AND EndDate >= GETDATE()
      `);
    
    const financialSummary = financialsResult.recordset[0];
    
    // Get current billable utilization percentage
    const utilizationResult = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT 
          SUM(CASE WHEN IsBillable = 1 THEN Utilization ELSE 0 END) AS BillableUtilization,
          SUM(Utilization) AS TotalUtilization
        FROM Allocations
        WHERE ResourceID = @resourceId
        AND GETDATE() BETWEEN StartDate AND EndDate
      `);
    
    const utilization = utilizationResult.recordset[0];
    const billableUtilizationPercentage = utilization.TotalUtilization > 0 
      ? (utilization.BillableUtilization / utilization.TotalUtilization) * 100 
      : 0;
    
    const allocations = result.recordset.map(allocation => ({
      id: allocation.AllocationID,
      resource: {
        id: allocation.ResourceID,
        name: allocation.ResourceName
      },
      project: {
        id: allocation.ProjectID,
        name: allocation.ProjectName,
        currency: allocation.Currency
      },
      startDate: allocation.StartDate,
      endDate: allocation.EndDate,
      utilization: allocation.Utilization,
      financials: {
        hourlyRate: allocation.HourlyRate,
        billableRate: allocation.BillableRate,
        totalHours: allocation.TotalHours,
        totalCost: allocation.TotalCost,
        billableAmount: allocation.BillableAmount,
        isBillable: allocation.IsBillable,
        billingType: allocation.BillingType,
        profit: allocation.BillableAmount - allocation.TotalCost
      }
    }));
    
    res.json({
      resource: {
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        hourlyRate: resource.HourlyRate,
        billableRate: resource.BillableRate,
        currency: resource.Currency
      },
      allocations: allocations,
      financialSummary: {
        totalAllocatedHours: financialSummary.TotalAllocatedHours || 0,
        totalCost: financialSummary.TotalCost || 0,
        totalBillableAmount: financialSummary.TotalBillableAmount || 0,
        avgBillableRate: financialSummary.AvgBillableRate || 0,
        currentBillableUtilization: billableUtilizationPercentage,
        totalProfit: (financialSummary.TotalBillableAmount || 0) - (financialSummary.TotalCost || 0)
      }
    });
  } catch (err) {
    console.error('Error getting resource allocations:', err);
    res.status(500).json({
      message: 'Error retrieving resource allocations',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Get resources ending soon
const getResourcesEndingSoon = async (req, res) => {
  try {
    const pool = await poolPromise;
    const daysThreshold = req.query.days ? parseInt(req.query.days) : 14;
    
    // Calculate the date threshold
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    // Query resources ending soon
    const result = await pool.request()
      .input('today', sql.Date, today)
      .input('thresholdDate', sql.Date, thresholdDate)
      .query(`
        SELECT 
          r.ResourceID, 
          r.Name, 
          r.Role,
          a.ProjectID,
          p.Name AS ProjectName,
          a.StartDate,
          a.EndDate,
          a.Utilization,
          DATEDIFF(day, GETDATE(), a.EndDate) AS DaysLeft
        FROM Resources r
        INNER JOIN Allocations a ON r.ResourceID = a.ResourceID
        INNER JOIN Projects p ON a.ProjectID = p.ProjectID
        WHERE a.EndDate >= @today
        AND a.EndDate <= @thresholdDate
        ORDER BY a.EndDate ASC
      `);
    
    // Format the response
    const resources = await Promise.all(result.recordset.map(async resource => {
      // Get skills
      const skillsResult = await pool.request()
        .input('resourceId', sql.Int, resource.ResourceID)
        .query(`
          SELECT s.Name
          FROM Skills s
          INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
          WHERE rs.ResourceID = @resourceId
        `);
      
      return {
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        skills: skillsResult.recordset.map(skill => skill.Name),
        allocation: {
          projectId: resource.ProjectID,
          projectName: resource.ProjectName,
          startDate: resource.StartDate,
          endDate: resource.EndDate,
          utilization: resource.Utilization,
          daysLeft: resource.DaysLeft
        }
      };
    }));
    
    res.json(resources);
  } catch (err) {
    console.error('Error getting resources ending soon:', err);
    res.status(500).json({
      message: 'Error retrieving resources ending soon',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Get resource matches
const getResourceMatches = async (req, res) => {
 try {
   const pool = await poolPromise;
   const { projectId } = req.query;
   
   // If projectId is provided, get matches for specific project
   if (projectId) {
     const matches = await getMatchesForProject(pool, parseInt(projectId));
     return res.json(matches);
   }
   
   // Otherwise, get matches for all projects
   const projectsResult = await pool.request()
     .query(`
       SELECT ProjectID, Name, Client
       FROM Projects
       WHERE Status = 'Active'
     `);
   
   const allMatches = [];
   
   for (const project of projectsResult.recordset) {
     try {
       const matches = await getMatchesForProject(pool, project.ProjectID);
       
       if (matches.resources.length > 0) {
         allMatches.push(matches);
       }
     } catch (projectMatchError) {
       console.error(`Error getting matches for project ${project.Name}:`, projectMatchError);
     }
   }
   
   res.json(allMatches);
 } catch (err) {
   console.error('Error getting resource matches:', err);
   res.status(500).json({
     message: 'Error retrieving resource matches',
     error: process.env.NODE_ENV === 'production' ? {} : {
       message: err.message,
       stack: err.stack
     }
   });
 }
};

// Remove an allocation
const removeAllocation = async (req, res) => {
  try {
    const { resourceId, allocationId } = req.body;
    
    // Validate required fields
    if (!resourceId) {
      return res.status(400).json({ message: 'Resource ID is required' });
    }
    
    if (!allocationId) {
      return res.status(400).json({ message: 'Allocation ID is required' });
    }
    
    const pool = await poolPromise;
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Validate resource exists
      const resourceCheck = await transaction.request()
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT ResourceID FROM Resources WHERE ResourceID = @resourceId
        `);
      
      if (resourceCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      // Validate allocation exists and get project ID
      const allocationCheck = await transaction.request()
        .input('allocationId', sql.Int, allocationId)
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT AllocationID, ProjectID 
          FROM Allocations 
          WHERE AllocationID = @allocationId
          AND ResourceID = @resourceId
        `);
      
      if (allocationCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Allocation not found' });
      }
      
      const projectId = allocationCheck.recordset[0].ProjectID;
      
      // Delete allocation
      const result = await transaction.request()
        .input('allocationId', sql.Int, allocationId)
        .query(`
          DELETE FROM Allocations
          WHERE AllocationID = @allocationId
        `);
      
      // Recalculate project financial metrics
      if (projectId) {
        await transaction.request()
          .input('projectId', sql.Int, projectId)
          .input('createSnapshot', sql.Bit, 0)
          .execute('sp_RecalculateProjectFinancials');
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Fetch remaining allocations for the resource with financial data
      const remainingAllocations = await pool.request()
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT 
            a.AllocationID,
            a.ResourceID,
            r.Name AS ResourceName,
            a.ProjectID,
            p.Name AS ProjectName,
            a.StartDate,
            a.EndDate,
            a.Utilization,
            a.HourlyRate,
            a.BillableRate,
            a.TotalHours,
            a.TotalCost,
            a.BillableAmount,
            a.IsBillable,
            a.BillingType
          FROM Allocations a
          INNER JOIN Resources r ON a.ResourceID = r.ResourceID
          INNER JOIN Projects p ON a.ProjectID = p.ProjectID
          WHERE a.ResourceID = @resourceId
          AND a.EndDate >= GETDATE()
        `);
      
      // Get updated project data
      let updatedProjectData = null;
      if (projectId) {
        const projectResult = await pool.request()
          .input('projectId', sql.Int, projectId)
          .query(`
            SELECT 
              p.ProjectID,
              p.Name,
              p.Budget,
              p.ActualCost,
              p.BudgetUtilization,
              vf.Variance,
              vf.BudgetUtilizationPercentage,
              vf.ProjectProfit
            FROM Projects p
            LEFT JOIN vw_ProjectFinancials vf ON p.ProjectID = vf.ProjectID
            WHERE p.ProjectID = @projectId
          `);
        
        if (projectResult.recordset.length > 0) {
          updatedProjectData = {
            id: projectResult.recordset[0].ProjectID,
            name: projectResult.recordset[0].Name,
            financials: {
              budget: projectResult.recordset[0].Budget,
              actualCost: projectResult.recordset[0].ActualCost,
              budgetUtilization: projectResult.recordset[0].BudgetUtilization,
              variance: projectResult.recordset[0].Variance,
              budgetUtilizationPercentage: projectResult.recordset[0].BudgetUtilizationPercentage,
              profit: projectResult.recordset[0].ProjectProfit
            }
          };
        }
      }
      
      const allocations = remainingAllocations.recordset.map(allocation => ({
        id: allocation.AllocationID,
        resourceId: allocation.ResourceID,
        projectId: allocation.ProjectID,
        projectName: allocation.ProjectName,
        startDate: allocation.StartDate,
        endDate: allocation.EndDate,
        utilization: allocation.Utilization,
        financials: {
          hourlyRate: allocation.HourlyRate,
          billableRate: allocation.BillableRate,
          totalHours: allocation.TotalHours,
          totalCost: allocation.TotalCost,
          billableAmount: allocation.BillableAmount,
          isBillable: allocation.IsBillable,
          billingType: allocation.BillingType
        }
      }));
      
      // Calculate updated financial summary for resource
      const financialsResult = await pool.request()
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT 
            SUM(TotalHours) AS TotalAllocatedHours,
            SUM(TotalCost) AS TotalCost,
            SUM(CASE WHEN IsBillable = 1 THEN BillableAmount ELSE 0 END) AS TotalBillableAmount
          FROM Allocations
          WHERE ResourceID = @resourceId
          AND EndDate >= GETDATE()
        `);
      
      const financialSummary = financialsResult.recordset[0];
      
      res.json({ 
        message: 'Allocation removed successfully',
        deletedCount: result.rowsAffected[0],
        remainingAllocations: allocations,
        updatedProject: updatedProjectData,
        financialSummary: {
          totalAllocatedHours: financialSummary.TotalAllocatedHours || 0,
          totalCost: financialSummary.TotalCost || 0,
          totalBillableAmount: financialSummary.TotalBillableAmount || 0,
          totalProfit: (financialSummary.TotalBillableAmount || 0) - (financialSummary.TotalCost || 0)
        }
      });
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('Transaction error:', err);
      res.status(500).json({
        message: 'Error removing allocation',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
      });
    }
  } catch (err) {
    console.error('Allocation removal error:', err);
    res.status(500).json({
      message: 'Unexpected error occurred',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Helper function to get matches for a specific project
const getMatchesForProject = async (pool, projectId) => {
  // Get project details
  const projectResult = await pool.request()
    .input('projectId', sql.Int, projectId)
    .query(`
      SELECT 
        p.ProjectID, 
        p.Name, 
        p.Client
      FROM Projects p
      WHERE p.ProjectID = @projectId
    `);
  
  if (projectResult.recordset.length === 0) {
    throw new Error(`Project with ID ${projectId} not found`);
  }
  
  const project = projectResult.recordset[0];
  
  // Get project required skills
  const skillsResult = await pool.request()
    .input('projectId', sql.Int, projectId)
    .query(`
      SELECT s.SkillID, s.Name
      FROM Skills s
      INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
      WHERE ps.ProjectID = @projectId
    `);
  
  const requiredSkills = skillsResult.recordset.map(skill => skill.Name);
  
  // Get project required roles
  const rolesResult = await pool.request()
    .input('projectId', sql.Int, projectId)
    .query(`
      SELECT pr.RoleID, r.Name, pr.Count
      FROM ProjectRoles pr
      INNER JOIN Roles r ON pr.RoleID = r.RoleID
      WHERE pr.ProjectID = @projectId
    `);
  
  const requiredRoles = rolesResult.recordset.map(role => ({
    id: role.RoleID,
    name: role.Name,
    count: role.Count
  }));
  
  // Calculate how many resources per role are already allocated
  const allocatedRolesResult = await pool.request()
    .input('projectId', sql.Int, projectId)
    .query(`
      SELECT r.RoleID, COUNT(DISTINCT res.ResourceID) AS AllocatedCount
      FROM Resources res
      INNER JOIN Allocations a ON res.ResourceID = a.ResourceID
      INNER JOIN Roles r ON res.RoleID = r.RoleID
      WHERE a.ProjectID = @projectId
      GROUP BY r.RoleID
    `);
  
  // Build allocated counts map
  const allocatedCounts = {};
  allocatedRolesResult.recordset.forEach(row => {
    allocatedCounts[row.RoleID] = row.AllocatedCount;
  });
  
  // Get max utilization from settings
  const maxUtilization = await getMaxUtilizationPercentage(pool);
  
  // Find resources with matching skills OR matching roles
  const matchingResourcesResult = await pool.request()
    .input('projectId', sql.Int, projectId)
    .input('thresholdDate', sql.Date, new Date(new Date().setDate(new Date().getDate() + 14)))
    .input('maxUtilization', sql.Int, maxUtilization)
    .query(`
      WITH ResourceUtilization AS (
        SELECT 
          r.ResourceID,
          SUM(a.Utilization) AS TotalUtilization
        FROM Resources r
        LEFT JOIN Allocations a ON r.ResourceID = a.ResourceID AND a.EndDate >= GETDATE()
        GROUP BY r.ResourceID
      ),
      ResourcesWithMatchingSkillsOrRoles AS (
        SELECT DISTINCT
          r.ResourceID
        FROM Resources r
        LEFT JOIN ResourceSkills rs ON r.ResourceID = rs.ResourceID
        LEFT JOIN ProjectSkills ps ON rs.SkillID = ps.SkillID AND ps.ProjectID = @projectId
        LEFT JOIN ProjectRoles pr ON pr.ProjectID = @projectId AND pr.RoleID = r.RoleID
        WHERE 
          ps.ProjectID IS NOT NULL  -- Has at least one matching skill
          OR pr.ProjectID IS NOT NULL  -- Has a matching role
      )
      SELECT 
        r.ResourceID,
        r.Name,
        r.Role,
        r.RoleID,
        ru.TotalUtilization,
        CASE 
          WHEN ru.TotalUtilization IS NULL OR ru.TotalUtilization < @maxUtilization THEN 'available'
          WHEN EXISTS (
            SELECT 1 FROM Allocations a 
            WHERE a.ResourceID = r.ResourceID 
            AND a.EndDate <= @thresholdDate 
            AND a.EndDate >= GETDATE()
          ) THEN 'ending-soon'
          ELSE 'fully-allocated'
        END AS AvailabilityStatus,
        (
          SELECT MIN(a.EndDate)
          FROM Allocations a
          WHERE a.ResourceID = r.ResourceID
          AND a.EndDate >= GETDATE()
        ) AS NextAvailableDate,
        DATEDIFF(day, GETDATE(), (
          SELECT MIN(a.EndDate)
          FROM Allocations a
          WHERE a.ResourceID = r.ResourceID
          AND a.EndDate >= GETDATE()
        )) AS DaysLeft
      FROM Resources r
      INNER JOIN ResourcesWithMatchingSkillsOrRoles rms ON r.ResourceID = rms.ResourceID
      LEFT JOIN ResourceUtilization ru ON r.ResourceID = ru.ResourceID
      WHERE 
        ru.TotalUtilization IS NULL OR 
        ru.TotalUtilization < @maxUtilization OR
        EXISTS (
          SELECT 1 FROM Allocations a 
          WHERE a.ResourceID = r.ResourceID 
          AND a.EndDate <= @thresholdDate 
          AND a.EndDate >= GETDATE()
        )
      ORDER BY
        CASE 
          WHEN ru.TotalUtilization IS NULL THEN 0
          WHEN ru.TotalUtilization < @maxUtilization THEN ru.TotalUtilization
          ELSE @maxUtilization
        END,
        COALESCE(
          (SELECT MIN(a.EndDate)
          FROM Allocations a
          WHERE a.ResourceID = r.ResourceID
          AND a.EndDate >= GETDATE()), 
          GETDATE() + 365
        )
    `);
  
  // For each matching resource, calculate match score and get matching skills/roles
  const matchingResources = await Promise.all(
    matchingResourcesResult.recordset.map(async resource => {
      // Get resource skills
      const resourceSkillsResult = await pool.request()
        .input('resourceId', sql.Int, resource.ResourceID)
        .query(`
          SELECT s.SkillID, s.Name
          FROM Skills s
          INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
          WHERE rs.ResourceID = @resourceId
        `);
      
      const resourceSkills = resourceSkillsResult.recordset.map(skill => skill.Name);
      
      // Get role info
      const roleResult = await pool.request()
        .input('roleId', sql.Int, resource.RoleID)
        .query(`
          SELECT RoleID, Name
          FROM Roles
          WHERE RoleID = @roleId
        `);
      
      const role = roleResult.recordset.length > 0 ? {
        id: roleResult.recordset[0].RoleID,
        name: roleResult.recordset[0].Name
      } : null;
      
      // Get allocations for this resource
      const allocationsResult = await pool.request()
        .input('resourceId', sql.Int, resource.ResourceID)
        .query(`
          SELECT 
            a.AllocationID,
            a.ProjectID,
            p.Name AS ProjectName,
            a.StartDate,
            a.EndDate,
            a.Utilization
          FROM Allocations a
          INNER JOIN Projects p ON a.ProjectID = p.ProjectID
          WHERE a.ResourceID = @resourceId
          AND a.EndDate >= GETDATE()
          ORDER BY a.EndDate ASC
        `);
      
      // Calculate matching skills
      const matchingSkills = resourceSkills.filter(skill => requiredSkills.includes(skill));
      
      // Calculate if role matches
      const roleMatches = requiredRoles.some(reqRole => 
        resource.RoleID === reqRole.id
      );
      
      // Get the matching role if any
      const matchingRole = requiredRoles.find(reqRole => resource.RoleID === reqRole.id);
      
      // Check if the role is still needed (count not fulfilled)
      const roleNeeded = matchingRole ? 
        (allocatedCounts[matchingRole.id] || 0) < matchingRole.count : 
        false;
      
      // Calculate match score - higher weight to role matches (40%) and rest to skill matches (60%)
      const skillMatchScore = requiredSkills.length > 0 ? 
        (matchingSkills.length / requiredSkills.length) * 60 : 0;
      
      const roleMatchScore = roleMatches ? 40 : 0;
      
      const totalMatchScore = skillMatchScore + roleMatchScore;
      
      return {
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        roleId: resource.RoleID,
        roleName: role ? role.name : null,
        roleMatch: roleMatches,
        roleNeeded: roleNeeded,
        skills: resourceSkills,
        matchingSkills: matchingSkills,
        matchScore: totalMatchScore,
        availabilityStatus: resource.AvailabilityStatus,
        totalUtilization: resource.TotalUtilization || 0,
        endDate: resource.NextAvailableDate,
        daysLeft: resource.DaysLeft,
        allocations: allocationsResult.recordset.map(alloc => ({
          id: alloc.AllocationID,
          projectId: alloc.ProjectID,
          project: {
            id: alloc.ProjectID,
            name: alloc.ProjectName
          },
          startDate: alloc.StartDate,
          endDate: alloc.EndDate,
          utilization: alloc.Utilization
        }))
      };
    })
  );
  
  // Sort by role needed first, then match score (descending)
  matchingResources.sort((a, b) => {
    // First sort by whether the role is needed
    if (a.roleNeeded && !b.roleNeeded) return -1;
    if (!a.roleNeeded && b.roleNeeded) return 1;
    
    // Then by match score
    return b.matchScore - a.matchScore;
  });
  
  // Calculate roles still needed
  const rolesNeeded = requiredRoles.map(role => {
    const allocated = allocatedCounts[role.id] || 0;
    return {
      ...role,
      allocated: allocated,
      needed: Math.max(0, role.count - allocated)
    };
  }).filter(role => role.needed > 0);
  
  return {
    project: {
      id: project.ProjectID,
      name: project.Name,
      client: project.Client,
      requiredSkills: requiredSkills,
      requiredRoles: requiredRoles,
      rolesNeeded: rolesNeeded
    },
    resources: matchingResources
  };
};

// Exports
module.exports = {
  updateAllocation,
  getResourceAllocations,
  getResourcesEndingSoon,
  getResourceMatches,
  removeAllocation
};