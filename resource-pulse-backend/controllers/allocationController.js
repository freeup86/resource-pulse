const { poolPromise, sql } = require('../db/config');

// Create or update an allocation
const updateAllocation = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { projectId, startDate, endDate, utilization } = req.body;
    
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
    if (utilization < 1 || utilization > 100) {
      return res.status(400).json({ 
        message: 'Utilization must be between 1 and 100' 
      });
    }
    
    const pool = await poolPromise;
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Check if resource exists
      const resourceCheck = await transaction.request()
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT ResourceID FROM Resources WHERE ResourceID = @resourceId
        `);
      
      if (resourceCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Resource not found' });
      }
      
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
      
      // Check utilization constraint
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
      
      if (existingUtilization + utilization > 100) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `This allocation would exceed 100% utilization. Current utilization: ${existingUtilization}%` 
        });
      }
      
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
          .input('updatedAt', sql.DateTime2, new Date())
          .query(`
            UPDATE Allocations
            SET StartDate = @startDate,
                EndDate = @endDate,
                Utilization = @utilization,
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
          .query(`
            INSERT INTO Allocations (ResourceID, ProjectID, StartDate, EndDate, Utilization)
            VALUES (@resourceId, @projectId, @startDate, @endDate, @utilization)
          `);
      }
      
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
            a.Utilization
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
        utilization: allocation.Utilization
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
        SELECT ResourceID FROM Resources WHERE ResourceID = @resourceId
      `);
    
    if (resourceCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Get all allocations for this resource
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
          a.Utilization
        FROM Allocations a
        INNER JOIN Resources r ON a.ResourceID = r.ResourceID
        INNER JOIN Projects p ON a.ProjectID = p.ProjectID
        WHERE a.ResourceID = @resourceId
        AND a.EndDate >= GETDATE()
        ORDER BY a.StartDate
      `);
    
    const allocations = result.recordset.map(allocation => ({
      id: allocation.AllocationID,
      resource: {
        id: allocation.ResourceID,
        name: allocation.ResourceName
      },
      project: {
        id: allocation.ProjectID,
        name: allocation.ProjectName
      },
      startDate: allocation.StartDate,
      endDate: allocation.EndDate,
      utilization: allocation.Utilization
    }));
    
    res.json(allocations);
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
      
      // Validate allocation exists
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
      
      // Delete allocation
      const result = await transaction.request()
        .input('allocationId', sql.Int, allocationId)
        .query(`
          DELETE FROM Allocations
          WHERE AllocationID = @allocationId
        `);
      
      // Commit transaction
      await transaction.commit();
      
      // Fetch remaining allocations for the resource
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
            a.Utilization
          FROM Allocations a
          INNER JOIN Resources r ON a.ResourceID = r.ResourceID
          INNER JOIN Projects p ON a.ProjectID = p.ProjectID
          WHERE a.ResourceID = @resourceId
          AND a.EndDate >= GETDATE()
        `);
      
      const allocations = remainingAllocations.recordset.map(allocation => ({
        id: allocation.AllocationID,
        resourceId: allocation.ResourceID,
        projectId: allocation.ProjectID,
        projectName: allocation.ProjectName,
        startDate: allocation.StartDate,
        endDate: allocation.EndDate,
        utilization: allocation.Utilization
      }));
      
      res.json({ 
        message: 'Allocation removed successfully',
        deletedCount: result.rowsAffected[0],
        remainingAllocations: allocations
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

// Create or update an allocation
exports.updateAllocation = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { projectId, startDate, endDate, utilization, id } = req.body;
    
    // Handle removing allocation if projectId is null
    if (projectId === null && id) {
      return await removeAllocation(req, res, id);
    }
    
    // Validate required fields
    if (!resourceId || !projectId || !startDate || !endDate || !utilization) {
      return res.status(400).json({ 
        message: 'Resource ID, project ID, start date, end date, and utilization are required' 
      });
    }
    
    if (utilization < 1 || utilization > 100) {
      return res.status(400).json({ 
        message: 'Utilization must be between 1 and 100' 
      });
    }
    
    const pool = await poolPromise;
    
    // Check if resource exists
    const resourceCheck = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT ResourceID FROM Resources WHERE ResourceID = @resourceId
      `);
    
    if (resourceCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Check if project exists
    const projectCheck = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT ProjectID FROM Projects WHERE ProjectID = @projectId
      `);
    
    if (projectCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check total utilization for this time period
    // We need to make sure the total utilization doesn't exceed 100%
    // But we exclude the current allocation if we're updating one
    const utilizationCheck = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .input('startDate', sql.Date, new Date(startDate))
      .input('endDate', sql.Date, new Date(endDate))
      .input('allocationId', sql.Int, id || 0)
      .query(`
        SELECT SUM(Utilization) AS TotalUtilization
        FROM Allocations
        WHERE ResourceID = @resourceId
        AND AllocationID != @allocationId
        AND (
          (StartDate <= @endDate AND EndDate >= @startDate)
        )
      `);
    
    const existingUtilization = utilizationCheck.recordset[0].TotalUtilization || 0;
    
    if (existingUtilization + utilization > 100) {
      return res.status(400).json({ 
        message: `This allocation would exceed 100% utilization. Current utilization in this period: ${existingUtilization}%` 
      });
    }
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      let allocationId;
      
      if (id) {
        // Update existing allocation
        await transaction.request()
          .input('allocationId', sql.Int, id)
          .input('resourceId', sql.Int, resourceId)
          .input('projectId', sql.Int, projectId)
          .input('startDate', sql.Date, new Date(startDate))
          .input('endDate', sql.Date, new Date(endDate))
          .input('utilization', sql.Int, utilization)
          .input('updatedAt', sql.DateTime2, new Date())
          .query(`
            UPDATE Allocations
            SET ProjectID = @projectId,
                StartDate = @startDate,
                EndDate = @endDate,
                Utilization = @utilization,
                UpdatedAt = @updatedAt
            WHERE AllocationID = @allocationId
            AND ResourceID = @resourceId
          `);
          
        allocationId = id;
      } else {
        // Create new allocation
        const result = await transaction.request()
          .input('resourceId', sql.Int, resourceId)
          .input('projectId', sql.Int, projectId)
          .input('startDate', sql.Date, new Date(startDate))
          .input('endDate', sql.Date, new Date(endDate))
          .input('utilization', sql.Int, utilization)
          .query(`
            INSERT INTO Allocations (ResourceID, ProjectID, StartDate, EndDate, Utilization)
            OUTPUT INSERTED.AllocationID
            VALUES (@resourceId, @projectId, @startDate, @endDate, @utilization)
          `);
          
        allocationId = result.recordset[0].AllocationID;
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Get the updated allocation
      const allocationResult = await pool.request()
        .input('allocationId', sql.Int, allocationId)
        .query(`
          SELECT 
            a.AllocationID as id,
            a.ResourceID as resourceId,
            a.ProjectID as projectId,
            p.Name as projectName,
            a.StartDate as startDate,
            a.EndDate as endDate,
            a.Utilization as utilization
          FROM Allocations a
          INNER JOIN Projects p ON a.ProjectID = p.ProjectID
          WHERE a.AllocationID = @allocationId
        `);
      
      if (allocationResult.recordset.length === 0) {
        return res.status(404).json({ message: 'Allocation not found after update' });
      }
      
      // Format the response for the client
      const allocation = allocationResult.recordset[0];
      
      // Add project object for compatibility with frontend
      allocation.project = {
        id: allocation.projectId,
        name: allocation.projectName
      };
      
      res.json(allocation);
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error updating allocation:', err);
    res.status(500).json({
      message: 'Error updating allocation',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Get all allocations for a resource
exports.getResourceAllocations = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const pool = await poolPromise;
    
    // Check if resource exists
    const resourceCheck = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT ResourceID FROM Resources WHERE ResourceID = @resourceId
      `);
    
    if (resourceCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Get all allocations for this resource
    const result = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT 
          a.AllocationID as id,
          a.ResourceID as resourceId,
          a.ProjectID as projectId,
          p.Name as projectName,
          a.StartDate as startDate,
          a.EndDate as endDate,
          a.Utilization as utilization
        FROM Allocations a
        INNER JOIN Projects p ON a.ProjectID = p.ProjectID
        WHERE a.ResourceID = @resourceId
        AND a.EndDate >= GETDATE()
        ORDER BY a.StartDate
      `);
    
    // Format the response
    const allocations = result.recordset.map(allocation => ({
      ...allocation,
      project: {
        id: allocation.projectId,
        name: allocation.projectName
      }
    }));
    
    res.json(allocations);
  } catch (err) {
    console.error('Error getting resource allocations:', err);
    res.status(500).json({
      message: 'Error retrieving resource allocations',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

exports.getResourcesEndingSoon = async (req, res) => {
  try {
    const pool = await poolPromise;
    const daysThreshold = req.query.days ? parseInt(req.query.days) : 14;
    
    // Calculate the date threshold
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    // Get resources and their ending allocations
    const result = await pool.request()
      .input('today', sql.Date, today)
      .input('thresholdDate', sql.Date, thresholdDate)
      .query(`
        SELECT 
          r.ResourceID, 
          r.Name, 
          r.Role,
          a.AllocationID,
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
    
    // Group by resource
    const resourceMap = {};
    
    for (const row of result.recordset) {
      const resourceId = row.ResourceID;
      
      if (!resourceMap[resourceId]) {
        // Get skills for this resource
        const skillsResult = await pool.request()
          .input('resourceId', sql.Int, resourceId)
          .query(`
            SELECT s.Name
            FROM Skills s
            INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
            WHERE rs.ResourceID = @resourceId
          `);
        
        resourceMap[resourceId] = {
          id: resourceId,
          name: row.Name,
          role: row.Role,
          skills: skillsResult.recordset.map(skill => skill.Name),
          allocations: []
        };
      }
      
      // Add this allocation
      resourceMap[resourceId].allocations.push({
        id: row.AllocationID,
        projectId: row.ProjectID,
        project: {
          id: row.ProjectID,
          name: row.ProjectName
        },
        startDate: row.StartDate,
        endDate: row.EndDate,
        utilization: row.Utilization,
        daysLeft: row.DaysLeft
      });
    }
    
    // Convert to array and sort by earliest ending allocation
    const resources = Object.values(resourceMap).map(resource => {
      // Sort allocations by end date
      resource.allocations.sort((a, b) => a.daysLeft - b.daysLeft);
      
      // For backwards compatibility
      if (resource.allocations.length > 0) {
        resource.allocation = resource.allocations[0];
      } else {
        resource.allocation = null;
      }
      
      return resource;
    });
    
    res.json(resources);
  } catch (err) {
    console.error('Error getting resources ending soon:', err);
    res.status(500).json({
      message: 'Error retrieving resources ending soon',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Get resource-project matches based on skills
exports.getResourceMatches = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { projectId } = req.query;
    
    // If projectId is provided, get matches for specific project
    if (projectId) {
      const matches = await getMatchesForProject(pool, parseInt(projectId));
      return res.json(matches);
    }
    
    // Otherwise, get matches for all active projects
    const projectsResult = await pool.request()
      .query(`
        SELECT ProjectID
        FROM Projects
        WHERE Status = 'Active'
      `);
    
    const allMatches = [];
    
    for (const project of projectsResult.recordset) {
      const matches = await getMatchesForProject(pool, project.ProjectID);
      if (matches.resources.length > 0) {
        allMatches.push(matches);
      }
    }
    
    res.json(allMatches);
  } catch (err) {
    console.error('Error getting resource matches:', err);
    res.status(500).json({
      message: 'Error retrieving resource matches',
      error: process.env.NODE_ENV === 'production' ? {} : err
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
  
  // Find resources with matching skills OR matching roles
  const matchingResourcesResult = await pool.request()
    .input('projectId', sql.Int, projectId)
    .input('thresholdDate', sql.Date, new Date(new Date().setDate(new Date().getDate() + 14)))
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
          WHEN ru.TotalUtilization IS NULL OR ru.TotalUtilization < 100 THEN 'available'
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
        ru.TotalUtilization < 100 OR
        EXISTS (
          SELECT 1 FROM Allocations a 
          WHERE a.ResourceID = r.ResourceID 
          AND a.EndDate <= @thresholdDate 
          AND a.EndDate >= GETDATE()
        )
      ORDER BY
        CASE 
          WHEN ru.TotalUtilization IS NULL THEN 0
          WHEN ru.TotalUtilization < 100 THEN ru.TotalUtilization
          ELSE 100
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

// Export all methods
module.exports = {
  updateAllocation: require('./allocationController').updateAllocation,
  getResourceAllocations: require('./allocationController').getResourceAllocations,
  getResourcesEndingSoon: require('./allocationController').getResourcesEndingSoon,
  getResourceMatches: require('./allocationController').getResourceMatches,
  removeAllocation
};