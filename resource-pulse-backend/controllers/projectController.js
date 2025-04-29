const { poolPromise, sql } = require('../db/config');

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Query projects
    const result = await pool.request()
      .query(`
        SELECT 
          p.ProjectID, 
          p.Name, 
          p.Client, 
          p.Description,
          p.StartDate, 
          p.EndDate, 
          p.Status
        FROM Projects p
        ORDER BY p.Name
      `);
    
    // For each project, get required skills
    const projects = await Promise.all(result.recordset.map(async project => {
      // Get skills
      const skillsResult = await pool.request()
        .input('projectId', sql.Int, project.ProjectID)
        .query(`
          SELECT s.SkillID, s.Name
          FROM Skills s
          INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
          WHERE ps.ProjectID = @projectId
        `);
      
      // Format the response
      return {
        id: project.ProjectID,
        name: project.Name,
        client: project.Client,
        description: project.Description,
        startDate: project.StartDate,
        endDate: project.EndDate,
        status: project.Status,
        requiredSkills: skillsResult.recordset.map(skill => skill.Name)
      };
    }));
    
    res.json(projects);
  } catch (err) {
    console.error('Error getting projects:', err);
    res.status(500).json({
      message: 'Error retrieving projects',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Get a single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    
    // Get required roles
    const rolesResult = await pool.request()
    .input('projectId', sql.Int, id)
    .query(`
      SELECT 
        pr.ProjectRoleID,
        pr.RoleID,
        r.Name as RoleName,
        pr.Count
      FROM ProjectRoles pr
      INNER JOIN Roles r ON pr.RoleID = r.RoleID
      WHERE pr.ProjectID = @projectId
    `);

    // Query project
    const result = await pool.request()
      .input('projectId', sql.Int, id)
      .query(`
        SELECT 
          p.ProjectID, 
          p.Name, 
          p.Client, 
          p.Description,
          p.StartDate, 
          p.EndDate, 
          p.Status
        FROM Projects p
        WHERE p.ProjectID = @projectId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const project = result.recordset[0];
    
    // Get skills
    const skillsResult = await pool.request()
      .input('projectId', sql.Int, project.ProjectID)
      .query(`
        SELECT s.SkillID, s.Name
        FROM Skills s
        INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
        WHERE ps.ProjectID = @projectId
      `);
    
    // Get allocated resources
    const resourcesResult = await pool.request()
      .input('projectId', sql.Int, project.ProjectID)
      .query(`
        SELECT 
          r.ResourceID,
          r.Name,
          r.Role,
          a.StartDate,
          a.EndDate,
          a.Utilization
        FROM Resources r
        INNER JOIN Allocations a ON r.ResourceID = a.ResourceID
        WHERE a.ProjectID = @projectId
        AND a.EndDate >= GETDATE()
        ORDER BY a.EndDate ASC
      `);
    
    // Format the response
    const formattedProject = {
      id: project.ProjectID,
      name: project.Name,
      client: project.Client,
      description: project.Description,
      startDate: project.StartDate,
      endDate: project.EndDate,
      status: project.Status,
      requiredSkills: skillsResult.recordset.map(skill => skill.Name),
      requiredRoles: rolesResult.recordset.map(role => ({
        id: role.RoleID,
        name: role.RoleName,
        count: role.Count
      })),
      allocatedResources: resourcesResult.recordset.map(resource => ({
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        startDate: resource.StartDate,
        endDate: resource.EndDate,
        utilization: resource.Utilization
      }))
    };
    
    res.json(formattedProject);
  } catch (err) {
    console.error('Error getting project:', err);
    res.status(500).json({
      message: 'Error retrieving project',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { 
      name, 
      client, 
      description, 
      startDate, 
      endDate, 
      status,
      requiredSkills,
      requiredRoles 
    } = req.body;
    
    // Validate required fields
    if (!name || !client) {
      return res.status(400).json({ message: 'Name and client are required' });
    }
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Insert project
      const projectResult = await transaction.request()
        .input('name', sql.NVarChar, name)
        .input('client', sql.NVarChar, client)
        .input('description', sql.NVarChar, description || null)
        .input('startDate', sql.Date, startDate ? new Date(startDate) : null)
        .input('endDate', sql.Date, endDate ? new Date(endDate) : null)
        .input('status', sql.NVarChar, status || 'Active')
        .query(`
          INSERT INTO Projects (Name, Client, Description, StartDate, EndDate, Status)
          OUTPUT INSERTED.ProjectID
          VALUES (@name, @client, @description, @startDate, @endDate, @status)
        `);
      
      const projectId = projectResult.recordset[0].ProjectID;
      
      // Process required skills if provided
      if (requiredSkills && requiredSkills.length > 0) {
        // Your existing skill processing code
        for (const skillName of requiredSkills) {
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
          
          // Link skill to project
          await transaction.request()
            .input('projectId', sql.Int, projectId)
            .input('skillId', sql.Int, skillId)
            .query(`
              INSERT INTO ProjectSkills (ProjectID, SkillID)
              VALUES (@projectId, @skillId)
            `);
        }
      }
      
      // Process required roles if provided
      if (requiredRoles && requiredRoles.length > 0) {
        for (const roleReq of requiredRoles) {
          // Validate role exists
          const roleResult = await transaction.request()
            .input('roleId', sql.Int, roleReq.roleId)
            .query(`
              SELECT RoleID FROM Roles WHERE RoleID = @roleId
            `);
          
          if (roleResult.recordset.length === 0) {
            // Role doesn't exist, skip it
            continue;
          }
          
          // Add role requirement to project
          await transaction.request()
            .input('projectId', sql.Int, projectId)
            .input('roleId', sql.Int, roleReq.roleId)
            .input('count', sql.Int, roleReq.count || 1)
            .query(`
              INSERT INTO ProjectRoles (ProjectID, RoleID, Count)
              VALUES (@projectId, @roleId, @count)
            `);
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Return the created project (include required roles)
      const result = await pool.request()
        .input('projectId', sql.Int, projectId)
        .query(`
          SELECT 
            p.ProjectID, 
            p.Name, 
            p.Client, 
            p.Description,
            p.StartDate, 
            p.EndDate, 
            p.Status
          FROM Projects p
          WHERE p.ProjectID = @projectId
        `);
      
      // Get skills
      const skillsResult = await pool.request()
        .input('projectId', sql.Int, projectId)
        .query(`
          SELECT s.SkillID, s.Name
          FROM Skills s
          INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
          WHERE ps.ProjectID = @projectId
        `);
      
      // Get required roles
      const rolesResult = await pool.request()
        .input('projectId', sql.Int, projectId)
        .query(`
          SELECT 
            pr.ProjectRoleID,
            pr.RoleID,
            r.Name as RoleName,
            pr.Count
          FROM ProjectRoles pr
          INNER JOIN Roles r ON pr.RoleID = r.RoleID
          WHERE pr.ProjectID = @projectId
        `);
      
      // Format the response
      const project = result.recordset[0];
      const formattedProject = {
        id: project.ProjectID,
        name: project.Name,
        client: project.Client,
        description: project.Description,
        startDate: project.StartDate,
        endDate: project.EndDate,
        status: project.Status,
        requiredSkills: skillsResult.recordset.map(skill => skill.Name),
        requiredRoles: rolesResult.recordset.map(role => ({
          id: role.RoleID,
          name: role.RoleName,
          count: role.Count
        })),
        allocatedResources: []
      };
      
      res.status(201).json(formattedProject);
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({
      message: 'Error creating project',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

    // Update a project
exports.updateProject = async (req, res) => {
    try {
    const pool = await poolPromise;
    const { id } = req.params;
    const { 
        name, 
        client, 
        description, 
        startDate, 
        endDate, 
        status,
        requiredSkills 
    } = req.body;
    
    // Validate required fields
    if (!name || !client) {
        return res.status(400).json({ message: 'Name and client are required' });
    }
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
        // Check if project exists
        const checkProject = await transaction.request()
        .input('projectId', sql.Int, id)
        .query(`
            SELECT ProjectID FROM Projects WHERE ProjectID = @projectId
        `);
        
        if (checkProject.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Project not found' });
        }
        
        // Update project
        await transaction.request()
        .input('projectId', sql.Int, id)
        .input('name', sql.NVarChar, name)
        .input('client', sql.NVarChar, client)
        .input('description', sql.NVarChar, description || null)
        .input('startDate', sql.Date, startDate ? new Date(startDate) : null)
        .input('endDate', sql.Date, endDate ? new Date(endDate) : null)
        .input('status', sql.NVarChar, status || 'Active')
        .input('updatedAt', sql.DateTime2, new Date())
        .query(`
            UPDATE Projects
            SET Name = @name,
                Client = @client,
                Description = @description,
                StartDate = @startDate,
                EndDate = @endDate,
                Status = @status,
                UpdatedAt = @updatedAt
            WHERE ProjectID = @projectId
        `);
        
        // Process required skills if provided
        if (requiredSkills !== undefined) {
        // Remove all existing skills
        await transaction.request()
            .input('projectId', sql.Int, id)
            .query(`
            DELETE FROM ProjectSkills
            WHERE ProjectID = @projectId
            `);
        
        // Add new skills
        if (requiredSkills && requiredSkills.length > 0) {
            for (const skillName of requiredSkills) {
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
            
            // Link skill to project
            await transaction.request()
                .input('projectId', sql.Int, id)
                .input('skillId', sql.Int, skillId)
                .query(`
                INSERT INTO ProjectSkills (ProjectID, SkillID)
                VALUES (@projectId, @skillId)
                `);
            }
        }
        }
        
        // Commit transaction
        await transaction.commit();
        
        // Return the updated project
        const result = await pool.request()
        .input('projectId', sql.Int, id)
        .query(`
            SELECT 
            p.ProjectID, 
            p.Name, 
            p.Client, 
            p.Description,
            p.StartDate, 
            p.EndDate, 
            p.Status
            FROM Projects p
            WHERE p.ProjectID = @projectId
        `);
        
        // Get skills
        const skillsResult = await pool.request()
        .input('projectId', sql.Int, id)
        .query(`
            SELECT s.SkillID, s.Name
            FROM Skills s
            INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
            WHERE ps.ProjectID = @projectId
        `);
        
        // Get allocated resources
        const resourcesResult = await pool.request()
        .input('projectId', sql.Int, id)
        .query(`
            SELECT 
            r.ResourceID,
            r.Name,
            r.Role,
            a.StartDate,
            a.EndDate,
            a.Utilization
            FROM Resources r
            INNER JOIN Allocations a ON r.ResourceID = a.ResourceID
            WHERE a.ProjectID = @projectId
            AND a.EndDate >= GETDATE()
            ORDER BY a.EndDate ASC
        `);
        
        // Format the response
        const project = result.recordset[0];
        const formattedProject = {
        id: project.ProjectID,
        name: project.Name,
        client: project.Client,
        description: project.Description,
        startDate: project.StartDate,
        endDate: project.EndDate,
        status: project.Status,
        requiredSkills: skillsResult.recordset.map(skill => skill.Name),
        allocatedResources: resourcesResult.recordset.map(resource => ({
            id: resource.ResourceID,
            name: resource.Name,
            role: resource.Role,
            startDate: resource.StartDate,
            endDate: resource.EndDate,
            utilization: resource.Utilization
        }))
        };
        
        res.json(formattedProject);
    } catch (err) {
        // Rollback transaction on error
        await transaction.rollback();
        throw err;
    }
    } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({
        message: 'Error updating project',
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
    }
};

    // Delete a project
  exports.deleteProject = async (req, res) => {
    try {
    const pool = await poolPromise;
    const { id } = req.params;
    
    // Check if project exists
    const checkProject = await pool.request()
        .input('projectId', sql.Int, id)
        .query(`
        SELECT ProjectID FROM Projects WHERE ProjectID = @projectId
        `);
    
    if (checkProject.recordset.length === 0) {
        return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if project has allocations
    const checkAllocations = await pool.request()
        .input('projectId', sql.Int, id)
        .query(`
        SELECT COUNT(*) AS AllocationCount 
        FROM Allocations 
        WHERE ProjectID = @projectId
        `);
    
    if (checkAllocations.recordset[0].AllocationCount > 0) {
        return res.status(400).json({ 
        message: 'Cannot delete project with active allocations. Remove allocations first.' 
        });
    }
    
    // Delete project (cascade will handle related records)
    await pool.request()
        .input('projectId', sql.Int, id)
        .query(`
        DELETE FROM Projects
        WHERE ProjectID = @projectId
        `);
    
    res.json({ message: 'Project deleted successfully' });
    } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({
        message: 'Error deleting project',
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
    }
};