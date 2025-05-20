// Create ResourceSkillsCoverage view only
const { poolPromise } = require('./config');

async function createResourceSkillsCoverageView() {
  try {
    console.log('Creating ResourceSkillsCoverage view...');
    const pool = await poolPromise;
    
    // Drop view if it exists
    try {
      await pool.request().query(`
        IF EXISTS (SELECT * FROM sys.views WHERE name = 'ResourceSkillsCoverage')
          DROP VIEW ResourceSkillsCoverage
      `);
    } catch (err) {
      console.log('No existing view to drop or error dropping:', err.message);
    }
    
    // Create the view
    const viewQuery = `
      CREATE VIEW ResourceSkillsCoverage AS
      SELECT 
          s.SkillID AS SkillID,
          s.Name AS SkillName,
          s.Category,
          COUNT(rs.ResourceID) AS ResourceCount,
          CASE 
              WHEN (SELECT COUNT(*) FROM Resources) = 0 THEN 0
              ELSE (COUNT(rs.ResourceID) * 100.0 / (SELECT COUNT(*) FROM Resources)) 
          END AS CoveragePercentage,
          AVG(CAST(rs.ProficiencyLevel AS FLOAT)) AS AvgProficiency,
          0 AS CertifiedCount
      FROM 
          Skills s
      LEFT JOIN 
          ResourceSkills rs ON s.SkillID = rs.SkillID
      GROUP BY 
          s.SkillID, s.Name, s.Category
    `;
    
    await pool.request().query(viewQuery);
    console.log('ResourceSkillsCoverage view created successfully');
    return true;
  } catch (err) {
    console.error('Error creating ResourceSkillsCoverage view:', err.message);
    return false;
  }
}

// Execute if this script is run directly
if (require.main === module) {
  createResourceSkillsCoverageView()
    .then(success => {
      console.log(success ? 'View created successfully' : 'Failed to create view');
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
}

module.exports = { createResourceSkillsCoverageView };