// whatIfScenarioController.js
const { poolPromise, sql } = require('../db/config');

// Create a new what-if scenario
const createWhatIfScenario = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      baseScenarioId, 
      startDate, 
      endDate,
      cloneFromBaseScenario
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Scenario name is required' });
    }
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Create the scenario
      const scenarioResult = await transaction.request()
        .input('name', sql.NVarChar, name)
        .input('description', sql.NVarChar, description || null)
        .input('type', sql.NVarChar, 'WHATIF')
        .input('baseScenarioId', sql.Int, baseScenarioId || null)
        .input('startDate', sql.Date, new Date(startDate))
        .input('endDate', sql.Date, new Date(endDate))
        .query(`
          INSERT INTO CapacityScenarios (
            Name, Description, Type, BaseScenarioID, 
            StartDate, EndDate
          )
          OUTPUT INSERTED.ScenarioID
          VALUES (
            @name, @description, @type, @baseScenarioId, 
            @startDate, @endDate
          )
        `);
      
      const newScenarioId = scenarioResult.recordset[0].ScenarioID;
      
      // If cloning from base scenario, copy allocations
      if (cloneFromBaseScenario && baseScenarioId) {
        await transaction.request()
          .input('newScenarioId', sql.Int, newScenarioId)
          .input('baseScenarioId', sql.Int, baseScenarioId)
          .query(`
            INSERT INTO ScenarioAllocations (
              ScenarioID, ResourceID, ProjectID, StartDate, EndDate,
              Utilization, Notes, BillableRate, HourlyRate, TotalHours,
              SkillsRequired, RolesRequired
            )
            SELECT 
              @newScenarioId, ResourceID, ProjectID, StartDate, EndDate,
              Utilization, Notes, BillableRate, HourlyRate, TotalHours,
              SkillsRequired, RolesRequired
            FROM ScenarioAllocations
            WHERE ScenarioID = @baseScenarioId
          `);
      }
      
      await transaction.commit();
      
      // Get the newly created scenario
      const getResult = await pool.request()
        .input('scenarioId', sql.Int, newScenarioId)
        .query(`
          SELECT 
            ScenarioID as id,
            Name as name,
            Description as description,
            Type as type,
            BaseScenarioID as baseScenarioId,
            StartDate as startDate,
            EndDate as endDate,
            IsActive as isActive,
            CreatedAt as createdAt
          FROM CapacityScenarios
          WHERE ScenarioID = @scenarioId
        `);
      
      res.status(201).json(getResult.recordset[0]);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error creating what-if scenario:', err);
    res.status(500).json({
      message: 'Error creating what-if scenario',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Get all what-if scenarios
const getWhatIfScenarios = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .query(`
        SELECT 
          ScenarioID as id,
          Name as name,
          Description as description,
          Type as type,
          BaseScenarioID as baseScenarioId,
          StartDate as startDate,
          EndDate as endDate,
          IsActive as isActive,
          CreatedAt as createdAt
        FROM CapacityScenarios
        WHERE Type = 'WHATIF'
        ORDER BY CreatedAt DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching what-if scenarios:', err);
    res.status(500).json({
      message: 'Error fetching what-if scenarios',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Get a what-if scenario by ID with all details
const getWhatIfScenarioById = async (req, res) => {
  try {
    const { scenarioId } = req.params;
    
    const pool = await poolPromise;
    
    // Variable to store the table check results - defined here so it's available throughout the function
    let tableExistsResult = { recordset: [{ 
      scenarios_table: null,
      allocations_table: null,
      timeline_changes_table: null,
      resource_changes_table: null
    }]};
    
    // First check if the required tables exist
    try {
      tableExistsResult = await pool.request().query(`
        SELECT 
          OBJECT_ID('CapacityScenarios') as scenarios_table,
          OBJECT_ID('ScenarioAllocations') as allocations_table,
          OBJECT_ID('ScenarioTimelineChanges') as timeline_changes_table,
          OBJECT_ID('ScenarioResourceChanges') as resource_changes_table
      `);
      
      const checkTables = tableExistsResult.recordset[0];
      
      // If any of the required tables don't exist, return appropriate error
      if (!checkTables.scenarios_table) {
        return res.status(500).json({ 
          message: 'What-if scenario feature is not properly configured', 
          details: 'Missing database tables. Please run the whatif-scenario-tables.sql script.' 
        });
      }
    } catch (tableCheckError) {
      console.error('Error checking for WhatIf scenario tables:', tableCheckError);
      return res.status(500).json({ 
        message: 'What-if scenario feature is not properly configured', 
        error: process.env.NODE_ENV === 'production' ? {} : tableCheckError.message 
      });
    }
    
    // Get scenario details
    const scenarioResult = await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .query(`
        SELECT 
          ScenarioID as id,
          Name as name,
          Description as description,
          Type as type,
          BaseScenarioID as baseScenarioId,
          StartDate as startDate,
          EndDate as endDate,
          MetricsData as metricsData,
          ComparisonData as comparisonData,
          IsActive as isActive,
          CreatedAt as createdAt
        FROM CapacityScenarios
        WHERE ScenarioID = @scenarioId AND Type = 'WHATIF'
      `);
    
    if (scenarioResult.recordset.length === 0) {
      return res.status(404).json({ message: 'What-if scenario not found' });
    }
    
    const scenario = scenarioResult.recordset[0];
    
    // Initialize the response object with values that would exist even if some tables are missing
    const response = {
      ...scenario,
      allocations: [],
      timelineChanges: [],
      resourceChanges: []
    };
    
    // Try to get allocations - continue even if it fails
    try {
      // Check if the table exists
      if (tableExistsResult.recordset[0].allocations_table) {
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
              sa.BillableRate as billableRate,
              sa.HourlyRate as hourlyRate,
              sa.TotalHours as totalHours,
              sa.SkillsRequired as skillsRequired,
              sa.RolesRequired as rolesRequired,
              sa.Notes as notes
            FROM ScenarioAllocations sa
            INNER JOIN Resources r ON sa.ResourceID = r.ResourceID
            INNER JOIN Projects p ON sa.ProjectID = p.ProjectID
            WHERE sa.ScenarioID = @scenarioId
            ORDER BY sa.StartDate
          `);
        
        response.allocations = allocationsResult.recordset;
      }
    } catch (allocationsError) {
      console.error('Error fetching scenario allocations:', allocationsError);
      // Continue with other data, just log the error
    }
    
    // Try to get timeline changes - continue even if it fails
    try {
      // Check if the table exists
      if (tableExistsResult.recordset[0].timeline_changes_table) {
        const timelineChangesResult = await pool.request()
          .input('scenarioId', sql.Int, scenarioId)
          .query(`
            SELECT 
              tc.ChangeID as id,
              tc.ProjectID as projectId,
              p.Name as projectName,
              tc.OriginalStartDate as originalStartDate,
              tc.OriginalEndDate as originalEndDate,
              tc.NewStartDate as newStartDate,
              tc.NewEndDate as newEndDate,
              tc.Notes as notes
            FROM ScenarioTimelineChanges tc
            INNER JOIN Projects p ON tc.ProjectID = p.ProjectID
            WHERE tc.ScenarioID = @scenarioId
            ORDER BY tc.CreatedAt
          `);
        
        response.timelineChanges = timelineChangesResult.recordset;
      }
    } catch (timelineChangesError) {
      console.error('Error fetching timeline changes:', timelineChangesError);
      // Continue with other data, just log the error
    }
    
    // Try to get resource changes - continue even if it fails
    try {
      // Check if the table exists
      if (tableExistsResult.recordset[0].resource_changes_table) {
        const resourceChangesResult = await pool.request()
          .input('scenarioId', sql.Int, scenarioId)
          .query(`
            SELECT 
              rc.ChangeID as id,
              rc.ResourceID as resourceId,
              rc.ResourceName as resourceName,
              rc.ResourceRole as resourceRole,
              rc.Skills as skills,
              rc.HourlyRate as hourlyRate,
              rc.BillableRate as billableRate,
              rc.ChangeType as changeType,
              rc.Notes as notes
            FROM ScenarioResourceChanges rc
            WHERE rc.ScenarioID = @scenarioId
            ORDER BY rc.CreatedAt
          `);
        
        response.resourceChanges = resourceChangesResult.recordset;
      }
    } catch (resourceChangesError) {
      console.error('Error fetching resource changes:', resourceChangesError);
      // Continue with other data, just log the error
    }
    
    // Return combined response, even if some parts failed
    res.json(response);
  } catch (err) {
    console.error('Error fetching what-if scenario details:', err);
    res.status(500).json({
      message: 'Error fetching what-if scenario details',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Update project timeline in a scenario
const updateProjectTimeline = async (req, res) => {
  try {
    const { scenarioId, projectId } = req.params;
    const { newStartDate, newEndDate, notes } = req.body;
    
    if (!newStartDate || !newEndDate) {
      return res.status(400).json({ message: 'New start and end dates are required' });
    }
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Get original project timeline
      const originalProject = await transaction.request()
        .input('projectId', sql.Int, projectId)
        .query(`
          SELECT StartDate, EndDate
          FROM Projects
          WHERE ProjectID = @projectId
        `);
      
      if (originalProject.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Project not found' });
      }
      
      const originalStartDate = originalProject.recordset[0].StartDate;
      const originalEndDate = originalProject.recordset[0].EndDate;
      
      // Check if there's an existing timeline change
      const existingChange = await transaction.request()
        .input('scenarioId', sql.Int, scenarioId)
        .input('projectId', sql.Int, projectId)
        .query(`
          SELECT ChangeID
          FROM ScenarioTimelineChanges
          WHERE ScenarioID = @scenarioId AND ProjectID = @projectId
        `);
      
      if (existingChange.recordset.length > 0) {
        // Update existing change
        await transaction.request()
          .input('changeId', sql.Int, existingChange.recordset[0].ChangeID)
          .input('newStartDate', sql.Date, new Date(newStartDate))
          .input('newEndDate', sql.Date, new Date(newEndDate))
          .input('notes', sql.NVarChar, notes || null)
          .query(`
            UPDATE ScenarioTimelineChanges
            SET NewStartDate = @newStartDate,
                NewEndDate = @newEndDate,
                Notes = @notes,
                UpdatedAt = GETDATE()
            WHERE ChangeID = @changeId
          `);
      } else {
        // Create new timeline change
        await transaction.request()
          .input('scenarioId', sql.Int, scenarioId)
          .input('projectId', sql.Int, projectId)
          .input('originalStartDate', sql.Date, originalStartDate)
          .input('originalEndDate', sql.Date, originalEndDate)
          .input('newStartDate', sql.Date, new Date(newStartDate))
          .input('newEndDate', sql.Date, new Date(newEndDate))
          .input('notes', sql.NVarChar, notes || null)
          .query(`
            INSERT INTO ScenarioTimelineChanges (
              ScenarioID, ProjectID, OriginalStartDate, OriginalEndDate,
              NewStartDate, NewEndDate, Notes
            )
            VALUES (
              @scenarioId, @projectId, @originalStartDate, @originalEndDate,
              @newStartDate, @newEndDate, @notes
            )
          `);
      }
      
      // Also update any allocations for this project in the scenario
      await transaction.request()
        .input('scenarioId', sql.Int, scenarioId)
        .input('projectId', sql.Int, projectId)
        .input('newStartDate', sql.Date, new Date(newStartDate))
        .input('newEndDate', sql.Date, new Date(newEndDate))
        .query(`
          UPDATE ScenarioAllocations
          SET StartDate = CASE
                WHEN StartDate < @newStartDate THEN @newStartDate
                ELSE StartDate
              END,
              EndDate = CASE
                WHEN EndDate > @newEndDate THEN @newEndDate
                ELSE EndDate
              END,
              UpdatedAt = GETDATE()
          WHERE ScenarioID = @scenarioId AND ProjectID = @projectId
        `);
      
      await transaction.commit();
      
      // Get the updated timeline change
      const result = await pool.request()
        .input('scenarioId', sql.Int, scenarioId)
        .input('projectId', sql.Int, projectId)
        .query(`
          SELECT 
            tc.ChangeID as id,
            tc.ProjectID as projectId,
            p.Name as projectName,
            tc.OriginalStartDate as originalStartDate,
            tc.OriginalEndDate as originalEndDate,
            tc.NewStartDate as newStartDate,
            tc.NewEndDate as newEndDate,
            tc.Notes as notes
          FROM ScenarioTimelineChanges tc
          INNER JOIN Projects p ON tc.ProjectID = p.ProjectID
          WHERE tc.ScenarioID = @scenarioId AND tc.ProjectID = @projectId
        `);
      
      res.json(result.recordset[0]);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error updating project timeline:', err);
    res.status(500).json({
      message: 'Error updating project timeline',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Add or modify a resource in a scenario
const updateScenarioResource = async (req, res) => {
  try {
    const { scenarioId } = req.params;

    // Handle resource allocation case
    if (req.body.resourceId && req.body.allocationData) {
      return handleResourceAllocation(req, res, scenarioId);
    }

    // Original resource change functionality
    const {
      resourceId,
      resourceName,
      resourceRole,
      skills,
      hourlyRate,
      billableRate,
      changeType,
      notes
    } = req.body;

    if (!changeType || !['ADD', 'REMOVE', 'MODIFY'].includes(changeType)) {
      return res.status(400).json({ message: 'Valid change type is required' });
    }

    if (changeType === 'ADD' && (!resourceName || !resourceRole)) {
      return res.status(400).json({ message: 'Resource name and role are required for new resources' });
    }

    if ((changeType === 'REMOVE' || changeType === 'MODIFY') && !resourceId) {
      return res.status(400).json({ message: 'Resource ID is required for existing resources' });
    }

    const pool = await poolPromise;

    // Check if there's an existing resource change
    const existingChange = resourceId ? await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT ChangeID
        FROM ScenarioResourceChanges
        WHERE ScenarioID = @scenarioId AND ResourceID = @resourceId
      `) : { recordset: [] };

    if (existingChange.recordset.length > 0) {
      // Update existing change
      await pool.request()
        .input('changeId', sql.Int, existingChange.recordset[0].ChangeID)
        .input('resourceName', sql.NVarChar, resourceName || null)
        .input('resourceRole', sql.NVarChar, resourceRole || null)
        .input('skills', sql.NVarChar, skills ? JSON.stringify(skills) : null)
        .input('hourlyRate', sql.Money, hourlyRate || null)
        .input('billableRate', sql.Money, billableRate || null)
        .input('changeType', sql.NVarChar, changeType)
        .input('notes', sql.NVarChar, notes || null)
        .query(`
          UPDATE ScenarioResourceChanges
          SET ResourceName = @resourceName,
              ResourceRole = @resourceRole,
              Skills = @skills,
              HourlyRate = @hourlyRate,
              BillableRate = @billableRate,
              ChangeType = @changeType,
              Notes = @notes,
              UpdatedAt = GETDATE()
          WHERE ChangeID = @changeId
        `);
    } else {
      // Create new resource change
      await pool.request()
        .input('scenarioId', sql.Int, scenarioId)
        .input('resourceId', sql.Int, resourceId || null)
        .input('resourceName', sql.NVarChar, resourceName || null)
        .input('resourceRole', sql.NVarChar, resourceRole || null)
        .input('skills', sql.NVarChar, skills ? JSON.stringify(skills) : null)
        .input('hourlyRate', sql.Money, hourlyRate || null)
        .input('billableRate', sql.Money, billableRate || null)
        .input('changeType', sql.NVarChar, changeType)
        .input('notes', sql.NVarChar, notes || null)
        .query(`
          INSERT INTO ScenarioResourceChanges (
            ScenarioID, ResourceID, ResourceName, ResourceRole,
            Skills, HourlyRate, BillableRate, ChangeType, Notes
          )
          VALUES (
            @scenarioId, @resourceId, @resourceName, @resourceRole,
            @skills, @hourlyRate, @billableRate, @changeType, @notes
          )
        `);

      // If removing a resource, also remove any allocations for this resource in the scenario
      if (changeType === 'REMOVE' && resourceId) {
        await pool.request()
          .input('scenarioId', sql.Int, scenarioId)
          .input('resourceId', sql.Int, resourceId)
          .query(`
            DELETE FROM ScenarioAllocations
            WHERE ScenarioID = @scenarioId AND ResourceID = @resourceId
          `);
      }
    }

    // Get the updated resource change
    const result = await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .input('resourceId', sql.Int, resourceId || null)
      .query(`
        SELECT
          rc.ChangeID as id,
          rc.ResourceID as resourceId,
          rc.ResourceName as resourceName,
          rc.ResourceRole as resourceRole,
          rc.Skills as skills,
          rc.HourlyRate as hourlyRate,
          rc.BillableRate as billableRate,
          rc.ChangeType as changeType,
          rc.Notes as notes
        FROM ScenarioResourceChanges rc
        WHERE rc.ScenarioID = @scenarioId
        ${resourceId ? 'AND rc.ResourceID = @resourceId' : 'AND rc.ResourceID IS NULL'}
        ORDER BY rc.CreatedAt DESC
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error updating scenario resource:', err);
    res.status(500).json({
      message: 'Error updating scenario resource',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Handle resource allocation as a separate function
const handleResourceAllocation = async (req, res, scenarioId) => {
  try {
    const { resourceId, allocationData } = req.body;

    if (!resourceId) {
      return res.status(400).json({ message: 'Resource ID is required' });
    }

    if (!allocationData || !allocationData.projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    if (!allocationData.startDate || !allocationData.endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    if (!allocationData.utilization || allocationData.utilization < 1 || allocationData.utilization > 100) {
      return res.status(400).json({ message: 'Valid utilization percentage (1-100) is required' });
    }

    const pool = await poolPromise;

    // Check if there's an existing allocation
    const query = allocationData.id
      ? `SELECT ScenarioAllocationID FROM ScenarioAllocations
         WHERE ScenarioID = @scenarioId AND ScenarioAllocationID = @allocationId`
      : `SELECT ScenarioAllocationID FROM ScenarioAllocations
         WHERE ScenarioID = @scenarioId AND ResourceID = @resourceId AND ProjectID = @projectId`;

    const existingAllocation = await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .input('resourceId', sql.Int, resourceId)
      .input('projectId', sql.Int, allocationData.projectId)
      .input('allocationId', sql.Int, allocationData.id || 0)
      .query(query);

    let result;

    if (existingAllocation.recordset.length > 0) {
      // Update existing allocation
      const allocationId = allocationData.id || existingAllocation.recordset[0].ScenarioAllocationID;

      await pool.request()
        .input('allocationId', sql.Int, allocationId)
        .input('startDate', sql.Date, new Date(allocationData.startDate))
        .input('endDate', sql.Date, new Date(allocationData.endDate))
        .input('utilization', sql.Int, allocationData.utilization)
        .input('notes', sql.NVarChar, allocationData.notes || null)
        .input('billableRate', sql.Money, allocationData.billableRate || null)
        .input('hourlyRate', sql.Money, allocationData.hourlyRate || null)
        .input('totalHours', sql.Int, allocationData.totalHours || null)
        .input('skillsRequired', sql.NVarChar, allocationData.skillsRequired || null)
        .input('rolesRequired', sql.NVarChar, allocationData.rolesRequired || null)
        .query(`
          UPDATE ScenarioAllocations
          SET StartDate = @startDate,
              EndDate = @endDate,
              Utilization = @utilization,
              Notes = @notes,
              BillableRate = @billableRate,
              HourlyRate = @hourlyRate,
              TotalHours = @totalHours,
              SkillsRequired = @skillsRequired,
              RolesRequired = @rolesRequired,
              UpdatedAt = GETDATE()
          WHERE ScenarioAllocationID = @allocationId
        `);

      // Get the updated allocation
      result = await pool.request()
        .input('allocationId', sql.Int, allocationId)
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
            sa.BillableRate as billableRate,
            sa.HourlyRate as hourlyRate,
            sa.TotalHours as totalHours,
            sa.SkillsRequired as skillsRequired,
            sa.RolesRequired as rolesRequired,
            sa.Notes as notes
          FROM ScenarioAllocations sa
          INNER JOIN Resources r ON sa.ResourceID = r.ResourceID
          INNER JOIN Projects p ON sa.ProjectID = p.ProjectID
          WHERE sa.ScenarioAllocationID = @allocationId
        `);
    } else {
      // Create new allocation
      const insertResult = await pool.request()
        .input('scenarioId', sql.Int, scenarioId)
        .input('resourceId', sql.Int, resourceId)
        .input('projectId', sql.Int, allocationData.projectId)
        .input('startDate', sql.Date, new Date(allocationData.startDate))
        .input('endDate', sql.Date, new Date(allocationData.endDate))
        .input('utilization', sql.Int, allocationData.utilization)
        .input('notes', sql.NVarChar, allocationData.notes || null)
        .input('billableRate', sql.Money, allocationData.billableRate || null)
        .input('hourlyRate', sql.Money, allocationData.hourlyRate || null)
        .input('totalHours', sql.Int, allocationData.totalHours || null)
        .input('skillsRequired', sql.NVarChar, allocationData.skillsRequired || null)
        .input('rolesRequired', sql.NVarChar, allocationData.rolesRequired || null)
        .query(`
          INSERT INTO ScenarioAllocations (
            ScenarioID, ResourceID, ProjectID, StartDate, EndDate,
            Utilization, Notes, BillableRate, HourlyRate, TotalHours,
            SkillsRequired, RolesRequired
          )
          OUTPUT INSERTED.ScenarioAllocationID
          VALUES (
            @scenarioId, @resourceId, @projectId, @startDate, @endDate,
            @utilization, @notes, @billableRate, @hourlyRate, @totalHours,
            @skillsRequired, @rolesRequired
          )
        `);

      const newAllocationId = insertResult.recordset[0].ScenarioAllocationID;

      // Get the newly created allocation
      result = await pool.request()
        .input('allocationId', sql.Int, newAllocationId)
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
            sa.BillableRate as billableRate,
            sa.HourlyRate as hourlyRate,
            sa.TotalHours as totalHours,
            sa.SkillsRequired as skillsRequired,
            sa.RolesRequired as rolesRequired,
            sa.Notes as notes
          FROM ScenarioAllocations sa
          INNER JOIN Resources r ON sa.ResourceID = r.ResourceID
          INNER JOIN Projects p ON sa.ProjectID = p.ProjectID
          WHERE sa.ScenarioAllocationID = @allocationId
        `);
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error handling resource allocation:', err);
    res.status(500).json({
      message: 'Error handling resource allocation',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Calculate and update scenario metrics
const calculateScenarioMetrics = async (req, res) => {
  try {
    const { scenarioId } = req.params;
    
    const pool = await poolPromise;
    
    // Get the scenario
    const scenarioResult = await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .query(`
        SELECT 
          ScenarioID as id,
          StartDate as startDate,
          EndDate as endDate
        FROM CapacityScenarios
        WHERE ScenarioID = @scenarioId
      `);
    
    if (scenarioResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Scenario not found' });
    }
    
    const scenario = scenarioResult.recordset[0];
    
    // Get all allocations in this scenario
    const allocationsResult = await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .query(`
        SELECT 
          sa.ResourceID as resourceId,
          r.Name as resourceName,
          r.HourlyRate as resourceHourlyRate,
          r.BillableRate as resourceBillableRate,
          sa.ProjectID as projectId,
          p.Name as projectName,
          sa.StartDate as startDate,
          sa.EndDate as endDate,
          sa.Utilization as utilization,
          sa.BillableRate as allocationBillableRate,
          sa.HourlyRate as allocationHourlyRate,
          sa.TotalHours as totalHours,
          sa.SkillsRequired as skillsRequired,
          sa.RolesRequired as rolesRequired
        FROM ScenarioAllocations sa
        INNER JOIN Resources r ON sa.ResourceID = r.ResourceID
        INNER JOIN Projects p ON sa.ProjectID = p.ProjectID
        WHERE sa.ScenarioID = @scenarioId
      `);
    
    // Get timeline changes
    const timelineChangesResult = await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .query(`
        SELECT 
          tc.ProjectID as projectId,
          p.Name as projectName,
          tc.OriginalStartDate as originalStartDate,
          tc.OriginalEndDate as originalEndDate,
          tc.NewStartDate as newStartDate,
          tc.NewEndDate as newEndDate
        FROM ScenarioTimelineChanges tc
        INNER JOIN Projects p ON tc.ProjectID = p.ProjectID
        WHERE tc.ScenarioID = @scenarioId
      `);
    
    // Get resource changes
    const resourceChangesResult = await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .query(`
        SELECT 
          rc.ResourceID as resourceId,
          rc.ResourceName as resourceName,
          rc.ResourceRole as resourceRole,
          rc.Skills as skills,
          rc.HourlyRate as hourlyRate,
          rc.BillableRate as billableRate,
          rc.ChangeType as changeType
        FROM ScenarioResourceChanges rc
        WHERE rc.ScenarioID = @scenarioId
      `);
    
    // Get all skills in the system
    const skillsResult = await pool.request()
      .query(`
        SELECT SkillID as id, Name as name, Category as category
        FROM Skills
      `);
    
    // Get all roles in the system
    const rolesResult = await pool.request()
      .query(`
        SELECT RoleID as id, Name as name
        FROM Roles
      `);
    
    // Calculate metrics
    const allocations = allocationsResult.recordset;
    const timelineChanges = timelineChangesResult.recordset;
    const resourceChanges = resourceChangesResult.recordset;
    const skills = skillsResult.recordset;
    const roles = rolesResult.recordset;
    
    // Calculate total utilization
    const utilization = {
      byResource: {},
      overall: 0,
      resourceCount: 0
    };
    
    // Calculate costs
    const costs = {
      totalCost: 0,
      totalBillable: 0,
      margin: 0,
      byProject: {}
    };
    
    // Skills coverage
    const skillsCoverage = {
      covered: [],
      missing: [],
      coveragePercentage: 0
    };
    
    // Process allocations for utilization and costs
    allocations.forEach(allocation => {
      const resourceId = allocation.resourceId;
      const projectId = allocation.projectId;
      
      // Utilization
      if (!utilization.byResource[resourceId]) {
        utilization.byResource[resourceId] = {
          resourceId,
          resourceName: allocation.resourceName,
          totalUtilization: 0,
          allocations: []
        };
        utilization.resourceCount++;
      }
      
      utilization.byResource[resourceId].totalUtilization += allocation.utilization;
      utilization.byResource[resourceId].allocations.push({
        projectId,
        projectName: allocation.projectName,
        utilization: allocation.utilization
      });
      
      // Costs
      const startDate = new Date(allocation.startDate);
      const endDate = new Date(allocation.endDate);
      const durationDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
      const workDays = Math.max(1, Math.round(durationDays * 5/7)); // Approximate workdays
      
      const hourlyRate = allocation.allocationHourlyRate || allocation.resourceHourlyRate || 0;
      const billableRate = allocation.allocationBillableRate || allocation.resourceBillableRate || 0;
      
      const hours = allocation.totalHours || (workDays * 8 * (allocation.utilization / 100));
      const cost = hourlyRate * hours;
      const billable = billableRate * hours;
      
      if (!costs.byProject[projectId]) {
        costs.byProject[projectId] = {
          projectId,
          projectName: allocation.projectName,
          totalCost: 0,
          totalBillable: 0,
          margin: 0
        };
      }
      
      costs.byProject[projectId].totalCost += cost;
      costs.byProject[projectId].totalBillable += billable;
      costs.totalCost += cost;
      costs.totalBillable += billable;
    });
    
    // Calculate overall utilization average
    Object.values(utilization.byResource).forEach(resource => {
      utilization.overall += resource.totalUtilization;
    });
    
    if (utilization.resourceCount > 0) {
      utilization.overall = Math.round(utilization.overall / utilization.resourceCount);
    }
    
    // Calculate margin
    if (costs.totalCost > 0) {
      costs.margin = Math.round(((costs.totalBillable - costs.totalCost) / costs.totalCost) * 100);
      
      // Calculate project margins
      Object.keys(costs.byProject).forEach(projectId => {
        const project = costs.byProject[projectId];
        if (project.totalCost > 0) {
          project.margin = Math.round(((project.totalBillable - project.totalCost) / project.totalCost) * 100);
        }
      });
    }
    
    // Process skills coverage
    // Extract required skills from allocations
    const requiredSkills = new Set();
    allocations.forEach(allocation => {
      if (allocation.skillsRequired) {
        try {
          const skillsJson = JSON.parse(allocation.skillsRequired);
          skillsJson.forEach(skill => {
            if (typeof skill === 'object' && skill.id) {
              requiredSkills.add(skill.id);
            } else if (typeof skill === 'string') {
              // Find skill ID by name
              const matchingSkill = skills.find(s => s.name.toLowerCase() === skill.toLowerCase());
              if (matchingSkill) {
                requiredSkills.add(matchingSkill.id);
              }
            }
          });
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });
    
    // Get available skills from resources
    const availableSkills = new Set();
    // First, get skills from real resources that aren't removed
    const removedResourceIds = resourceChanges
      .filter(rc => rc.changeType === 'REMOVE')
      .map(rc => rc.resourceId);
    
    // Get skills for real resources in allocations that aren't removed
    allocations.forEach(allocation => {
      if (!removedResourceIds.includes(allocation.resourceId)) {
        // Get resource skills from database - this would need to be added
        // For now, we'll assume all skills are covered
        availableSkills.add(allocation.resourceId);
      }
    });
    
    // Add skills from added resources
    resourceChanges
      .filter(rc => rc.changeType === 'ADD')
      .forEach(rc => {
        if (rc.skills) {
          try {
            const skillsJson = JSON.parse(rc.skills);
            skillsJson.forEach(skill => {
              if (typeof skill === 'object' && skill.id) {
                availableSkills.add(skill.id);
              } else if (typeof skill === 'string') {
                // Find skill ID by name
                const matchingSkill = skills.find(s => s.name.toLowerCase() === skill.toLowerCase());
                if (matchingSkill) {
                  availableSkills.add(matchingSkill.id);
                }
              }
            });
          } catch (e) {
            // Skip invalid JSON
          }
        }
      });
    
    // Determine covered and missing skills
    requiredSkills.forEach(skillId => {
      if (availableSkills.has(skillId)) {
        const skill = skills.find(s => s.id === skillId);
        if (skill) {
          skillsCoverage.covered.push({
            id: skill.id,
            name: skill.name,
            category: skill.category
          });
        }
      } else {
        const skill = skills.find(s => s.id === skillId);
        if (skill) {
          skillsCoverage.missing.push({
            id: skill.id,
            name: skill.name,
            category: skill.category
          });
        }
      }
    });
    
    // Calculate coverage percentage
    const totalRequired = requiredSkills.size;
    const totalCovered = skillsCoverage.covered.length;
    
    if (totalRequired > 0) {
      skillsCoverage.coveragePercentage = Math.round((totalCovered / totalRequired) * 100);
    } else {
      skillsCoverage.coveragePercentage = 100; // No skills required means 100% coverage
    }
    
    // Compile all metrics
    const metricsData = {
      utilization,
      costs,
      skillsCoverage,
      calculatedAt: new Date()
    };
    
    // Update the scenario with the metrics
    await pool.request()
      .input('scenarioId', sql.Int, scenarioId)
      .input('metricsData', sql.NVarChar, JSON.stringify(metricsData))
      .query(`
        UPDATE CapacityScenarios
        SET MetricsData = @metricsData,
            UpdatedAt = GETDATE()
        WHERE ScenarioID = @scenarioId
      `);
    
    res.json(metricsData);
  } catch (err) {
    console.error('Error calculating scenario metrics:', err);
    res.status(500).json({
      message: 'Error calculating scenario metrics',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Compare multiple scenarios
const compareScenarios = async (req, res) => {
  try {
    const { scenarioIds, name, description, metrics } = req.body;
    
    if (!scenarioIds || !Array.isArray(scenarioIds) || scenarioIds.length < 2) {
      return res.status(400).json({ message: 'At least two scenario IDs are required' });
    }
    
    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ message: 'At least one metric is required for comparison' });
    }
    
    const pool = await poolPromise;
    
    // Get scenarios
    const scenariosResult = await pool.request()
      .query(`
        SELECT 
          ScenarioID as id,
          Name as name,
          Description as description,
          StartDate as startDate,
          EndDate as endDate,
          MetricsData as metricsData
        FROM CapacityScenarios
        WHERE ScenarioID IN (${scenarioIds.join(',')})
      `);
    
    const scenarios = scenariosResult.recordset;
    
    if (scenarios.length !== scenarioIds.length) {
      return res.status(400).json({ message: 'One or more scenarios not found' });
    }
    
    // Ensure all scenarios have metrics calculated
    const scenariosWithoutMetrics = scenarios.filter(s => !s.metricsData);
    if (scenariosWithoutMetrics.length > 0) {
      return res.status(400).json({ 
        message: 'Some scenarios do not have metrics calculated',
        scenariosWithoutMetrics: scenariosWithoutMetrics.map(s => ({ id: s.id, name: s.name }))
      });
    }
    
    // Parse metrics data
    scenarios.forEach(scenario => {
      scenario.metricsData = JSON.parse(scenario.metricsData);
    });
    
    // Get date range that covers all scenarios
    let startDate = new Date(scenarios[0].startDate);
    let endDate = new Date(scenarios[0].endDate);
    
    scenarios.forEach(scenario => {
      const scenarioStart = new Date(scenario.startDate);
      const scenarioEnd = new Date(scenario.endDate);
      
      if (scenarioStart < startDate) startDate = scenarioStart;
      if (scenarioEnd > endDate) endDate = scenarioEnd;
    });
    
    // Create comparison data
    const comparisons = {};
    
    // Compare requested metrics
    if (metrics.includes('utilization')) {
      comparisons.utilization = scenarios.map(scenario => ({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        overall: scenario.metricsData.utilization.overall,
        byResource: scenario.metricsData.utilization.byResource
      }));
    }
    
    if (metrics.includes('costs')) {
      comparisons.costs = scenarios.map(scenario => ({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        totalCost: scenario.metricsData.costs.totalCost,
        totalBillable: scenario.metricsData.costs.totalBillable,
        margin: scenario.metricsData.costs.margin,
        byProject: scenario.metricsData.costs.byProject
      }));
    }
    
    if (metrics.includes('skills')) {
      comparisons.skills = scenarios.map(scenario => ({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        coveragePercentage: scenario.metricsData.skillsCoverage.coveragePercentage,
        covered: scenario.metricsData.skillsCoverage.covered.length,
        missing: scenario.metricsData.skillsCoverage.missing.length
      }));
    }
    
    // Save comparison to database if name provided
    let comparisonId = null;
    if (name) {
      const comparisonResult = await pool.request()
        .input('name', sql.NVarChar, name)
        .input('description', sql.NVarChar, description || null)
        .input('scenarios', sql.NVarChar, JSON.stringify(scenarioIds))
        .input('startDate', sql.Date, startDate)
        .input('endDate', sql.Date, endDate)
        .input('metricsToCompare', sql.NVarChar, JSON.stringify(metrics))
        .input('comparisonData', sql.NVarChar, JSON.stringify(comparisons))
        .query(`
          INSERT INTO ScenarioComparisons (
            Name, Description, Scenarios, StartDate, EndDate,
            MetricsToCompare, ComparisonData
          )
          OUTPUT INSERTED.ComparisonID
          VALUES (
            @name, @description, @scenarios, @startDate, @endDate,
            @metricsToCompare, @comparisonData
          )
        `);
      
      comparisonId = comparisonResult.recordset[0].ComparisonID;
    }
    
    res.json({
      id: comparisonId,
      name: name || 'Temporary Comparison',
      description: description,
      scenarios: scenarios.map(s => ({ id: s.id, name: s.name })),
      startDate,
      endDate,
      metrics,
      comparisons
    });
  } catch (err) {
    console.error('Error comparing scenarios:', err);
    res.status(500).json({
      message: 'Error comparing scenarios',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Promote scenario to production (apply changes)
const promoteScenario = async (req, res) => {
  try {
    const { scenarioId } = req.params;
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    
    try {
      // Check if scenario exists and is a what-if scenario
      const scenarioCheck = await transaction.request()
        .input('scenarioId', sql.Int, scenarioId)
        .query(`
          SELECT ScenarioID, Name
          FROM CapacityScenarios
          WHERE ScenarioID = @scenarioId AND Type = 'WHATIF'
        `);
      
      if (scenarioCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'What-if scenario not found' });
      }
      
      // 1. Apply timeline changes to real projects
      const timelineChanges = await transaction.request()
        .input('scenarioId', sql.Int, scenarioId)
        .query(`
          SELECT ProjectID, NewStartDate, NewEndDate
          FROM ScenarioTimelineChanges
          WHERE ScenarioID = @scenarioId
        `);
      
      for (const change of timelineChanges.recordset) {
        await transaction.request()
          .input('projectId', sql.Int, change.ProjectID)
          .input('startDate', sql.Date, change.NewStartDate)
          .input('endDate', sql.Date, change.NewEndDate)
          .query(`
            UPDATE Projects
            SET StartDate = @startDate,
                EndDate = @endDate,
                UpdatedAt = GETDATE()
            WHERE ProjectID = @projectId
          `);
      }
      
      // 2. Apply resource changes
      const resourceChanges = await transaction.request()
        .input('scenarioId', sql.Int, scenarioId)
        .query(`
          SELECT 
            ResourceID, ResourceName, ResourceRole, Skills,
            HourlyRate, BillableRate, ChangeType
          FROM ScenarioResourceChanges
          WHERE ScenarioID = @scenarioId
        `);
      
      for (const change of resourceChanges.recordset) {
        if (change.ChangeType === 'ADD' && !change.ResourceID) {
          // Add a new resource
          await transaction.request()
            .input('name', sql.NVarChar, change.ResourceName)
            .input('role', sql.NVarChar, change.ResourceRole)
            .input('hourlyRate', sql.Money, change.HourlyRate || null)
            .input('billableRate', sql.Money, change.BillableRate || null)
            .query(`
              INSERT INTO Resources (
                Name, Role, HourlyRate, BillableRate
              )
              VALUES (
                @name, @role, @hourlyRate, @billableRate
              )
            `);
          
          // Would need code to add skills if skills tracking is implemented
        } else if (change.ChangeType === 'MODIFY' && change.ResourceID) {
          // Modify existing resource
          await transaction.request()
            .input('resourceId', sql.Int, change.ResourceID)
            .input('hourlyRate', sql.Money, change.HourlyRate || null)
            .input('billableRate', sql.Money, change.BillableRate || null)
            .query(`
              UPDATE Resources
              SET HourlyRate = COALESCE(@hourlyRate, HourlyRate),
                  BillableRate = COALESCE(@billableRate, BillableRate),
                  UpdatedAt = GETDATE()
              WHERE ResourceID = @resourceId
            `);
          
          // Would need code to update skills if skills tracking is implemented
        }
        // We don't actually delete resources for 'REMOVE' operations in this implementation
      }
      
      // 3. Apply allocations to real allocations
      // First, get all allocations in the scenario
      const scenarioAllocations = await transaction.request()
        .input('scenarioId', sql.Int, scenarioId)
        .query(`
          SELECT 
            ResourceID, ProjectID, StartDate, EndDate,
            Utilization, Notes, BillableRate, HourlyRate, TotalHours
          FROM ScenarioAllocations
          WHERE ScenarioID = @scenarioId
        `);
      
      // Skip allocations for resources that are marked for removal
      const removedResourceIds = resourceChanges.recordset
        .filter(rc => rc.ChangeType === 'REMOVE')
        .map(rc => rc.ResourceID);
      
      for (const allocation of scenarioAllocations.recordset) {
        // Skip allocations for removed resources
        if (removedResourceIds.includes(allocation.ResourceID)) {
          continue;
        }
        
        // Check if a real allocation already exists
        const existingAllocation = await transaction.request()
          .input('resourceId', sql.Int, allocation.ResourceID)
          .input('projectId', sql.Int, allocation.ProjectID)
          .query(`
            SELECT AllocationID
            FROM Allocations
            WHERE ResourceID = @resourceId
            AND ProjectID = @projectId
          `);
        
        if (existingAllocation.recordset.length > 0) {
          // Update existing allocation
          await transaction.request()
            .input('allocationId', sql.Int, existingAllocation.recordset[0].AllocationID)
            .input('startDate', sql.Date, allocation.StartDate)
            .input('endDate', sql.Date, allocation.EndDate)
            .input('utilization', sql.Int, allocation.Utilization)
            .input('notes', sql.NVarChar, allocation.Notes || null)
            .input('billableRate', sql.Money, allocation.BillableRate || null)
            .input('hourlyRate', sql.Money, allocation.HourlyRate || null)
            .input('totalHours', sql.Int, allocation.TotalHours || null)
            .query(`
              UPDATE Allocations
              SET StartDate = @startDate,
                  EndDate = @endDate,
                  Utilization = @utilization,
                  Notes = @notes,
                  BillableRate = @billableRate,
                  HourlyRate = @hourlyRate,
                  TotalHours = @totalHours,
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
            .input('notes', sql.NVarChar, allocation.Notes || null)
            .input('billableRate', sql.Money, allocation.BillableRate || null)
            .input('hourlyRate', sql.Money, allocation.HourlyRate || null)
            .input('totalHours', sql.Int, allocation.TotalHours || null)
            .query(`
              INSERT INTO Allocations (
                ResourceID, ProjectID, StartDate, EndDate,
                Utilization, Notes, BillableRate, HourlyRate, TotalHours
              )
              VALUES (
                @resourceId, @projectId, @startDate, @endDate,
                @utilization, @notes, @billableRate, @hourlyRate, @totalHours
              )
            `);
        }
      }
      
      // Mark the scenario as promoted
      await transaction.request()
        .input('scenarioId', sql.Int, scenarioId)
        .query(`
          UPDATE CapacityScenarios
          SET IsActive = 0,
              UpdatedAt = GETDATE()
          WHERE ScenarioID = @scenarioId
        `);
      
      await transaction.commit();
      
      res.json({ message: 'Scenario promoted successfully' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error promoting scenario:', err);
    res.status(500).json({
      message: 'Error promoting scenario',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

module.exports = {
  createWhatIfScenario,
  getWhatIfScenarios,
  getWhatIfScenarioById,
  updateProjectTimeline,
  updateScenarioResource,
  calculateScenarioMetrics,
  compareScenarios,
  promoteScenario,
  // handleResourceAllocation is not exported as it's called internally by updateScenarioResource
};