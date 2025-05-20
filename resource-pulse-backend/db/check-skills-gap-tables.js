/**
 * Script to check Skills Gap tables status
 * This will check if tables exist and print their status
 */
const { sql, poolPromise } = require('./config');

async function checkTables() {
  try {
    console.log('Checking Skills Gap tables status...');
    
    const pool = await poolPromise;
    console.log('Connected to SQL Server');
    
    // Check which tables exist
    const tableNames = [
      'Skills',
      'ResourceSkills',
      'ProjectSkills',
      'market_skill_trends',
      'skills_gap_analysis_cache',
      'skills_gap_recommendations'
    ];
    
    for (const tableName of tableNames) {
      try {
        const result = await pool.request().query(`
          SELECT OBJECT_ID('${tableName}') as table_id,
                 (SELECT COUNT(*) FROM ${tableName}) as row_count
        `);
        
        if (result.recordset[0].table_id) {
          console.log(`Table ${tableName}: EXISTS with ${result.recordset[0].row_count} rows`);
        } else {
          console.log(`Table ${tableName}: DOES NOT EXIST`);
        }
      } catch (error) {
        console.log(`Table ${tableName}: ERROR checking - ${error.message}`);
      }
    }
    
    // Check if market_skill_trends has data
    try {
      const result = await pool.request().query(`
        SELECT TOP 5 *
        FROM market_skill_trends
      `);
      
      console.log('\nSample market trends data:');
      if (result.recordset.length > 0) {
        console.table(result.recordset);
      } else {
        console.log('No market trends data found');
      }
    } catch (error) {
      console.log(`Error checking market trends: ${error.message}`);
    }
    
    console.log('\nCheck completed.');
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    // Close the SQL connection
    try {
      const pool = await poolPromise;
      await pool.close();
      console.log('SQL connection closed');
    } catch (closeError) {
      console.error('Error closing SQL connection:', closeError);
    }
  }
}

// Execute the check
checkTables();