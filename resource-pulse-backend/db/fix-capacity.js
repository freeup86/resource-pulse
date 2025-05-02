const fs = require('fs');
const path = require('path');
const { poolPromise, sql } = require('./config');

const fixCapacityTables = async () => {
  try {
    console.log('Checking and fixing capacity tables...');
    
    const pool = await poolPromise;
    
    const fixScript = fs.readFileSync(
      path.join(__dirname, 'fix-capacity-tables.sql'), 
      'utf8'
    );
    
    const result = await pool.request().query(fixScript);
    
    console.log('Capacity tables fixed successfully');
    
    // Close the pool
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Error fixing capacity tables:', err);
    process.exit(1);
  }
};

fixCapacityTables();