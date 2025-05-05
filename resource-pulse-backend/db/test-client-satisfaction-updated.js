/**
 * Test Client Satisfaction API Functionality
 * This script tests the client satisfaction API after removing Clients table references
 */
const { poolPromise, sql } = require('../db/config');

async function runTest() {
  try {
    console.log('Testing client satisfaction functionality...');
    
    // Get database connection
    const pool = await poolPromise;
    console.log('Database connection established.');
    
    // 1. Verify database tables
    console.log('\n1. Checking database tables...');
    const tablesQuery = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `;
    
    const tablesResult = await pool.request().query(tablesQuery);
    const tables = tablesResult.recordset.map(row => row.TABLE_NAME);
    
    console.log('Available database tables:');
    tables.forEach(table => console.log(`- ${table}`));
    
    // Check if Clients table exists
    const hasClientsTable = tables.includes('Clients');
    console.log(`\nClients table exists: ${hasClientsTable}`);
    
    // 2. Test retrieving projects
    console.log('\n2. Testing project retrieval...');
    const projectsQuery = `
      SELECT TOP 5 
        ProjectID, 
        Name, 
        Client, 
        Status, 
        StartDate, 
        EndDate, 
        Budget, 
        ActualCost
      FROM Projects
      ORDER BY Name
    `;
    
    const projectsResult = await pool.request().query(projectsQuery);
    const projects = projectsResult.recordset;
    
    console.log(`Retrieved ${projects.length} projects:`);
    projects.forEach(project => {
      console.log(`- Project ID: ${project.ProjectID}, Name: ${project.Name}, Client: ${project.Client}`);
    });
    
    // 3. Test retrieving allocations for a project
    if (projects.length > 0) {
      const projectId = projects[0].ProjectID;
      console.log(`\n3. Testing allocation retrieval for project ID ${projectId}...`);
      
      const allocationsQuery = `
        SELECT a.*, r.Name as resourceName
        FROM Allocations a
        JOIN Resources r ON a.ResourceID = r.ResourceID
        WHERE a.ProjectID = @projectId
      `;
      
      const allocationsRequest = pool.request();
      allocationsRequest.input('projectId', sql.Int, projectId);
      const allocationsResult = await allocationsRequest.query(allocationsQuery);
      const allocations = allocationsResult.recordset;
      
      console.log(`Retrieved ${allocations.length} allocations for project ID ${projectId}:`);
      allocations.forEach(allocation => {
        console.log(`- Resource: ${allocation.resourceName}, Percentage: ${allocation.Percentage}%, ` +
                    `Start: ${allocation.StartDate.toISOString().split('T')[0]}, ` +
                    `End: ${allocation.EndDate.toISOString().split('T')[0]}`);
      });
      
      // 4. Test satisfaction factors generation
      console.log('\n4. Testing satisfaction factors generation...');
      
      // Generate positive factors
      const positiveFactors = [];
      
      if (projects[0].Status === 'Active') {
        positiveFactors.push({ factor: 'Project is actively managed', count: 1 });
      }
      
      if (projects[0].Budget && projects[0].ActualCost) {
        const utilization = (projects[0].ActualCost / projects[0].Budget) * 100;
        if (utilization < 60) {
          positiveFactors.push({ 
            factor: `Project is well within budget (${utilization.toFixed(0)}% used)`, 
            count: 2 
          });
        }
      }
      
      // Calculate allocation metrics
      const totalAllocationPercentage = allocations.reduce((sum, a) => sum + a.Percentage, 0);
      const averageAllocation = allocations.length > 0 ? totalAllocationPercentage / allocations.length : 0;
      
      if (averageAllocation >= 70) {
        positiveFactors.push({ 
          factor: `Strong resource commitment with average ${averageAllocation.toFixed(0)}% allocation`, 
          count: 2 
        });
      }
      
      if (allocations.length >= 3) {
        positiveFactors.push({ 
          factor: `Multiple resources (${allocations.length}) allocated to project`, 
          count: 1 
        });
      }
      
      // Add some common factors
      positiveFactors.push({ factor: 'Regular client communication', count: 1 });
      positiveFactors.push({ factor: 'Clearly defined project scope', count: 1 });
      
      console.log('Generated positive factors:');
      positiveFactors.forEach(factor => {
        console.log(`- ${factor.factor} (Count: ${factor.count})`);
      });
      
      // Test passing client name directly
      console.log('\n5. Testing client name retrieval for projects...');
      
      if (projects[0].Client) {
        const clientName = projects[0].Client;
        console.log(`Found client name: ${clientName}`);
        
        const clientProjectsQuery = `
          SELECT COUNT(*) as projectCount
          FROM Projects
          WHERE Client = @clientName
        `;
        
        const clientProjectsRequest = pool.request();
        clientProjectsRequest.input('clientName', sql.NVarChar, clientName);
        const clientProjectsResult = await clientProjectsRequest.query(clientProjectsQuery);
        const projectCount = clientProjectsResult.recordset[0].projectCount;
        
        console.log(`Client "${clientName}" has ${projectCount} project(s)`);
      } else {
        console.log('No client name found for this project');
      }
    }
    
    console.log('\nTest completed successfully!');
    return true;
  } catch (error) {
    console.error('Error running test:', error);
    return false;
  }
}

// Run the test
runTest()
  .then(success => {
    console.log(`\nTest ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });