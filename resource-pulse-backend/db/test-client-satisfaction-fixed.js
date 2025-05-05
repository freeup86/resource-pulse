/**
 * Test script for client satisfaction data
 * This script tests direct database queries to fetch projects without requiring Clients table
 */
const { poolPromise, sql } = require('./config');

const run = async () => {
  try {
    console.log('Starting test for client satisfaction data (fixed version)');
    
    // Connect to database
    const pool = await poolPromise;
    console.log('Connected to database');
    
    // First get tables we have
    const tablesQuery = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `;
    
    console.log('Getting available tables...');
    const tablesResult = await pool.request().query(tablesQuery);
    console.log('Available tables:');
    tablesResult.recordset.forEach(table => {
      console.log(`- ${table.TABLE_NAME}`);
    });
    
    // Get all projects (without joining Clients)
    const projectsQuery = `
      SELECT 
        p.ProjectID as id, 
        p.Name as name,
        p.Client as client,
        p.Status as projectStatus,
        p.StartDate,
        p.EndDate
      FROM Projects p
      ORDER BY p.Name
    `;
    
    console.log('\nExecuting query for projects...');
    const projectsResult = await pool.request().query(projectsQuery);
    const projects = projectsResult.recordset;
    
    console.log(`Found ${projects.length} projects in database`);
    
    if (projects.length === 0) {
      console.log('No projects found!');
      return;
    }
    
    // Display the projects
    console.log('\nProjects found:');
    projects.forEach(project => {
      console.log(`- ${project.id}: ${project.name} (Status: ${project.projectStatus}, Client: ${project.client})`);
    });
    
    // Get project columns
    const columnsQuery = `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Projects'
    `;
    
    console.log('\nGetting Project table columns:');
    const columnsResult = await pool.request().query(columnsQuery);
    console.log('Columns in Projects table:');
    columnsResult.recordset.forEach(column => {
      console.log(`- ${column.COLUMN_NAME}`);
    });
    
    // Generate predictions for each project
    console.log('\nGenerating predictions for each project:');
    
    for (const project of projects) {
      try {
        // Get allocation count for this project
        const allocationsQuery = `
          SELECT COUNT(*) as allocationCount 
          FROM Allocations 
          WHERE ProjectID = @projectId
        `;
        
        const allocationsRequest = pool.request();
        allocationsRequest.input('projectId', sql.Int, project.id);
        const allocationsResult = await allocationsRequest.query(allocationsQuery);
        const allocationCount = allocationsResult.recordset[0].allocationCount;
        
        console.log(`Project ${project.id} (${project.name}) has ${allocationCount} allocations`);
        
        // For each project, determine satisfaction score
        let satisfactionScore;
        let status;
        
        // Status-based satisfaction
        if (project.projectStatus === 'At Risk') {
          satisfactionScore = Math.floor(Math.random() * 31) + 20; // 20-50
          status = 'at_risk';
        } else if (project.projectStatus === 'On Hold') {
          satisfactionScore = Math.floor(Math.random() * 26) + 35; // 35-60
          status = 'needs_attention';
        } else if (project.projectStatus === 'Completed') {
          satisfactionScore = Math.floor(Math.random() * 21) + 70; // 70-90
          status = 'satisfied';
        } else { // In Progress or other status
          satisfactionScore = Math.floor(Math.random() * 41) + 50; // 50-90
          status = satisfactionScore >= 75 ? 'satisfied' : 'needs_attention';
        }
        
        console.log(`  - Satisfaction score: ${satisfactionScore}, Status: ${status}`);
      } catch (error) {
        console.error(`  - Error processing project ${project.id}:`, error);
      }
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error executing test:', error);
  } finally {
    process.exit(0);
  }
};

// Run the test
run();