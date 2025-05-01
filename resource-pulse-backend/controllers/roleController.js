// src/controllers/roleController.js
const { poolPromise, sql } = require('../db/config');

// Get all roles
exports.getAllRoles = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Query roles
    const result = await pool.request()
      .query(`
        SELECT 
          RoleID as id, 
          Name as name, 
          Description as description
        FROM Roles
        ORDER BY Name
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error getting roles:', err);
    res.status(500).json({
      message: 'Error retrieving roles',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Create a new role
exports.createRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }
    
    const pool = await poolPromise;
    
    // Insert role
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .query(`
        INSERT INTO Roles (Name, Description)
        OUTPUT INSERTED.RoleID as id, INSERTED.Name as name, INSERTED.Description as description
        VALUES (@name, @description)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating role:', err);
    res.status(500).json({
      message: 'Error creating role',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Get role by ID
exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('roleId', sql.Int, id)
      .query(`
        SELECT 
          RoleID as id, 
          Name as name, 
          Description as description
        FROM Roles
        WHERE RoleID = @roleId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error getting role:', err);
    res.status(500).json({
      message: 'Error retrieving role',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Update role
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }
    
    const pool = await poolPromise;
    
    // Check if role exists
    const checkRole = await pool.request()
      .input('roleId', sql.Int, id)
      .query(`
        SELECT RoleID FROM Roles WHERE RoleID = @roleId
      `);
    
    if (checkRole.recordset.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    // Update role
    const result = await pool.request()
      .input('roleId', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('updatedAt', sql.DateTime2, new Date())
      .query(`
        UPDATE Roles
        SET Name = @name,
            Description = @description,
            UpdatedAt = @updatedAt
        OUTPUT 
          INSERTED.RoleID as id, 
          INSERTED.Name as name, 
          INSERTED.Description as description
        WHERE RoleID = @roleId
      `);
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).json({
      message: 'Error updating role',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Delete role
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Check if role exists
    const checkRole = await pool.request()
      .input('roleId', sql.Int, id)
      .query(`
        SELECT RoleID FROM Roles WHERE RoleID = @roleId
      `);
    
    if (checkRole.recordset.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    // Check if role is being used by any resources
    const checkResources = await pool.request()
      .input('roleId', sql.Int, id)
      .query(`
        SELECT COUNT(*) AS ResourceCount 
        FROM Resources 
        WHERE RoleID = @roleId
      `);
    
    if (checkResources.recordset[0].ResourceCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete role that is assigned to resources. Update resources first.' 
      });
    }
    
    // Delete role
    await pool.request()
      .input('roleId', sql.Int, id)
      .query(`
        DELETE FROM Roles
        WHERE RoleID = @roleId
      `);
    
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Error deleting role:', err);
    res.status(500).json({
      message: 'Error deleting role',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Get role by name
exports.getRoleByName = async (transaction, roleName) => {
  if (!roleName) return null;
  
  const roleResult = await transaction.request()
    .input('roleName', sql.NVarChar, roleName)
    .query(`
      SELECT RoleID as id, Name as name
      FROM Roles 
      WHERE Name = @roleName
    `);
  
  return roleResult.recordset.length > 0 ? roleResult.recordset[0] : null;
};