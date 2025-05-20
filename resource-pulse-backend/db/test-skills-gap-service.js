/**
 * Script to test Skills Gap Service
 * This script directly tests the service functions without going through the API
 */
const skillsGapService = require('../services/skillsGapService');
const { poolPromise } = require('./config');

async function testService() {
  try {
    console.log('Testing Skills Gap Service...');
    
    // Test with force fallback
    console.log('\n1. Testing with forceFallback=true:');
    const fallbackResult = await skillsGapService.analyzeOrganizationSkillsGap({
      includeAIInsights: false,
      forceFallback: true
    });
    
    console.log('Fallback result summary:');
    console.log(`- Total skills: ${fallbackResult.organizationSkills.totalSkills}`);
    console.log(`- Total resources: ${fallbackResult.organizationSkills.totalResources}`);
    console.log(`- Overall gap score: ${Math.round(fallbackResult.gapAnalysis.overallGapScore * 100)}%`);
    console.log(`- Critical gaps: ${fallbackResult.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'critical').length}`);
    console.log(`- High gaps: ${fallbackResult.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'high').length}`);
    console.log(`- Using fallback data: ${fallbackResult.usingFallbackData ? 'Yes' : 'No'}`);
    
    // Test with real data
    console.log('\n2. Testing with real data (forceFallback=false):');
    try {
      const realResult = await skillsGapService.analyzeOrganizationSkillsGap({
        includeAIInsights: false
      });
      
      console.log('Real data result summary:');
      console.log(`- Total skills: ${realResult.organizationSkills.totalSkills}`);
      console.log(`- Total resources: ${realResult.organizationSkills.totalResources}`);
      console.log(`- Overall gap score: ${Math.round(realResult.gapAnalysis.overallGapScore * 100)}%`);
      console.log(`- Critical gaps: ${realResult.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'critical').length}`);
      console.log(`- High gaps: ${realResult.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'high').length}`);
      console.log(`- Using fallback data: ${realResult.usingFallbackData ? 'Yes' : 'No'}`);
      
      // Show some of the gap data
      if (realResult.gapAnalysis.immediateGaps.length > 0) {
        console.log('\nSample immediate gaps:');
        realResult.gapAnalysis.immediateGaps.slice(0, 3).forEach(gap => {
          console.log(`- ${gap.skillName} (${gap.category}): ${gap.gapSeverity}, ${gap.gapType}`);
        });
      }
      
      // Show some recommendations
      if (realResult.recommendations.length > 0) {
        console.log('\nSample recommendations:');
        realResult.recommendations.slice(0, 2).forEach(rec => {
          console.log(`- ${rec.description}`);
        });
      }
    } catch (error) {
      console.log('Error with real data:', error);
      console.log('Falling back to sample data is working as expected');
    }
    
    console.log('\nTest completed.');
  } catch (error) {
    console.error('Error testing service:', error);
  } finally {
    // Close the SQL connection
    try {
      const pool = await poolPromise;
      await pool.close();
      console.log('SQL connection closed');
    } catch (closeError) {
      console.error('Error closing SQL connection:', closeError);
    }
    
    // Exit process
    process.exit(0);
  }
}

// Execute the test
testService();