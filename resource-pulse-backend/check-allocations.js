// check-allocations.js
const { poolPromise, sql } = require('./db/config');

async function checkAllocations() {
  try {
    const pool = await poolPromise;
    console.log('Checking allocations...');
    
    const result = await pool.request()
      .input('projectId', sql.Int, 23)
      .query(`
        SELECT 
          a.AllocationID, 
          a.ResourceID, 
          r.Name as ResourceName, 
          a.ProjectID, 
          a.StartDate, 
          a.EndDate, 
          a.Utilization,
          a.CreatedAt
        FROM Allocations a 
        INNER JOIN Resources r ON a.ResourceID = r.ResourceID 
        WHERE a.ProjectID = @projectId 
        ORDER BY a.CreatedAt DESC
      `);
    
    console.log('Found', result.recordset.length, 'allocations');
    
    result.recordset.forEach(a => {
      const startDate = a.StartDate.toISOString().split('T')[0];
      const endDate = a.EndDate.toISOString().split('T')[0];
      console.log(`- Allocation ID: ${a.AllocationID}, Resource: ${a.ResourceName}, Utilization: ${a.Utilization}%, Dates: ${startDate} - ${endDate}`);
    });
    
    // Now let's check the date filtering in the API query
    const filteredResult = await pool.request()
      .input('projectId', sql.Int, 23)
      .query(`
        SELECT 
          a.AllocationID, 
          a.ResourceID, 
          r.Name as ResourceName, 
          a.StartDate, 
          a.EndDate, 
          a.Utilization
        FROM Allocations a 
        INNER JOIN Resources r ON a.ResourceID = r.ResourceID 
        WHERE a.ProjectID = @projectId 
        AND a.EndDate >= GETDATE()
        ORDER BY a.EndDate ASC
      `);
    
    console.log('Found', filteredResult.recordset.length, 'allocations after date filtering');
    
    filteredResult.recordset.forEach(a => {
      const startDate = a.StartDate.toISOString().split('T')[0];
      const endDate = a.EndDate.toISOString().split('T')[0];
      console.log(`- Allocation ID: ${a.AllocationID}, Resource: ${a.ResourceName}, Utilization: ${a.Utilization}%, Dates: ${startDate} - ${endDate}`);
    });
    
    // Get current date from the database
    const dateResult = await pool.request().query('SELECT GETDATE() as CurrentDate');
    console.log('Current database date:', dateResult.recordset[0].CurrentDate);
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAllocations();