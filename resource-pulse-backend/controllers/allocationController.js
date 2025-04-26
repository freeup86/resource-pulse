const { poolPromise, sql } = require('../db/config');

// Create or update an allocation
exports.updateAllocation = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { projectId, startDate, endDate, utilization } = req.body;
    
    // Handle removing allocation if projectId is null
    if (projectId === null) {
      return await removeAllocation(req, res);
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
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Check for existing allocation
      const existingAllocation = await transaction.request()
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT AllocationID
          FROM Allocations
          WHERE ResourceID = @resourceId
          AND EndDate >= GETDATE()
        `);
      
      if (existingAllocation.recordset.length > 0) {
        // Update existing allocation
        await transaction.request()
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
            WHERE ResourceID = @resourceId
            AND EndDate >= GETDATE()
          `);
      } else {
        // Create new allocation
        await transaction.request()
          .input('resourceId', sql.Int, resourceId)
          .input('projectId', sql.Int, projectId)
          .input('startDate', sql.Date, new Date(startDate))
          .input('endDate', sql.Date, new Date(endDate))
          .input('utilization', sql.Int, utilization)
          .query(`
            INSERT INTO Allocations (ResourceID, ProjectID, StartDate, EndDate, Utilization)
            VALUES (@resourceId, @projectId, @startDate, @endDate, @utilization)
          `);
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Get updated allocation
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
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Allocation not found after update' });
      }
      
      const allocation = result.recordset[0];
      const formattedAllocation = {
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
      };
      
      res.json(formattedAllocation);
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

// Remove an allocation
const removeAllocation = async (req, res) => {
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
    
    // Delete allocation
    await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        DELETE FROM Allocations
        WHERE ResourceID = @resourceId
        AND EndDate >= GETDATE()
      `);
    
    res.json({ message: 'Allocation removed successfully' });
  } catch (err) {
    console.error('Error removing allocation:', err);
    res.status(500).json({
      message: 'Error removing allocation',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Get resources ending soon
exports.getResourcesEndingSoon = async (req, res) => {
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
    
    // Otherwise, get matches for all projects
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
  const requiredSkillIds = skillsResult.recordset.map(skill => skill.SkillID);
  
  // Find resources with matching skills
  // Include resources that are:
  // 1. Either unallocated OR have allocations ending within 14 days
  // 2. Have at least one matching skill
  const matchingResourcesResult = await pool.request()
    .input('projectId', sql.Int, projectId)
    .input('thresholdDate', sql.Date, new Date(new Date().setDate(new Date().getDate() + 14)))
    .query(`
      SELECT DISTINCT
        r.ResourceID,
        r.Name,
        r.Role,
        CASE 
          WHEN a.ResourceID IS NULL THEN 'available'
          ELSE 'ending-soon'
        END AS AvailabilityStatus,
        a.EndDate,
        DATEDIFF(day, GETDATE(), a.EndDate) AS DaysLeft
      FROM Resources r
      LEFT JOIN Allocations a ON r.ResourceID = a.ResourceID AND a.EndDate >= GETDATE()
      INNER JOIN ResourceSkills rs ON r.ResourceID = rs.ResourceID
      INNER JOIN ProjectSkills ps ON rs.SkillID = ps.SkillID
      WHERE ps.ProjectID = @projectId
      AND (a.ResourceID IS NULL OR a.EndDate <= @thresholdDate)
      ORDER BY
        CASE 
          WHEN a.ResourceID IS NULL THEN 0
          ELSE 1
        END,
        a.EndDate
    `);
  
  // For each matching resource, calculate match score and get matching skills
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
      const resourceSkillIds = resourceSkillsResult.recordset.map(skill => skill.SkillID);
      
      // Calculate matching skills
      const matchingSkills = resourceSkills.filter(skill => requiredSkills.includes(skill));
      
      // Calculate match score
      const matchScore = (matchingSkills.length / requiredSkills.length) * 100;
      
      return {
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        skills: resourceSkills,
        matchingSkills: matchingSkills,
        matchScore: matchScore,
        availabilityStatus: resource.AvailabilityStatus,
        endDate: resource.EndDate,
        daysLeft: resource.DaysLeft
      };
    })
  );
  
  // Sort by match score (descending)
  matchingResources.sort((a, b) => b.matchScore - a.matchScore);
  
  return {
    project: {
      id: project.ProjectID,
      name: project.Name,
      client: project.Client,
      requiredSkills: requiredSkills
    },
    resources: matchingResources
  };
};