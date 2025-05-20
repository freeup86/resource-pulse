/**
 * Debug script to analyze why Skills Gap Analysis is showing low/zero scores
 */
const { sql, poolPromise } = require('./config');
const skillsGapService = require('../services/skillsGapService');

async function debugSkillsGap() {
  try {
    console.log('Debugging Skills Gap Analysis...');
    
    const pool = await poolPromise;
    
    // Test function with debugging
    const originalCalculateSkillsGap = skillsGapService.calculateSkillsGap;
    
    // Temporarily replace the function with a debugging version
    skillsGapService.calculateSkillsGap = function(currentSkills, projectRequirements, marketTrends) {
      console.log('\n----- INPUT DATA FOR GAP CALCULATION -----');
      
      // Debug current skills data
      console.log('\nCurrent Skills Summary:');
      console.log(`Total Skills: ${currentSkills.summary.totalSkills}`);
      console.log(`Total Resources: ${currentSkills.summary.totalResources}`);
      console.log(`Top Skills (up to 5):`);
      currentSkills.summary.topSkills.slice(0, 5).forEach(skill => {
        console.log(`- ${skill.name}: ${skill.coveragePercentage.toFixed(1)}% coverage, ${skill.avgProficiency.toFixed(1)} avg proficiency`);
      });
      
      // Debug project requirements
      console.log('\nProject Requirements Summary:');
      console.log(`Total Requirements: ${projectRequirements.summary.totalRequirements}`);
      console.log(`Total Projects: ${projectRequirements.summary.totalProjects}`);
      console.log(`Time Range: ${projectRequirements.summary.timeRange.startDate} to ${projectRequirements.summary.timeRange.endDate}`);
      console.log(`Top Requirements (up to 5):`);
      projectRequirements.summary.topRequirements.slice(0, 5).forEach(req => {
        console.log(`- ${req.skillName}: ${req.demandPercentage.toFixed(1)}% demand, ${req.avgImportance.toFixed(1)} avg importance`);
      });
      
      // Debug calculation of immediate gaps
      console.log('\nCalculating Immediate Gaps:');
      const skillsMap = {};
      currentSkills.skills.forEach(skill => {
        skillsMap[skill.id] = skill;
      });
      
      const immediateGaps = [];
      let criticalCount = 0;
      let highCount = 0;
      
      projectRequirements.requirements.forEach(req => {
        const skill = skillsMap[req.skillId];
        console.log(`\nAnalyzing requirement: ${req.skillName} (${req.skillId})`);
        console.log(`- Demand: ${req.demandPercentage.toFixed(1)}%, Importance: ${req.avgImportance.toFixed(1)}`);
        
        if (!skill) {
          console.log(`- CRITICAL GAP: Skill not present at all`);
          immediateGaps.push({
            skillId: req.skillId,
            skillName: req.skillName,
            category: req.category,
            demandPercentage: req.demandPercentage,
            avgImportance: req.avgImportance,
            gapSeverity: 'critical',
            gapType: 'missing'
          });
          criticalCount++;
        } else {
          console.log(`- Current coverage: ${skill.coveragePercentage.toFixed(1)}%, Proficiency: ${skill.avgProficiency.toFixed(1)}`);
          
          if (skill.coveragePercentage < 20 && req.demandPercentage > 30) {
            console.log(`- HIGH GAP: Low coverage (${skill.coveragePercentage.toFixed(1)}%) but high demand (${req.demandPercentage.toFixed(1)}%)`);
            immediateGaps.push({
              skillId: req.skillId,
              skillName: req.skillName,
              category: req.category,
              demandPercentage: req.demandPercentage,
              coveragePercentage: skill.coveragePercentage,
              avgImportance: req.avgImportance,
              avgProficiency: skill.avgProficiency,
              gapSeverity: 'high',
              gapType: 'low_coverage'
            });
            highCount++;
          } else if (skill.avgProficiency < 3 && req.avgImportance > 3.5) {
            console.log(`- MEDIUM GAP: Low proficiency (${skill.avgProficiency.toFixed(1)}) but high importance (${req.avgImportance.toFixed(1)})`);
            immediateGaps.push({
              skillId: req.skillId,
              skillName: req.skillName,
              category: req.category,
              demandPercentage: req.demandPercentage,
              coveragePercentage: skill.coveragePercentage,
              avgImportance: req.avgImportance,
              avgProficiency: skill.avgProficiency,
              gapSeverity: 'medium',
              gapType: 'low_proficiency'
            });
          } else {
            console.log(`- NO GAP: Sufficient coverage and proficiency`);
          }
        }
      });
      
      console.log(`\nImmediate Gaps Summary: ${immediateGaps.length} total, ${criticalCount} critical, ${highCount} high`);
      
      // Print skill ID mapping to help debug missing matches
      console.log('\nSkill ID Mapping:');
      Object.keys(skillsMap).slice(0, 10).forEach(id => {
        console.log(`- ID ${id}: ${skillsMap[id].name}`);
      });
      
      console.log('\nProject Skill Requirements IDs:');
      projectRequirements.requirements.slice(0, 10).forEach(req => {
        console.log(`- ID ${req.skillId}: ${req.skillName}`);
      });
      
      // Calculate gap analysis using the original logic
      return originalCalculateSkillsGap(currentSkills, projectRequirements, marketTrends);
    };
    
    // Run analysis with debugging
    const analysis = await skillsGapService.analyzeOrganizationSkillsGap({
      includeAIInsights: false,
      timeRange: '6months'
    });
    
    console.log('\nAnalysis Results:');
    console.log(`Overall Gap Score: ${analysis.gapAnalysis.overallGapScore}`);
    console.log(`Critical Gaps: ${analysis.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'critical').length}`);
    console.log(`High Gaps: ${analysis.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'high').length}`);
    
    // Reset the original function
    skillsGapService.calculateSkillsGap = originalCalculateSkillsGap;
    
    // Check gap calculation parameters
    console.log('\nChecking Gap Calculation Parameters:');
    
    // Check if skills have categories
    const skillsWithCategories = await pool.request().query(`
      SELECT COUNT(*) as count FROM Skills 
      WHERE Category IS NOT NULL AND Category <> ''
    `);
    console.log(`Skills with categories: ${skillsWithCategories.recordset[0].count} out of ${analysis.organizationSkills.totalSkills}`);
    
    // Check if project skills have priorities
    const projectSkillsWithPriority = await pool.request().query(`
      SELECT COUNT(*) as count FROM ProjectSkills 
      WHERE Priority IS NOT NULL AND Priority > 0
    `);
    console.log(`ProjectSkills with priorities: ${projectSkillsWithPriority.recordset[0].count} out of ${await (await pool.request().query('SELECT COUNT(*) as count FROM ProjectSkills')).recordset[0].count}`);
    
    // Check if resource skills have proficiency levels
    const resourceSkillsWithProficiency = await pool.request().query(`
      SELECT COUNT(*) as count FROM ResourceSkills 
      WHERE ProficiencyLevelID IS NOT NULL AND ProficiencyLevelID > 0
    `);
    console.log(`ResourceSkills with proficiency levels: ${resourceSkillsWithProficiency.recordset[0].count} out of ${await (await pool.request().query('SELECT COUNT(*) as count FROM ResourceSkills')).recordset[0].count}`);
    
    // Summary of problems
    console.log('\nPossible Issues:');
    
    if (skillsWithCategories.recordset[0].count === 0) {
      console.log('- Skills missing categories: The gap analysis relies on categories to group and compare skills');
    }
    
    if (projectSkillsWithPriority.recordset[0].count === 0) {
      console.log('- ProjectSkills missing priorities: Without priorities, the system cannot determine how important skills are for projects');
    }
    
    if (resourceSkillsWithProficiency.recordset[0].count === 0) {
      console.log('- ResourceSkills missing proficiency levels: Without proficiency levels, the system cannot determine skill gaps based on expertise');
    }
    
    if (analysis.gapAnalysis.immediateGaps.length === 0) {
      console.log('- No gaps detected: Check the threshold values in calculateSkillsGap function');
    }
    
  } catch (error) {
    console.error('Error debugging skills gap:', error);
  } finally {
    sql.close();
  }
}

// Run the debug function
debugSkillsGap().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});