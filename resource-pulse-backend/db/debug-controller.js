/**
 * Debug Client Satisfaction Controller
 * Direct execution of controller code to identify issues
 */
const { poolPromise } = require('./config');

// Simulate express response
const mockResponse = {
  json: (data) => {
    console.log('RESPONSE DATA:');
    console.log(JSON.stringify(data, null, 2));
    return data;
  },
  status: (code) => {
    console.log(`STATUS CODE: ${code}`);
    return mockResponse;
  }
};

async function debugController() {
  try {
    console.log('== DEBUG: Client Satisfaction Controller ==');
    
    // Connect to database
    const pool = await poolPromise;
    console.log('Connected to database');
    
    // Check projects table
    const projectsQuery = `
      SELECT TOP 5 * FROM Projects 
      ORDER BY Name
    `;
    
    console.log('Executing query:', projectsQuery);
    const projectsResult = await pool.request().query(projectsQuery);
    
    console.log(`Found ${projectsResult.recordset.length} projects:`);
    projectsResult.recordset.forEach((project, i) => {
      console.log(`${i+1}. ${project.Name} (${project.ProjectID}) - Status: ${project.Status}`);
    });
    
    // Now trace through the critical query from clientSatisfactionController
    console.log('\nExecuting project satisfaction query:');
    
    try {
      const query = `
        SELECT TOP 100
          p.ProjectID as id, 
          p.Name as name,
          p.Client as client,
          p.Status as projectStatus,
          p.StartDate,
          p.EndDate,
          p.Budget,
          p.ActualCost
        FROM Projects p
        ORDER BY p.Name
      `;
      
      console.log('Query:', query);
      const result = await pool.request().query(query);
      
      console.log(`Query returned ${result.recordset.length} projects`);
      
      if (result.recordset.length > 0) {
        console.log('First project:', result.recordset[0]);
      }
      
      // Check allocations query for first project
      if (result.recordset.length > 0) {
        const projectId = result.recordset[0].id;
        
        const allocationsQuery = `
          SELECT COUNT(*) as allocationCount 
          FROM Allocations 
          WHERE ProjectID = ${projectId}
        `;
        
        console.log(`\nChecking allocations for project ${projectId}:`);
        console.log('Query:', allocationsQuery);
        
        const allocationsResult = await pool.request().query(allocationsQuery);
        console.log('Allocations count:', allocationsResult.recordset[0].allocationCount);
      }
      
      return { success: true, projectCount: result.recordset.length };
    } catch (error) {
      console.error('ERROR executing query:', error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error('ERROR:', error);
    return { success: false, error: error.message };
  }
}

// Run the debug function
debugController()
  .then(result => {
    console.log('\nDebug completed:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Debug failed:', err);
    process.exit(1);
  });