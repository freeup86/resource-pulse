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

  // Diagnostic query to check matching logic
  const matchingResourcesResult = await pool.request()
    .input('projectId', sql.Int, projectId)
    .input('thresholdDate', sql.Date, new Date(new Date().setDate(new Date().getDate() + 14)))
    .query(`
      SELECT 
        r.ResourceID,
        r.Name,
        r.Role,
        s.Name AS MatchedSkill,
        CASE 
          WHEN a.ResourceID IS NULL THEN 'available'
          ELSE 'ending-soon'
        END AS AvailabilityStatus,
        a.EndDate,
        DATEDIFF(day, GETDATE(), a.EndDate) AS DaysLeft
      FROM Resources r
      LEFT JOIN Allocations a ON r.ResourceID = a.ResourceID AND a.EndDate >= GETDATE()
      INNER JOIN ResourceSkills rs ON r.ResourceID = rs.ResourceID
      INNER JOIN Skills s ON rs.SkillID = s.SkillID
      INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
      WHERE ps.ProjectID = @projectId
      AND (a.ResourceID IS NULL OR a.EndDate <= @thresholdDate)
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
   const { resourceId } = req.params;
   const { projectId } = req.body;
   
   // Validate required fields
   if (!resourceId) {
     return res.status(400).json({ message: 'Resource ID is required' });
   }
   
   if (!projectId) {
     return res.status(400).json({ message: 'Project ID is required' });
   }
   
   const pool = await poolPromise;
   
   // Start a transaction
   const transaction = new sql.Transaction(pool);
   await transaction.begin();
   
   try {
     // Delete allocation
     const result = await transaction.request()
       .input('resourceId', sql.Int, resourceId)
       .input('projectId', sql.Int, projectId)
       .query(`
         DELETE FROM Allocations
         WHERE ResourceID = @resourceId
         AND ProjectID = @projectId
         AND EndDate >= GETDATE()
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

// Export all methods
module.exports = {
 updateAllocation,
 getResourceAllocations,
 getResourcesEndingSoon,
 getResourceMatches,
 removeAllocation
};