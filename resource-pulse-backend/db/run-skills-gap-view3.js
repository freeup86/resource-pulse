// Create SkillsGapView view only
const { poolPromise } = require('./config');

async function createSkillsGapView() {
  try {
    console.log('Creating SkillsGapView view...');
    const pool = await poolPromise;
    
    // Drop view if it exists
    try {
      await pool.request().query(`
        IF EXISTS (SELECT * FROM sys.views WHERE name = 'SkillsGapView')
          DROP VIEW SkillsGapView
      `);
    } catch (err) {
      console.log('No existing view to drop or error dropping:', err.message);
    }
    
    // Create the view
    const viewQuery = `
      CREATE VIEW SkillsGapView AS
      SELECT 
          sc.SkillID,
          sc.SkillName,
          sc.Category,
          sc.ResourceCount,
          sc.CoveragePercentage,
          sc.AvgProficiency,
          sd.ProjectCount,
          sd.DemandPercentage,
          sd.AvgImportance,
          CASE 
              WHEN sd.DemandPercentage IS NULL THEN 0
              WHEN sc.CoveragePercentage IS NULL THEN sd.DemandPercentage
              ELSE IIF(sd.DemandPercentage - sc.CoveragePercentage > 0, 
                       sd.DemandPercentage - sc.CoveragePercentage, 0)
          END AS GapPercentage,
          CASE
              WHEN sd.DemandPercentage IS NULL THEN 'none'
              WHEN sc.CoveragePercentage IS NULL THEN 'critical'
              WHEN (sd.DemandPercentage - sc.CoveragePercentage) > 50 THEN 'critical'
              WHEN (sd.DemandPercentage - sc.CoveragePercentage) > 30 THEN 'high'
              WHEN (sd.DemandPercentage - sc.CoveragePercentage) > 10 THEN 'medium'
              ELSE 'low'
          END AS GapSeverity
      FROM 
          ResourceSkillsCoverage sc
      LEFT JOIN 
          ProjectSkillsDemand sd ON sc.SkillID = sd.SkillID
    `;
    
    await pool.request().query(viewQuery);
    console.log('SkillsGapView view created successfully');
    return true;
  } catch (err) {
    console.error('Error creating SkillsGapView view:', err.message);
    return false;
  }
}

// Execute if this script is run directly
if (require.main === module) {
  createSkillsGapView()
    .then(success => {
      console.log(success ? 'View created successfully' : 'Failed to create view');
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
}

module.exports = { createSkillsGapView };