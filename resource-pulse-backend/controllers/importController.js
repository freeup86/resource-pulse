const { poolPromise, sql } = require('../db/config');
const { getSkillId } = require('./skillsController');
const { getRoleByName } = require('./roleController');

// Import resources from Excel
exports.importResources = async (req, res) => {
  try {
    const { resources } = req.body;
    
    if (!Array.isArray(resources) || resources.length === 0) {
      return res.status(400).json({ message: 'Valid resources array is required' });
    }
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    const results = {
      total: resources.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    try {
      for (const item of resources) {
        try {
          // Validate required fields
          if (!item.name) {
            throw new Error('Resource name is required');
          }
          
          // Get or create roleId
          let roleId = item.roleId;
          if (!roleId && item.role) {
            const roleInfo = await getRoleByName(transaction, item.role);
            roleId = roleInfo ? roleInfo.id : null;
            
            // If role doesn't exist, create a new one
            if (!roleId) {
              const roleResult = await transaction.request()
                .input('name', sql.NVarChar, item.role)
                .query(`
                  INSERT INTO Roles (Name)
                  OUTPUT INSERTED.RoleID
                  VALUES (@name)
                `);
              
              roleId = roleResult.recordset[0].RoleID;
            }
          }
          
          if (!roleId) {
            throw new Error('Role is required');
          }
          
          // Get role name for the Role column (for backward compatibility)
          const roleResult = await transaction.request()
            .input('roleId', sql.Int, roleId)
            .query(`
              SELECT Name
              FROM Roles
              WHERE RoleID = @roleId
            `);
          
          const roleName = roleResult.recordset[0]?.Name || '';
          
          // Insert resource
          const resourceResult = await transaction.request()
            .input('name', sql.NVarChar, item.name)
            .input('roleId', sql.Int, roleId)
            .input('roleName', sql.NVarChar, roleName)
            .input('email', sql.NVarChar, item.email || null)
            .input('phone', sql.NVarChar, item.phone || null)
            .query(`
              INSERT INTO Resources (Name, RoleID, Role, Email, Phone)
              OUTPUT INSERTED.ResourceID
              VALUES (@name, @roleId, @roleName, @email, @phone)
            `);
          
          const resourceId = resourceResult.recordset[0].ResourceID;
          
          // Process skills if provided
          if (item.skills) {
            // Convert skills to array if it's a string
            const skillsArray = Array.isArray(item.skills) 
              ? item.skills 
              : (typeof item.skills === 'string' 
                  ? item.skills.split(',').map(s => s.trim()) 
                  : []);
            
            for (const skillName of skillsArray) {
              if (!skillName) continue;
              
              const skillId = await getSkillId(transaction, skillName);
              
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

          // Process required roles if provided
          if (item.requiredRoles) {
            try {
              // Parse the JSON string if it's a string
              const rolesArray = typeof item.requiredRoles === 'string' 
                ? JSON.parse(item.requiredRoles) 
                : (Array.isArray(item.requiredRoles) ? item.requiredRoles : []);
              
              // Get the project ID that was just inserted
              const projectId = projectResult.recordset[0].ProjectID;
              
              for (const roleReq of rolesArray) {
                if (!roleReq.roleId || !roleReq.count) {
                  continue; // Skip invalid role entries
                }
                
                const roleId = parseInt(roleReq.roleId);
                const count = parseInt(roleReq.count) || 1;
                
                // Validate role exists
                const roleResult = await transaction.request()
                  .input('roleId', sql.Int, roleId)
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
                  .input('roleId', sql.Int, roleId)
                  .input('count', sql.Int, count)
                  .query(`
                    INSERT INTO ProjectRoles (ProjectID, RoleID, Count)
                    VALUES (@projectId, @roleId, @count)
                  `);
              }
            } catch (err) {
              // Log the error but continue with the import
              console.error(`Error processing requiredRoles for project ${item.name}:`, err);
            }
          }
          
          results.successful++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            item: item.name || 'Unknown',
            error: err.message
          });
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      res.json(results);
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error importing resources:', err);
    res.status(500).json({
      message: 'Error importing resources',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Import projects from Excel
exports.importProjects = async (req, res) => {
  try {
    const { projects } = req.body;
    
    if (!Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({ message: 'Valid projects array is required' });
    }
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    const results = {
      total: projects.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    try {
      for (const item of projects) {
        try {
          // Validate required fields
          if (!item.name || !item.client) {
            throw new Error('Project name and client are required');
          }
          
          // Insert project
          const projectResult = await transaction.request()
            .input('name', sql.NVarChar, item.name)
            .input('client', sql.NVarChar, item.client)
            .input('description', sql.NVarChar, item.description || null)
            .input('startDate', sql.Date, item.startDate ? new Date(item.startDate) : null)
            .input('endDate', sql.Date, item.endDate ? new Date(item.endDate) : null)
            .input('status', sql.NVarChar, item.status || 'Active')
            .query(`
              INSERT INTO Projects (Name, Client, Description, StartDate, EndDate, Status)
              OUTPUT INSERTED.ProjectID
              VALUES (@name, @client, @description, @startDate, @endDate, @status)
            `);
          
          const projectId = projectResult.recordset[0].ProjectID;
          
          // Process required skills if provided
          if (item.requiredSkills) {
            // Convert skills to array if it's a string
            const skillsArray = Array.isArray(item.requiredSkills) 
              ? item.requiredSkills 
              : (typeof item.requiredSkills === 'string' 
                  ? item.requiredSkills.split(',').map(s => s.trim()) 
                  : []);
            
            for (const skillName of skillsArray) {
              if (!skillName) continue;
              
              const skillId = await getSkillId(transaction, skillName);
              
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
          if (item.requiredRoles) {
            try {
              // Parse the JSON string if it's a string
              const rolesArray = typeof item.requiredRoles === 'string' 
                ? JSON.parse(item.requiredRoles) 
                : (Array.isArray(item.requiredRoles) ? item.requiredRoles : []);
              
              for (const roleReq of rolesArray) {
                if (!roleReq.roleId || !roleReq.count) {
                  continue; // Skip invalid role entries
                }
                
                const roleId = parseInt(roleReq.roleId);
                const count = parseInt(roleReq.count) || 1;
                
                // Validate role exists
                const roleResult = await transaction.request()
                  .input('roleId', sql.Int, roleId)
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
                  .input('roleId', sql.Int, roleId)
                  .input('count', sql.Int, count)
                  .query(`
                    INSERT INTO ProjectRoles (ProjectID, RoleID, Count)
                    VALUES (@projectId, @roleId, @count)
                  `);
              }
            } catch (err) {
              // Log the error but continue with the import
              console.error(`Error processing requiredRoles for project ${item.name}:`, err);
            }
          }
          
          results.successful++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            item: item.name || 'Unknown',
            error: err.message
          });
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      res.json(results);
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error importing projects:', err);
    res.status(500).json({
      message: 'Error importing projects',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Import allocations from Excel
exports.importAllocations = async (req, res) => {
  try {
    const { allocations } = req.body;
    
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ message: 'Valid allocations array is required' });
    }
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    const results = {
      total: allocations.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    try {
      for (const item of allocations) {
        try {
          // Validate required fields
          if (!item.resourceId || !item.projectId || !item.startDate || !item.endDate || !item.utilization) {
            throw new Error('ResourceId, projectId, startDate, endDate, and utilization are required');
          }
          
          // Validate resource exists
          const resourceCheck = await transaction.request()
            .input('resourceId', sql.Int, item.resourceId)
            .query(`SELECT ResourceID FROM Resources WHERE ResourceID = @resourceId`);
          
          if (resourceCheck.recordset.length === 0) {
            throw new Error(`Resource with ID ${item.resourceId} not found`);
          }
          
          // Validate project exists
          const projectCheck = await transaction.request()
            .input('projectId', sql.Int, item.projectId)
            .query(`SELECT ProjectID FROM Projects WHERE ProjectID = @projectId`);
          
          if (projectCheck.recordset.length === 0) {
            throw new Error(`Project with ID ${item.projectId} not found`);
          }
          
          // Validate dates
          const startDateObj = new Date(item.startDate);
          const endDateObj = new Date(item.endDate);
          
          if (startDateObj > endDateObj) {
            throw new Error('Start date must be before or equal to end date');
          }
          
          // Validate utilization
          const utilization = parseInt(item.utilization);
          if (isNaN(utilization) || utilization < 1 || utilization > 100) {
            throw new Error('Utilization must be between 1 and 100');
          }
          
          // Check total utilization
          const utilizationCheck = await transaction.request()
            .input('resourceId', sql.Int, item.resourceId)
            .input('startDate', sql.Date, startDateObj)
            .input('endDate', sql.Date, endDateObj)
            .input('projectId', sql.Int, item.projectId)
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
            throw new Error(`This allocation would exceed 100% utilization. Current utilization: ${existingUtilization}%`);
          }
          
          // Check for existing allocation
          const existingAllocation = await transaction.request()
            .input('resourceId', sql.Int, item.resourceId)
            .input('projectId', sql.Int, item.projectId)
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
              .input('resourceId', sql.Int, item.resourceId)
              .input('projectId', sql.Int, item.projectId)
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
              .input('resourceId', sql.Int, item.resourceId)
              .input('projectId', sql.Int, item.projectId)
              .input('startDate', sql.Date, startDateObj)
              .input('endDate', sql.Date, endDateObj)
              .input('utilization', sql.Int, utilization)
              .query(`
                INSERT INTO Allocations (ResourceID, ProjectID, StartDate, EndDate, Utilization)
                VALUES (@resourceId, @projectId, @startDate, @endDate, @utilization)
              `);
          }
          
          results.successful++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            item: `Resource ${item.resourceId}, Project ${item.projectId}`,
            error: err.message
          });
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      res.json(results);
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error importing allocations:', err);
    res.status(500).json({
      message: 'Error importing allocations',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};