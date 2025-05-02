// capacityController.js
const { poolPromise, sql } = require('../db/config');

// Create a new capacity planning scenario
const createScenario = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Scenario name is required' });
    }
    
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .query(`
        INSERT INTO CapacityScenarios (Name, Description)
        OUTPUT INSERTED.ScenarioID, INSERTED.Name, INSERTED.Description, INSERTED.CreatedAt
        VALUES (@name, @description)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating capacity scenario:', err);
    res.status(500).json({
      message: 'Error creating capacity scenario',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Get all capacity scenarios
const getScenarios = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .query(`
        SELECT 
          ScenarioID as id,
          Name as name,
          Description as description,
          IsActive as isActive,
          CreatedAt as createdAt
        FROM CapacityScenarios
        ORDER BY CreatedAt DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching capacity scenarios:', err);
    res.status(500).json({
      message: 'Error fetching capacity scenarios',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Get a specific scenario with its allocations
const getScenarioById = async (req, res) => {
  try {
    const { scenarioId } = req.params;
    
    const pool = await poolPromise;
    
    // Get scenario details
    const scenarioResult = await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .query(`
        SELECT 
          ScenarioID as id,
          Name as name,
          Description as description,
          IsActive as isActive,
          CreatedAt as createdAt
        FROM CapacityScenarios
        WHERE ScenarioID = @scenarioId
      `);
    
    if (scenarioResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Scenario not found' });
    }
    
    // Get scenario allocations
    const allocationsResult = await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .query(`
        SELECT 
          sa.ScenarioAllocationID as id,
          sa.ResourceID as resourceId,
          r.Name as resourceName,
          sa.ProjectID as projectId,
          p.Name as projectName,
          sa.StartDate as startDate,
          sa.EndDate as endDate,
          sa.Utilization as utilization,
          1 as isTemporary, /* Hardcoded until column is added */
          sa.Notes as notes
        FROM ScenarioAllocations sa
        INNER JOIN Resources r ON sa.ResourceID = r.ResourceID
        INNER JOIN Projects p ON sa.ProjectID = p.ProjectID
        WHERE sa.ScenarioID = @scenarioId
        ORDER BY sa.StartDate
      `);
    
    // Return combined response
    res.json({
      ...scenarioResult.recordset[0],
      allocations: allocationsResult.recordset
    });
  } catch (err) {
    console.error('Error fetching scenario details:', err);
    res.status(500).json({
      message: 'Error fetching scenario details',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Update a scenario
const updateScenario = async (req, res) => {
  try {
    const { scenarioId } = req.params;
    const { name, description, isActive } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Scenario name is required' });
    }
    
    const pool = await poolPromise;
    
    // Check if scenario exists
    const scenarioCheck = await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .query(`SELECT ScenarioID FROM CapacityScenarios WHERE ScenarioID = @scenarioId`);
    
    if (scenarioCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Scenario not found' });
    }
    
    // Update scenario
    const result = await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('isActive', sql.Bit, isActive === undefined ? 1 : isActive)
      .query(`
        UPDATE CapacityScenarios 
        SET 
          Name = @name, 
          Description = @description,
          IsActive = @isActive,
          UpdatedAt = GETDATE()
        OUTPUT INSERTED.ScenarioID, INSERTED.Name, INSERTED.Description, INSERTED.IsActive, INSERTED.CreatedAt
        WHERE ScenarioID = @scenarioId
      `);
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error updating scenario:', err);
    res.status(500).json({
      message: 'Error updating scenario',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Add or update a scenario allocation
const updateScenarioAllocation = async (req, res) => {
  try {
    const { scenarioId, resourceId } = req.params;
    const { projectId, startDate, endDate, utilization, isTemporary, notes } = req.body;
    
    // Validate input
    if (!projectId || !startDate || !endDate || !utilization) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    
    try {
      // Check if scenario exists
      const scenarioCheck = await transaction.request()
        .input('scenarioId', sql.Int, scenarioId)
        .query(`SELECT ScenarioID FROM CapacityScenarios WHERE ScenarioID = @scenarioId`);
      
      if (scenarioCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Scenario not found' });
      }
      
      // Check if resource exists
      const resourceCheck = await transaction.request()
        .input('resourceId', sql.Int, resourceId)
        .query(`SELECT ResourceID FROM Resources WHERE ResourceID = @resourceId`);
      
      if (resourceCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      // Check if project exists
      const projectCheck = await transaction.request()
        .input('projectId', sql.Int, projectId)
        .query(`SELECT ProjectID FROM Projects WHERE ProjectID = @projectId`);
      
      if (projectCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check for existing allocation
      const existingAllocation = await transaction.request()
        .input('scenarioId', sql.Int, scenarioId)
        .input('resourceId', sql.Int, resourceId)
        .input('projectId', sql.Int, projectId)
        .query(`
          SELECT ScenarioAllocationID
          FROM ScenarioAllocations
          WHERE ScenarioID = @scenarioId
          AND ResourceID = @resourceId
          AND ProjectID = @projectId
        `);
      
      // Format dates
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (existingAllocation.recordset.length > 0) {
        // Update existing allocation
        await transaction.request()
          .input('allocationId', sql.Int, existingAllocation.recordset[0].ScenarioAllocationID)
          .input('startDate', sql.Date, startDateObj)
          .input('endDate', sql.Date, endDateObj)
          .input('utilization', sql.Int, utilization)
          /* Column doesn't exist yet - will be added in future
          .input('isTemporary', sql.Bit, isTemporary === undefined ? 1 : isTemporary)
          */
          .input('notes', sql.NVarChar, notes || null)
          .query(`
            UPDATE ScenarioAllocations
            SET StartDate = @startDate,
                EndDate = @endDate,
                Utilization = @utilization,
                Notes = @notes,
                UpdatedAt = GETDATE()
            WHERE ScenarioAllocationID = @allocationId
          `);
      } else {
        // Create new allocation
        await transaction.request()
          .input('scenarioId', sql.Int, scenarioId)
          .input('resourceId', sql.Int, resourceId)
          .input('projectId', sql.Int, projectId)
          .input('startDate', sql.Date, startDateObj)
          .input('endDate', sql.Date, endDateObj)
          .input('utilization', sql.Int, utilization)
          /* Column doesn't exist yet - will be added in future
          .input('isTemporary', sql.Bit, isTemporary === undefined ? 1 : isTemporary)
          */
          .input('notes', sql.NVarChar, notes || null)
          .query(`
            INSERT INTO ScenarioAllocations (
              ScenarioID, ResourceID, ProjectID, StartDate, EndDate, 
              Utilization, Notes
            )
            VALUES (
              @scenarioId, @resourceId, @projectId, @startDate, @endDate, 
              @utilization, @notes
            )
          `);
      }
      
      await transaction.commit();
      
      // Get updated allocations
      const updatedAllocations = await pool.request()
        .input('scenarioId', sql.Int, scenarioId)
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT 
            sa.ScenarioAllocationID as id,
            sa.ResourceID as resourceId,
            r.Name as resourceName,
            sa.ProjectID as projectId,
            p.Name as projectName,
            sa.StartDate as startDate,
            sa.EndDate as endDate,
            sa.Utilization as utilization,
            1 as isTemporary, /* Hardcoded until column is added */
            sa.Notes as notes
          FROM ScenarioAllocations sa
          INNER JOIN Resources r ON sa.ResourceID = r.ResourceID
          INNER JOIN Projects p ON sa.ProjectID = p.ProjectID
          WHERE sa.ScenarioID = @scenarioId
          AND sa.ResourceID = @resourceId
          ORDER BY sa.StartDate
        `);
      
      res.json(updatedAllocations.recordset);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error updating scenario allocation:', err);
    res.status(500).json({
      message: 'Error updating scenario allocation',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Delete a scenario allocation
const deleteScenarioAllocation = async (req, res) => {
  try {
    const { scenarioId, allocationId } = req.params;
    
    const pool = await poolPromise;
    
    // Check if allocation exists in this scenario
    const allocationCheck = await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .input('allocationId', sql.Int, allocationId)
      .query(`
        SELECT ScenarioAllocationID
        FROM ScenarioAllocations
        WHERE ScenarioID = @scenarioId
        AND ScenarioAllocationID = @allocationId
      `);
    
    if (allocationCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    
    // Delete the allocation
    await pool.request()
      .input('allocationId', sql.Int, allocationId)
      .query(`
        DELETE FROM ScenarioAllocations
        WHERE ScenarioAllocationID = @allocationId
      `);
    
    res.json({ message: 'Allocation deleted successfully' });
  } catch (err) {
    console.error('Error deleting scenario allocation:', err);
    res.status(500).json({
      message: 'Error deleting scenario allocation',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Generate capacity forecast for resources
const getCapacityForecast = async (req, res) => {
  try {
    const { scenarioId, startDate, endDate, resourceIds } = req.query;
    const months = req.query.months ? parseInt(req.query.months) : 6;
    
    const pool = await poolPromise;
    
    // Calculate date range if not provided
    const today = new Date();
    const forecastStartDate = startDate ? new Date(startDate) : today;
    
    // Default to N months from start date
    let forecastEndDate;
    if (endDate) {
      forecastEndDate = new Date(endDate);
    } else {
      forecastEndDate = new Date(forecastStartDate);
      forecastEndDate.setMonth(forecastEndDate.getMonth() + months);
    }
    
    // Parse resource IDs
    const resourceFilter = resourceIds ? resourceIds.split(',').map(id => parseInt(id.trim())) : [];
    
    // Get resource list with their allocations
    let resourceQuery = `
      SELECT r.ResourceID, r.Name, r.Role
      FROM Resources r
    `;
    
    if (resourceFilter.length > 0) {
      resourceQuery += `WHERE r.ResourceID IN (${resourceFilter.join(',')})`;
    }
    
    const resourcesResult = await pool.request().query(resourceQuery);
    
    // Get real allocations for these resources
    const realAllocationsQuery = `
      SELECT 
        a.ResourceID,
        a.ProjectID,
        p.Name as ProjectName,
        a.StartDate,
        a.EndDate,
        a.Utilization,
        0 as IsScenario
      FROM Allocations a
      INNER JOIN Projects p ON a.ProjectID = p.ProjectID
      WHERE 
        a.EndDate >= @startDate
        AND a.StartDate <= @endDate
        ${resourceFilter.length > 0 ? `AND a.ResourceID IN (${resourceFilter.join(',')})` : ''}
    `;
    
    const realAllocationsResult = await pool.request()
      .input('startDate', sql.Date, forecastStartDate)
      .input('endDate', sql.Date, forecastEndDate)
      .query(realAllocationsQuery);
    
    // Get scenario allocations if a scenario ID was provided
    let scenarioAllocations = [];
    if (scenarioId) {
      const scenarioAllocationsQuery = `
        SELECT 
          sa.ResourceID,
          sa.ProjectID,
          p.Name as ProjectName,
          sa.StartDate,
          sa.EndDate,
          sa.Utilization,
          1 as IsScenario
        FROM ScenarioAllocations sa
        INNER JOIN Projects p ON sa.ProjectID = p.ProjectID
        WHERE 
          sa.ScenarioID = @scenarioId
          AND sa.EndDate >= @startDate
          AND sa.StartDate <= @endDate
          ${resourceFilter.length > 0 ? `AND sa.ResourceID IN (${resourceFilter.join(',')})` : ''}
      `;
      
      const scenarioAllocationsResult = await pool.request()
        .input('scenarioId', sql.Int, scenarioId)
        .input('startDate', sql.Date, forecastStartDate)
        .input('endDate', sql.Date, forecastEndDate)
        .query(scenarioAllocationsQuery);
      
      scenarioAllocations = scenarioAllocationsResult.recordset;
    }
    
    // Get resource capacity data
    const capacityQuery = `
      SELECT 
        rc.ResourceID,
        rc.Year,
        rc.Month,
        rc.AvailableCapacity,
        rc.PlannedTimeOff
      FROM ResourceCapacity rc
      WHERE 
        (rc.Year > @startYear OR (rc.Year = @startYear AND rc.Month >= @startMonth))
        AND (rc.Year < @endYear OR (rc.Year = @endYear AND rc.Month <= @endMonth))
        ${resourceFilter.length > 0 ? `AND rc.ResourceID IN (${resourceFilter.join(',')})` : ''}
    `;
    
    const startYear = forecastStartDate.getFullYear();
    const startMonth = forecastStartDate.getMonth() + 1;
    const endYear = forecastEndDate.getFullYear();
    const endMonth = forecastEndDate.getMonth() + 1;
    
    const capacityResult = await pool.request()
      .input('startYear', sql.Int, startYear)
      .input('startMonth', sql.Int, startMonth)
      .input('endYear', sql.Int, endYear)
      .input('endMonth', sql.Int, endMonth)
      .query(capacityQuery);
    
    // Generate months for the forecast period
    const forecastMonths = [];
    let currentDate = new Date(forecastStartDate);
    while (currentDate <= forecastEndDate) {
      forecastMonths.push({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        label: currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Build the capacity forecast model
    const capacityForecast = resourcesResult.recordset.map(resource => {
      const resourceId = resource.ResourceID;
      
      // Get all allocations for this resource
      const resourceRealAllocations = realAllocationsResult.recordset
        .filter(a => a.ResourceID === resourceId);
      
      const resourceScenarioAllocations = scenarioAllocations
        .filter(a => a.ResourceID === resourceId);
      
      // Combine real and scenario allocations, with scenario taking precedence
      const combinedAllocations = [
        ...resourceRealAllocations,
        ...resourceScenarioAllocations
      ];
      
      // Get capacity data for this resource
      const resourceCapacity = capacityResult.recordset
        .filter(c => c.ResourceID === resourceId);
      
      // Calculate monthly utilization
      const monthlyData = forecastMonths.map(month => {
        const monthDate = new Date(month.year, month.month - 1, 15); // Middle of month
        
        // Find allocations active in this month
        const activeAllocations = combinedAllocations.filter(allocation => {
          const startDate = new Date(allocation.StartDate);
          const endDate = new Date(allocation.EndDate);
          return startDate <= monthDate && endDate >= monthDate;
        });
        
        // Calculate total utilization for the month
        const totalUtilization = activeAllocations.reduce((sum, allocation) => {
          return sum + allocation.Utilization;
        }, 0);
        
        // Find capacity settings for this month
        const capacitySetting = resourceCapacity.find(c => 
          c.Year === month.year && c.Month === month.month
        );
        
        const availableCapacity = capacitySetting ? capacitySetting.AvailableCapacity : 100;
        const plannedTimeOff = capacitySetting ? capacitySetting.PlannedTimeOff : 0;
        
        // Calculate available capacity
        const effectiveCapacity = availableCapacity - plannedTimeOff;
        const remainingCapacity = Math.max(0, effectiveCapacity - totalUtilization);
        const overallocated = totalUtilization > effectiveCapacity;
        
        return {
          year: month.year,
          month: month.month,
          label: month.label,
          totalUtilization,
          availableCapacity,
          plannedTimeOff,
          effectiveCapacity,
          remainingCapacity,
          overallocated,
          allocations: activeAllocations.map(a => ({
            projectId: a.ProjectID,
            projectName: a.ProjectName,
            utilization: a.Utilization,
            isScenario: a.IsScenario === 1
          }))
        };
      });
      
      return {
        resourceId,
        name: resource.Name,
        role: resource.Role,
        months: monthlyData
      };
    });
    
    res.json({
      startDate: forecastStartDate,
      endDate: forecastEndDate,
      months: forecastMonths.map(m => m.label),
      resources: capacityForecast
    });
  } catch (err) {
    console.error('Error generating capacity forecast:', err);
    res.status(500).json({
      message: 'Error generating capacity forecast',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Apply scenario allocations to real allocations
const applyScenario = async (req, res) => {
  try {
    const { scenarioId } = req.params;
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    
    try {
      // Check if scenario exists
      const scenarioCheck = await transaction.request()
        .input('scenarioId', sql.Int, scenarioId)
        .query(`SELECT ScenarioID FROM CapacityScenarios WHERE ScenarioID = @scenarioId`);
      
      if (scenarioCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Scenario not found' });
      }
      
      // Get scenario allocations
      const scenarioAllocations = await transaction.request()
        .input('scenarioId', sql.Int, scenarioId)
        .query(`
          SELECT 
            ResourceID,
            ProjectID,
            StartDate,
            EndDate,
            Utilization,
            Notes
          FROM ScenarioAllocations
          WHERE ScenarioID = @scenarioId
        `);
      
      // Apply each scenario allocation to real allocations
      for (const allocation of scenarioAllocations.recordset) {
        // Check if a real allocation already exists
        const existingAllocation = await transaction.request()
          .input('resourceId', sql.Int, allocation.ResourceID)
          .input('projectId', sql.Int, allocation.ProjectID)
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
            .input('allocationId', sql.Int, existingAllocation.recordset[0].AllocationID)
            .input('startDate', sql.Date, allocation.StartDate)
            .input('endDate', sql.Date, allocation.EndDate)
            .input('utilization', sql.Int, allocation.Utilization)
            .input('notes', sql.NVarChar, allocation.Notes)
            .query(`
              UPDATE Allocations
              SET StartDate = @startDate,
                  EndDate = @endDate,
                  Utilization = @utilization,
                  Notes = @notes,
                  UpdatedAt = GETDATE()
              WHERE AllocationID = @allocationId
            `);
        } else {
          // Create new allocation
          await transaction.request()
            .input('resourceId', sql.Int, allocation.ResourceID)
            .input('projectId', sql.Int, allocation.ProjectID)
            .input('startDate', sql.Date, allocation.StartDate)
            .input('endDate', sql.Date, allocation.EndDate)
            .input('utilization', sql.Int, allocation.Utilization)
            .input('notes', sql.NVarChar, allocation.Notes)
            .query(`
              INSERT INTO Allocations (
                ResourceID, ProjectID, StartDate, EndDate, 
                Utilization, Notes
              )
              VALUES (
                @resourceId, @projectId, @startDate, @endDate, 
                @utilization, @notes
              )
            `);
        }
      }
      
      await transaction.commit();
      res.json({ message: 'Scenario applied successfully' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error applying scenario:', err);
    res.status(500).json({
      message: 'Error applying scenario',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

module.exports = {
  createScenario,
  getScenarios,
  getScenarioById,
  updateScenario,
  updateScenarioAllocation,
  deleteScenarioAllocation,
  getCapacityForecast,
  applyScenario
};