// Create ProjectSkillsDemand view only
const { poolPromise } = require('./config');

async function createProjectSkillsDemandView() {
  try {
    console.log('Creating ProjectSkillsDemand view...');
    const pool = await poolPromise;
    
    // Drop view if it exists
    try {
      await pool.request().query(`
        IF EXISTS (SELECT * FROM sys.views WHERE name = 'ProjectSkillsDemand')
          DROP VIEW ProjectSkillsDemand
      `);
    } catch (err) {
      console.log('No existing view to drop or error dropping:', err.message);
    }
    
    // Create the view
    const viewQuery = `
      CREATE VIEW ProjectSkillsDemand AS
      SELECT 
          s.SkillID AS SkillID,
          s.Name AS SkillName,
          s.Category,
          COUNT(DISTINCT ps.ProjectID) AS ProjectCount,
          CASE 
              WHEN (SELECT COUNT(*) FROM Projects WHERE EndDate >= GETDATE()) = 0 THEN 0
              ELSE (COUNT(DISTINCT ps.ProjectID) * 100.0 / 
                    (SELECT COUNT(*) FROM Projects WHERE EndDate >= GETDATE())) 
          END AS DemandPercentage,
          AVG(CAST(ps.Priority AS FLOAT)) AS AvgImportance
      FROM 
          Skills s
      JOIN 
          ProjectSkills ps ON s.SkillID = ps.SkillID
      JOIN 
          Projects p ON ps.ProjectID = p.ProjectID
      WHERE 
          p.EndDate >= GETDATE()
      GROUP BY 
          s.SkillID, s.Name, s.Category
    `;
    
    await pool.request().query(viewQuery);
    console.log('ProjectSkillsDemand view created successfully');
    return true;
  } catch (err) {
    console.error('Error creating ProjectSkillsDemand view:', err.message);
    return false;
  }
}

// Execute if this script is run directly
if (require.main === module) {
  createProjectSkillsDemandView()
    .then(success => {
      console.log(success ? 'View created successfully' : 'Failed to create view');
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
}

module.exports = { createProjectSkillsDemandView };