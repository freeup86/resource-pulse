const { poolPromise, sql } = require('../db/config');

// Get all resources
exports.getAllResources = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Query resources
    const result = await pool.request()
      .query(`
        SELECT 
          r.ResourceID, 
          r.Name, 
          r.Role, 
          r.Email, 
          r.Phone
        FROM Resources r
        ORDER BY r.Name
      `);
    
    // For each resource, get their skills
    const resources = await Promise.all(result.recordset.map(async resource => {
      // Get skills
      const skillsResult = await pool.request()
        .input('resourceId', sql.Int, resource.ResourceID)
        .query(`
          SELECT s.SkillID, s.Name
          FROM Skills s
          INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
          WHERE rs.ResourceID = @resourceId
        `);
      
      // Get allocation
      const allocationResult = await pool.request()
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
      
      // Format the response
      return {
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        email: resource.Email,
        phone: resource.Phone,
        skills: skillsResult.recordset.map(skill => skill.Name),
        allocation: allocationResult.recordset.length > 0 ? {
          projectId: allocationResult.recordset[0].ProjectID,
          projectName: allocationResult.recordset[0].ProjectName,
          startDate: allocationResult.recordset[0].StartDate,
          endDate: allocationResult.recordset[0].EndDate,
          utilization: allocationResult.recordset[0].Utilization
        } : null
      };
    }));
    
    res.json(resources);
  } catch (err) {
    console.error('Error getting resources:', err);
    res.status(500).json({
      message: 'Error retrieving resources',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Get a single resource by ID
exports.getResourceById = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    
    // Query resource
    const result = await pool.request()
      .input('resourceId', sql.Int, id)
      .query(`
        SELECT 
          r.ResourceID, 
          r.Name, 
          r.Role, 
          r.Email, 
          r.Phone
        FROM Resources r
        WHERE r.ResourceID = @resourceId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    const resource = result.recordset[0];
    
    // Get skills
    const skillsResult = await pool.request()
      .input('resourceId', sql.Int, resource.ResourceID)
      .query(`
        SELECT s.SkillID, s.Name
        FROM Skills s
        INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
        WHERE rs.ResourceID = @resourceId
      `);
    
    // Get allocation
    const allocationResult = await pool.request()
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
    
    // Format the response
    const formattedResource = {
      id: resource.ResourceID,
      name: resource.Name,
      role: resource.Role,
      email: resource.Email,
      phone: resource.Phone,
      skills: skillsResult.recordset.map(skill => skill.Name),
      allocation: allocationResult.recordset.length > 0 ? {
        projectId: allocationResult.recordset[0].ProjectID,
        projectName: allocationResult.recordset[0].ProjectName,
        startDate: allocationResult.recordset[0].StartDate,
        endDate: allocationResult.recordset[0].EndDate,
        utilization: allocationResult.recordset[0].Utilization
      } : null
    };
    
    res.json(formattedResource);
  } catch (err) {
    console.error('Error getting resource:', err);
    res.status(500).json({
      message: 'Error retrieving resource',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Create a new resource
exports.createResource = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { name, role, email, phone, skills } = req.body;
    
    // Validate required fields
    if (!name || !role) {
      return res.status(400).json({ message: 'Name and role are required' });
    }
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Insert resource
      const resourceResult = await transaction.request()
        .input('name', sql.NVarChar, name)
        .input('role', sql.NVarChar, role)
        .input('email', sql.NVarChar, email || null)
        .input('phone', sql.NVarChar, phone || null)
        .query(`
          INSERT INTO Resources (Name, Role, Email, Phone)
          OUTPUT INSERTED.ResourceID
          VALUES (@name, @role, @email, @phone)
        `);
      
      const resourceId = resourceResult.recordset[0].ResourceID;
      
      // Process skills
      if (skills && skills.length > 0) {
        for (const skillName of skills) {
          // Check if skill exists
          const skillResult = await transaction.request()
            .input('skillName', sql.NVarChar, skillName)
            .query(`
              SELECT SkillID FROM Skills WHERE Name = @skillName
            `);
          
          let skillId;
          
          if (skillResult.recordset.length === 0) {
            // Create new skill
            const newSkillResult = await transaction.request()
              .input('skillName', sql.NVarChar, skillName)
              .query(`
                INSERT INTO Skills (Name)
                OUTPUT INSERTED.SkillID
                VALUES (@skillName)
              `);
            
            skillId = newSkillResult.recordset[0].SkillID;
          } else {
            skillId = skillResult.recordset[0].SkillID;
          }
          
          // Link skill to resource
          await transaction.request()
            .input('resourceId', sql.Int, resourceId)
            .input('skillId', sql.Int, skillId)
            .query(`
              INSERT INTO ResourceSkills (ResourceID, SkillID)
              VALUES (@resourceId, @skillId)
            `);
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Return the created resource
      const result = await pool.request()
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT 
            r.ResourceID, 
            r.Name, 
            r.Role, 
            r.Email, 
            r.Phone
          FROM Resources r
          WHERE r.ResourceID = @resourceId
        `);
      
      // Get skills
      const skillsResult = await pool.request()
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT s.SkillID, s.Name
          FROM Skills s
          INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
          WHERE rs.ResourceID = @resourceId
        `);
      
      // Format the response
      const resource = result.recordset[0];
      const formattedResource = {
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        email: resource.Email,
        phone: resource.Phone,
        skills: skillsResult.recordset.map(skill => skill.Name),
        allocation: null
      };
      
      res.status(201).json(formattedResource);
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error creating resource:', err);
    res.status(500).json({
      message: 'Error creating resource',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Update a resource
exports.updateResource = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    const { name, role, email, phone, skills } = req.body;
    
    // Validate required fields
    if (!name || !role) {
      return res.status(400).json({ message: 'Name and role are required' });
    }
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Check if resource exists
      const checkResource = await transaction.request()
        .input('resourceId', sql.Int, id)
        .query(`
          SELECT ResourceID FROM Resources WHERE ResourceID = @resourceId
        `);
      
      if (checkResource.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      // Update resource
      await transaction.request()
        .input('resourceId', sql.Int, id)
        .input('name', sql.NVarChar, name)
        .input('role', sql.NVarChar, role)
        .input('email', sql.NVarChar, email || null)
        .input('phone', sql.NVarChar, phone || null)
        .input('updatedAt', sql.DateTime2, new Date())
        .query(`
          UPDATE Resources
          SET Name = @name,
              Role = @role,
              Email = @email,
              Phone = @phone,
              UpdatedAt = @updatedAt
          WHERE ResourceID = @resourceId
        `);
      
      // Process skills if provided
      if (skills !== undefined) {
        // Remove all existing skills
        await transaction.request()
          .input('resourceId', sql.Int, id)
          .query(`
            DELETE FROM ResourceSkills
            WHERE ResourceID = @resourceId
          `);
        
        // Add new skills
        if (skills && skills.length > 0) {
          for (const skillName of skills) {
            // Check if skill exists
            const skillResult = await transaction.request()
              .input('skillName', sql.NVarChar, skillName)
              .query(`
                SELECT SkillID FROM Skills WHERE Name = @skillName
              `);
            
            let skillId;
            
            if (skillResult.recordset.length === 0) {
              // Create new skill
              const newSkillResult = await transaction.request()
                .input('skillName', sql.NVarChar, skillName)
                .query(`
                  INSERT INTO Skills (Name)
                  OUTPUT INSERTED.SkillID
                  VALUES (@skillName)
                `);
              
              skillId = newSkillResult.recordset[0].SkillID;
            } else {
              skillId = skillResult.recordset[0].SkillID;
            }
            
            // Link skill to resource
            await transaction.request()
              .input('resourceId', sql.Int, id)
              .input('skillId', sql.Int, skillId)
              .query(`
                INSERT INTO ResourceSkills (ResourceID, SkillID)
                VALUES (@resourceId, @skillId)
              `);
          }
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Return the updated resource
      const result = await pool.request()
        .input('resourceId', sql.Int, id)
        .query(`
          SELECT 
            r.ResourceID, 
            r.Name, 
            r.Role, 
            r.Email, 
            r.Phone
          FROM Resources r
          WHERE r.ResourceID = @resourceId
        `);
      
      // Get skills
      const skillsResult = await pool.request()
        .input('resourceId', sql.Int, id)
        .query(`
          SELECT s.SkillID, s.Name
          FROM Skills s
          INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
          WHERE rs.ResourceID = @resourceId
        `);
      
      // Get allocation
      const allocationResult = await pool.request()
        .input('resourceId', sql.Int, id)
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
      
      // Format the response
      const resource = result.recordset[0];
      const formattedResource = {
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        email: resource.Email,
        phone: resource.Phone,
        skills: skillsResult.recordset.map(skill => skill.Name),
        allocation: allocationResult.recordset.length > 0 ? {
          projectId: allocationResult.recordset[0].ProjectID,
          projectName: allocationResult.recordset[0].ProjectName,
          startDate: allocationResult.recordset[0].StartDate,
          endDate: allocationResult.recordset[0].EndDate,
          utilization: allocationResult.recordset[0].Utilization
        } : null
      };
      
      res.json(formattedResource);
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error updating resource:', err);
    res.status(500).json({
      message: 'Error updating resource',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Delete a resource
exports.deleteResource = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    
    // Check if resource exists
    const checkResource = await pool.request()
      .input('resourceId', sql.Int, id)
      .query(`
        SELECT ResourceID FROM Resources WHERE ResourceID = @resourceId
      `);
    
    if (checkResource.recordset.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Delete resource (cascade will handle related records)
    await pool.request()
      .input('resourceId', sql.Int, id)
      .query(`
        DELETE FROM Resources
        WHERE ResourceID = @resourceId
      `);
    
    res.json({ message: 'Resource deleted successfully' });
  } catch (err) {
    console.error('Error deleting resource:', err);
    res.status(500).json({
      message: 'Error deleting resource',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};