// fix-allocation-dates.js
const { poolPromise, sql } = require('./db/config');

async function fixAllocationDates() {
  try {
    const pool = await poolPromise;
    console.log('Fixing allocation dates...');
    
    // Get current database date
    const dateResult = await pool.request().query('SELECT GETDATE() as CurrentDate');
    const currentDate = dateResult.recordset[0].CurrentDate;
    console.log('Current database date:', currentDate);
    
    // Calculate new dates (1 year from now)
    const futureDate = new Date(currentDate);
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const formattedFutureDate = futureDate.toISOString().split('T')[0];
    console.log('New end date for allocations:', formattedFutureDate);
    
    // Get allocations for project 23
    const projectId = 23;
    const allocationsResult = await pool.request()
      .input('projectId', sql.Int, projectId)
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
      `);
    
    console.log('Found', allocationsResult.recordset.length, 'allocations to update');
    
    // Update each allocation with a new end date
    for (const allocation of allocationsResult.recordset) {
      console.log(`Updating allocation ID ${allocation.AllocationID} for ${allocation.ResourceName}...`);
      
      // Keep the original start date, just update the end date
      const startDate = allocation.StartDate;
      
      await pool.request()
        .input('allocationId', sql.Int, allocation.AllocationID)
        .input('endDate', sql.Date, futureDate)
        .query(`
          UPDATE Allocations
          SET EndDate = @endDate
          WHERE AllocationID = @allocationId
        `);
      
      console.log(`- Updated end date from ${allocation.EndDate.toISOString().split('T')[0]} to ${formattedFutureDate}`);
    }
    
    // Verify the updates
    const updatedResult = await pool.request()
      .input('projectId', sql.Int, projectId)
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
      `);
    
    console.log('Updated allocations:');
    updatedResult.recordset.forEach(a => {
      const startDate = a.StartDate.toISOString().split('T')[0];
      const endDate = a.EndDate.toISOString().split('T')[0];
      console.log(`- Allocation ID: ${a.AllocationID}, Resource: ${a.ResourceName}, Utilization: ${a.Utilization}%, Dates: ${startDate} - ${endDate}`);
    });
    
    // Check filtered query
    const filteredResult = await pool.request()
      .input('projectId', sql.Int, projectId)
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
    
    console.log('Found', filteredResult.recordset.length, 'allocations after date filtering and updates');
    
    console.log('Fix completed successfully.');
  } catch (err) {
    console.error('Error:', err);
  }
}

fixAllocationDates();