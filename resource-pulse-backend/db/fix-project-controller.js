/**
 * Fix for project controller related to role handling
 * 
 * This script patches the project controller to handle role requirements correctly,
 * which fixes the 500 error when creating a new project.
 */

const fs = require('fs');
const path = require('path');

// Path to the project controller
const controllerPath = path.join(__dirname, '..', 'controllers', 'projectController.js');

// Backup the original file
const backupPath = `${controllerPath}.bak`;
fs.copyFileSync(controllerPath, backupPath);
console.log(`Backed up original project controller to ${backupPath}`);

// Read the file
const content = fs.readFileSync(controllerPath, 'utf8');

// Fix 1: Improve the requiredRoles validation in createProject
// Look for the section that processes required roles
const roleProcessingSection = content.match(/\/\/ Process required roles if provided[\s\S]+?if \(requiredRoles && requiredRoles\.length > 0\) {[\s\S]+?}\s+}/);

if (!roleProcessingSection) {
  console.error('Could not find the role processing section in projectController.js');
  process.exit(1);
}

// Create the new role processing code with better validation
const newRoleProcessingSection = `// Process required roles if provided
      if (requiredRoles && requiredRoles.length > 0) {
        console.log('Processing required roles:', requiredRoles);
        
        for (const roleReq of requiredRoles) {
          // Skip invalid role objects
          if (!roleReq || typeof roleReq !== 'object') {
            console.log('Skipping invalid role object:', roleReq);
            continue;
          }
          
          // Ensure roleId is a number
          const roleId = parseInt(roleReq.roleId);
          if (isNaN(roleId) || roleId <= 0) {
            console.log('Skipping role with invalid roleId:', roleReq);
            continue;
          }
          
          // Ensure count is a number and at least 1
          const count = parseInt(roleReq.count) || 1;
          
          console.log(\`Processing role: roleId=\${roleId}, count=\${count}\`);
          
          // Validate role exists
          try {
            const roleResult = await transaction.request()
              .input('roleId', sql.Int, roleId)
              .query(\`
                SELECT RoleID FROM Roles WHERE RoleID = @roleId
              \`);
            
            if (roleResult.recordset.length === 0) {
              // Role doesn't exist, skip it
              console.log(\`Role with ID \${roleId} not found, skipping\`);
              continue;
            }
            
            // Add role requirement to project
            await transaction.request()
              .input('projectId', sql.Int, projectId)
              .input('roleId', sql.Int, roleId)
              .input('count', sql.Int, count)
              .query(\`
                INSERT INTO ProjectRoles (ProjectID, RoleID, Count)
                VALUES (@projectId, @roleId, @count)
              \`);
              
            console.log(\`Added role \${roleId} with count \${count} to project \${projectId}\`);
          } catch (err) {
            console.error(\`Error processing role \${roleId}:\`, err.message);
            // Continue with other roles even if one fails
          }
        }
      }`;

// Replace the old section with the new one
const updatedContent = content.replace(roleProcessingSection[0], newRoleProcessingSection);

// Fix 2: Handle missing Roles table by checking if it exists
// Look for the require statement to inject this content right after it
const requireStatement = "const { poolPromise, sql } = require('../db/config');";
const roleTableCheck = `
// Check if Roles table exists and create it if it doesn't
const ensureRolesTable = async () => {
  try {
    const pool = await poolPromise;
    
    // Check if Roles table exists
    const tableCheck = await pool.request().query(\`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Roles'
    \`);
    
    if (tableCheck.recordset.length === 0) {
      console.log('Roles table does not exist, creating it...');
      
      // Create Roles table
      await pool.request().query(\`
        CREATE TABLE Roles (
          RoleID INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(100) NOT NULL UNIQUE,
          Description NVARCHAR(MAX) NULL,
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          UpdatedAt DATETIME2 DEFAULT GETDATE()
        )
      \`);
      
      // Create ProjectRoles table if it doesn't exist
      const projRolesCheck = await pool.request().query(\`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'ProjectRoles'
      \`);
      
      if (projRolesCheck.recordset.length === 0) {
        console.log('ProjectRoles table does not exist, creating it...');
        
        await pool.request().query(\`
          CREATE TABLE ProjectRoles (
            ProjectRoleID INT IDENTITY(1,1) PRIMARY KEY,
            ProjectID INT NOT NULL,
            RoleID INT NOT NULL,
            Count INT NOT NULL DEFAULT 1,
            CreatedAt DATETIME2 DEFAULT GETDATE(),
            UpdatedAt DATETIME2 DEFAULT GETDATE(),
            FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE,
            FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE
          )
        \`);
      }
      
      // Add some default roles
      await pool.request().query(\`
        INSERT INTO Roles (Name, Description)
        VALUES 
          ('Developer', 'Software developer role'),
          ('Designer', 'UX/UI designer role'),
          ('Project Manager', 'Project management role'),
          ('QA Engineer', 'Quality assurance engineer role'),
          ('DevOps Engineer', 'DevOps and infrastructure role')
      \`);
      
      console.log('Roles table created with default roles');
    }
  } catch (err) {
    console.error('Error ensuring Roles table exists:', err);
  }
};

// Call the function to ensure the Roles table exists
ensureRolesTable();
`;

// Insert the role table check after the require statement
const finalContent = updatedContent.replace(requireStatement, requireStatement + roleTableCheck);

// Write the updated file
fs.writeFileSync(controllerPath, finalContent);
console.log('Successfully updated project controller with role handling fixes');

console.log('Fix applied successfully! Please restart the server for changes to take effect.');