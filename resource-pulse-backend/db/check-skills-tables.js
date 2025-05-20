/**
 * Script to check skills-related tables and data
 * This helps diagnose why the Skills Gap Analysis isn't showing real data
 */
const { sql, poolPromise } = require('./config');

async function checkSkillsTables() {
  try {
    console.log('Checking skills tables and data...');
    
    const pool = await poolPromise;
    
    // 1. Check if the tables exist
    const tablesResult = await pool.request().query(`
      SELECT 
        OBJECT_ID('Skills') as skills_table,
        OBJECT_ID('ResourceSkills') as resource_skills_table,
        OBJECT_ID('ProjectSkills') as project_skills_table,
        OBJECT_ID('market_skill_trends') as market_skills_trends_table,
        OBJECT_ID('Resources') as resources_table,
        OBJECT_ID('Projects') as projects_table
    `);
    
    const tableStatus = tablesResult.recordset[0];
    console.log('\nTable existence status:');
    console.log('-----------------------');
    console.log('Skills table exists:', !!tableStatus.skills_table);
    console.log('ResourceSkills table exists:', !!tableStatus.resource_skills_table);
    console.log('ProjectSkills table exists:', !!tableStatus.project_skills_table);
    console.log('market_skill_trends table exists:', !!tableStatus.market_skills_trends_table);
    console.log('Resources table exists:', !!tableStatus.resources_table);
    console.log('Projects table exists:', !!tableStatus.projects_table);
    
    // 2. Check table counts
    const counts = {};
    const tables = [
      { name: 'Skills', exists: !!tableStatus.skills_table },
      { name: 'ResourceSkills', exists: !!tableStatus.resource_skills_table },
      { name: 'ProjectSkills', exists: !!tableStatus.project_skills_table },
      { name: 'market_skill_trends', exists: !!tableStatus.market_skills_trends_table },
      { name: 'Resources', exists: !!tableStatus.resources_table },
      { name: 'Projects', exists: !!tableStatus.projects_table }
    ];
    
    console.log('\nTable row counts:');
    console.log('----------------');
    
    for (const table of tables) {
      if (table.exists) {
        try {
          const countResult = await pool.request().query(`SELECT COUNT(*) as count FROM ${table.name}`);
          counts[table.name] = countResult.recordset[0].count;
          console.log(`${table.name}: ${counts[table.name]} rows`);
        } catch (error) {
          console.error(`Error counting ${table.name}:`, error.message);
          counts[table.name] = 'ERROR';
        }
      } else {
        console.log(`${table.name}: TABLE DOES NOT EXIST`);
        counts[table.name] = 'N/A';
      }
    }
    
    // 3. Check upcoming projects
    if (tableStatus.projects_table) {
      try {
        const upcomingProjectsResult = await pool.request().query(`
          SELECT COUNT(*) as count FROM Projects 
          WHERE EndDate >= GETDATE()
        `);
        const upcomingProjects = upcomingProjectsResult.recordset[0].count;
        console.log(`\nUpcoming projects (EndDate >= today): ${upcomingProjects}`);
      } catch (error) {
        console.error('Error checking upcoming projects:', error.message);
      }
    }
    
    // 4. Check resources with skills
    if (tableStatus.resource_skills_table) {
      try {
        const resourcesWithSkillsResult = await pool.request().query(`
          SELECT COUNT(DISTINCT ResourceID) as count FROM ResourceSkills
        `);
        const resourcesWithSkills = resourcesWithSkillsResult.recordset[0].count;
        console.log(`Resources with assigned skills: ${resourcesWithSkills}`);
      } catch (error) {
        console.error('Error checking resources with skills:', error.message);
      }
    }
    
    // 5. Check projects with skills
    if (tableStatus.project_skills_table) {
      try {
        const projectsWithSkillsResult = await pool.request().query(`
          SELECT COUNT(DISTINCT ProjectID) as count FROM ProjectSkills
        `);
        const projectsWithSkills = projectsWithSkillsResult.recordset[0].count;
        console.log(`Projects with required skills: ${projectsWithSkills}`);
      } catch (error) {
        console.error('Error checking projects with skills:', error.message);
      }
    }
    
    // 6. Check projects with skills that are upcoming
    if (tableStatus.project_skills_table && tableStatus.projects_table) {
      try {
        const upcomingProjectsWithSkillsResult = await pool.request().query(`
          SELECT COUNT(DISTINCT ps.ProjectID) as count 
          FROM ProjectSkills ps
          JOIN Projects p ON ps.ProjectID = p.ProjectID
          WHERE p.EndDate >= GETDATE()
        `);
        const upcomingProjectsWithSkills = upcomingProjectsWithSkillsResult.recordset[0].count;
        console.log(`Upcoming projects with required skills: ${upcomingProjectsWithSkills}`);
      } catch (error) {
        console.error('Error checking upcoming projects with skills:', error.message);
      }
    }
    
    // 7. Print samples of data to check quality
    console.log('\nData Samples:');
    console.log('------------');
    
    // Sample Skills
    if (tableStatus.skills_table && counts.Skills > 0) {
      try {
        const skillsResult = await pool.request().query(`SELECT TOP 5 * FROM Skills`);
        console.log('\nSkills sample:');
        console.table(skillsResult.recordset);
      } catch (error) {
        console.error('Error fetching skills sample:', error.message);
      }
    }
    
    // Sample ResourceSkills
    if (tableStatus.resource_skills_table && counts.ResourceSkills > 0) {
      try {
        const resourceSkillsResult = await pool.request().query(`
          SELECT TOP 5 rs.*, s.Name AS SkillName, r.Name AS ResourceName
          FROM ResourceSkills rs
          JOIN Skills s ON rs.SkillID = s.SkillID
          JOIN Resources r ON rs.ResourceID = r.ResourceID
        `);
        console.log('\nResourceSkills sample:');
        console.table(resourceSkillsResult.recordset);
      } catch (error) {
        console.error('Error fetching resource skills sample:', error.message);
      }
    }
    
    // Sample ProjectSkills
    if (tableStatus.project_skills_table && counts.ProjectSkills > 0) {
      try {
        const projectSkillsResult = await pool.request().query(`
          SELECT TOP 5 ps.*, s.Name AS SkillName, p.Name AS ProjectName, p.EndDate
          FROM ProjectSkills ps
          JOIN Skills s ON ps.SkillID = s.SkillID
          JOIN Projects p ON ps.ProjectID = p.ProjectID
        `);
        console.log('\nProjectSkills sample:');
        console.table(projectSkillsResult.recordset);
      } catch (error) {
        console.error('Error fetching project skills sample:', error.message);
      }
    }
    
    // 8. Check skill analysis function (just as a test)
    console.log('\nTesting skills gap analysis function:');
    
    const skillsGapService = require('../services/skillsGapService');
    
    try {
      // Test with real data
      const realDataAnalysis = await skillsGapService.analyzeOrganizationSkillsGap({
        includeAIInsights: false,
        timeRange: '6months',
        forceFallback: false
      });
      
      console.log('Real data analysis results:');
      console.log('- Using fallback data:', !!realDataAnalysis.usingFallbackData);
      console.log('- Overall gap score:', realDataAnalysis.gapAnalysis.overallGapScore);
      console.log('- Critical gaps count:', realDataAnalysis.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'critical').length);
      console.log('- High gaps count:', realDataAnalysis.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'high').length);
    } catch (error) {
      console.error('Error testing real data analysis:', error.message);
    }
    
    try {
      // Test with forced fallback
      const fallbackAnalysis = await skillsGapService.analyzeOrganizationSkillsGap({
        includeAIInsights: false,
        timeRange: '6months',
        forceFallback: true
      });
      
      console.log('\nForced fallback analysis results:');
      console.log('- Using fallback data:', !!fallbackAnalysis.usingFallbackData);
      console.log('- Overall gap score:', fallbackAnalysis.gapAnalysis.overallGapScore);
      console.log('- Critical gaps count:', fallbackAnalysis.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'critical').length);
      console.log('- High gaps count:', fallbackAnalysis.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'high').length);
    } catch (error) {
      console.error('Error testing fallback analysis:', error.message);
    }
    
    // 9. Report assessment
    console.log('\nAssessment:');
    console.log('-----------');
    
    const requiredTablesExist = tableStatus.skills_table && 
                               tableStatus.resource_skills_table && 
                               tableStatus.project_skills_table;
    
    const hasSkillsData = counts.Skills > 0;
    const hasResourceSkillsData = counts.ResourceSkills > 0;
    const hasProjectSkillsData = counts.ProjectSkills > 0;
    
    console.log('Required tables exist:', requiredTablesExist ? 'YES' : 'NO');
    console.log('Tables have data:');
    console.log('- Skills:', hasSkillsData ? 'YES' : 'NO');
    console.log('- ResourceSkills:', hasResourceSkillsData ? 'YES' : 'NO');
    console.log('- ProjectSkills:', hasProjectSkillsData ? 'YES' : 'NO');
    
    if (!requiredTablesExist) {
      console.log('\nProblem: Some required tables do not exist');
      console.log('Solution: Run the skills-enhancement.sql script to create the tables');
    } else if (!hasSkillsData) {
      console.log('\nProblem: Skills table is empty');
      console.log('Solution: Add skills to the Skills table');
    } else if (!hasResourceSkillsData) {
      console.log('\nProblem: ResourceSkills table is empty');
      console.log('Solution: Assign skills to resources with appropriate proficiency levels');
    } else if (!hasProjectSkillsData) {
      console.log('\nProblem: ProjectSkills table is empty');
      console.log('Solution: Add skill requirements to projects with importance levels');
    } else {
      console.log('\nProblem: Despite having data, analysis may not be working correctly');
      console.log('Possible solutions:');
      console.log('- Check if upcoming projects exist (projects with EndDate >= today)');
      console.log('- Check if resources have skills assigned to them');
      console.log('- Check if projects have skills requirements assigned to them');
      console.log('- Debug the calculateSkillsGap function in skillsGapService.js');
    }
    
  } catch (error) {
    console.error('Error checking skills tables:', error);
  } finally {
    sql.close();
  }
}

// Run the check
checkSkillsTables().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});