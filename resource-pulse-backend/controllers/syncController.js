// resource-pulse-backend/controllers/syncController.js
const { poolPromise, sql } = require('../db/config');
const externalSystemService = require('../services/externalSystemService');
const dataMapper = require('../utils/dataMapperUtils');
const { getSkillId } = require('./skillsController');
const { getRoleByName } = require('./roleController');

// Sync resources from external system
exports.syncResources = async (req, res) => {
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    // Fetch resources from external system
    const externalResources = await externalSystemService.fetchResources();
    
    // Track results
    const results = {
      total: externalResources.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: []
    };
    
    // Create a mapping of external IDs to internal IDs
    const resourceMapping = {};
    
    // Process each resource
    for (const extResource of externalResources) {
      try {
        // Map external resource to ResourcePulse format
        const resourceData = dataMapper.mapExternalResource(extResource);
        
        // Check if resource already exists by email (using email as unique identifier)
        const existingResource = await transaction.request()
          .input('email', sql.NVarChar, resourceData.email)
          .query(`
            SELECT ResourceID FROM Resources WHERE Email = @email
          `);
        
        let resourceId;
        
        if (existingResource.recordset.length > 0) {
          // Update existing resource
          resourceId = existingResource.recordset[0].ResourceID;
          
          // Get or create role ID
          let roleId;
          if (resourceData.role) {
            const roleInfo = await getRoleByName(transaction, resourceData.role);
            roleId = roleInfo ? roleInfo.id : null;
            
            // If role doesn't exist, create a new one
            if (!roleId) {
              const roleResult = await transaction.request()
                .input('name', sql.NVarChar, resourceData.role)
                .query(`
                  INSERT INTO Roles (Name)
                  OUTPUT INSERTED.RoleID
                  VALUES (@name)
                `);
              
              roleId = roleResult.recordset[0].RoleID;
            }
          }
          
          // Update resource
          await transaction.request()
            .input('resourceId', sql.Int, resourceId)
            .input('name', sql.NVarChar, resourceData.name)
            .input('roleId', sql.Int, roleId)
            .input('roleName', sql.NVarChar, resourceData.role)
            .input('email', sql.NVarChar, resourceData.email)
            .input('phone', sql.NVarChar, resourceData.phone || null)
            .input('updatedAt', sql.DateTime2, new Date())
            .query(`
              UPDATE Resources
              SET Name = @name,
                  RoleID = @roleId,
                  Role = @roleName,
                  Email = @email,
                  Phone = @phone,
                  UpdatedAt = @updatedAt
              WHERE ResourceID = @resourceId
            `);
          
          results.updated++;
        } else {
          // Create new resource
          // Get or create role ID
          let roleId;
          if (resourceData.role) {
            const roleInfo = await getRoleByName(transaction, resourceData.role);
            roleId = roleInfo ? roleInfo.id : null;
            
            // If role doesn't exist, create a new one
            if (!roleId) {
              const roleResult = await transaction.request()
                .input('name', sql.NVarChar, resourceData.role)
                .query(`
                  INSERT INTO Roles (Name)
                  OUTPUT INSERTED.RoleID
                  VALUES (@name)
                `);
              
              roleId = roleResult.recordset[0].RoleID;
            }
          }
          
          // Insert resource
          const resourceResult = await transaction.request()
            .input('name', sql.NVarChar, resourceData.name)
            .input('roleId', sql.Int, roleId)
            .input('roleName', sql.NVarChar, resourceData.role)
            .input('email', sql.NVarChar, resourceData.email)
            .input('phone', sql.NVarChar, resourceData.phone || null)
            .query(`
              INSERT INTO Resources (Name, RoleID, Role, Email, Phone)
              OUTPUT INSERTED.ResourceID
              VALUES (@name, @roleId, @roleName, @email, @phone)
            `);
          
          resourceId = resourceResult.recordset[0].ResourceID;
          results.created++;
        }
        
        // Store mapping of external ID to internal ID
        resourceMapping[extResource.id] = resourceId;
        
        // Process skills
        if (resourceData.skills && resourceData.skills.length > 0) {
          // Remove existing skills
          await transaction.request()
            .input('resourceId', sql.Int, resourceId)
            .query(`
              DELETE FROM ResourceSkills
              WHERE ResourceID = @resourceId
            `);
          
          // Add new skills
          for (const skillName of resourceData.skills) {
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
      } catch (err) {
        results.failed++;
        results.errors.push({
          resource: extResource.name || extResource.id,
          error: err.message
        });
      }
    }
    
    // Commit transaction
    await transaction.commit();
    
    // Save resource mapping to session
    req.session.resourceMapping = resourceMapping;
    
    res.json(results);
  } catch (err) {
    console.error('Error syncing resources:', err);
    res.status(500).json({
      message: 'Error syncing resources',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Sync projects from external system
exports.syncProjects = async (req, res) => {
  // Similar implementation to syncResources
  // Store project mapping in req.session.projectMapping
};

// Sync allocations from external system
exports.syncAllocations = async (req, res) => {
  // Use resource and project mappings from session:
  // const resourceMapping = req.session.resourceMapping || {};
  // const projectMapping = req.session.projectMapping || {};
};

// Sync all data from external system
exports.syncAll = async (req, res) => {
  try {
    // Create a session to store mappings
    req.session.syncInProgress = true;
    
    // Sync resources first
    const resourceResults = await this.syncResources(req);
    
    // Sync projects next
    const projectResults = await this.syncProjects(req);
    
    // Finally sync allocations using the mappings
    const allocationResults = await this.syncAllocations(req);
    
    // Clear session data
    req.session.resourceMapping = null;
    req.session.projectMapping = null;
    req.session.syncInProgress = false;
    
    res.json({
      resources: resourceResults,
      projects: projectResults,
      allocations: allocationResults
    });
  } catch (err) {
    console.error('Error in full sync process:', err);
    req.session.syncInProgress = false;
    res.status(500).json({
      message: 'Error syncing data',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};