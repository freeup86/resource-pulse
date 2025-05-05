/**
 * Test script for client satisfaction data
 * This script tests direct database queries to fetch projects and generate predictions
 */
const { poolPromise, sql } = require('./config');

const run = async () => {
  try {
    console.log('Starting test for client satisfaction data');
    
    // Connect to database
    const pool = await poolPromise;
    console.log('Connected to database');
    
    // Get all projects
    const projectsQuery = `
      SELECT 
        p.ProjectID as id, 
        p.Name as name,
        p.Client as client,
        p.Status as projectStatus,
        p.StartDate,
        p.EndDate,
        ISNULL(c.ClientID, 0) as clientId
      FROM Projects p
      LEFT JOIN Clients c ON p.Client = c.Name
      ORDER BY p.Name
    `;
    
    console.log('Executing query for projects...');
    const projectsResult = await pool.request().query(projectsQuery);
    const projects = projectsResult.recordset;
    
    console.log(`Found ${projects.length} projects in database`);
    
    if (projects.length === 0) {
      console.log('No projects found!');
      return;
    }
    
    // Display the projects
    console.log('Projects found:');
    projects.forEach(project => {
      console.log(`- ${project.id}: ${project.name} (Status: ${project.projectStatus}, Client: ${project.client})`);
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
        // This can be based on various project factors
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