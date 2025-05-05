// test-ai-recommendations.js
require('dotenv').config();
const { generateSkillRecommendations } = require('../services/aiRecommendationService');

/**
 * Test script for AI recommendation service
 * 
 * This script tests both the basic recommendation generation
 * and the personalized recommendations with user context
 */

// Mock project ID for testing - update to a valid ID in your database
const TEST_PROJECT_ID = 1;

// Test without personalization
async function testBasicRecommendations() {
  console.log('=== Testing Basic AI Recommendations ===');
  
  try {
    console.log(`Generating recommendations for project ${TEST_PROJECT_ID}...`);
    
    const startTime = Date.now();
    const recommendations = await generateSkillRecommendations(TEST_PROJECT_ID);
    const duration = Date.now() - startTime;
    
    console.log(`Generated ${recommendations.length} recommendations in ${duration}ms`);
    
    if (recommendations.length > 0) {
      console.log('\nSample recommendation:');
      console.log(JSON.stringify(recommendations[0], null, 2));
    } else {
      console.log('No recommendations were generated. Check if the project has skills assigned.');
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error in basic recommendations test:', error);
    throw error;
  }
}

// Test with personalization
async function testPersonalizedRecommendations() {
  console.log('\n=== Testing Personalized AI Recommendations ===');
  
  // Test with different user contexts
  const userContexts = [
    {
      name: 'Beginner with limited time',
      context: {
        experienceLevel: 'beginner',
        timeAvailable: 10 // Only 10 hours available
      }
    },
    {
      name: 'Advanced user with no budget',
      context: {
        experienceLevel: 'advanced',
        budget: 0 // Free resources only
      }
    },
    {
      name: 'Visual learner with moderate budget',
      context: {
        preferredLearningStyle: 'visual',
        budget: 50,
        experienceLevel: 'intermediate'
      }
    }
  ];
  
  try {
    // Test each user context
    for (const test of userContexts) {
      console.log(`\nTesting: ${test.name}`);
      console.log('User context:', test.context);
      
      const startTime = Date.now();
      const recommendations = await generateSkillRecommendations(TEST_PROJECT_ID, {
        forceRefresh: true, // Force refresh to get new recommendations
        userContext: test.context
      });
      const duration = Date.now() - startTime;
      
      console.log(`Generated ${recommendations.length} personalized recommendations in ${duration}ms`);
      
      if (recommendations.length > 0) {
        console.log('\nSample personalized recommendation:');
        console.log(JSON.stringify(recommendations[0], null, 2));
        
        // Verify that constraints were respected
        if (test.context.budget !== undefined) {
          const overBudget = recommendations.filter(r => r.cost > test.context.budget);
          console.log(`Recommendations exceeding budget constraint: ${overBudget.length}`);
        }
        
        if (test.context.timeAvailable !== undefined) {
          const overTime = recommendations.filter(r => r.estimatedTimeHours > test.context.timeAvailable);
          console.log(`Recommendations exceeding time constraint: ${overTime.length}`);
        }
      } else {
        console.log('No recommendations were generated.');
      }
    }
  } catch (error) {
    console.error('Error in personalized recommendations test:', error);
    throw error;
  }
}

// Test rate limiting functionality
async function testRateLimiting() {
  console.log('\n=== Testing Rate Limiting Functionality ===');
  
  try {
    // Create multiple parallel requests to test rate limiting
    console.log('Sending multiple concurrent requests to test rate limiting...');
    
    const requestCount = 10; // Number of concurrent requests to generate
    const startTime = Date.now();
    
    // Generate a promise for each request
    const promises = Array(requestCount).fill().map((_, index) => {
      // Force refresh to avoid caching
      return generateSkillRecommendations(TEST_PROJECT_ID, {
        forceRefresh: true,
        userContext: {
          experienceLevel: index % 2 === 0 ? 'beginner' : 'advanced', // Mix up contexts
          budget: (index + 1) * 25 // Varied budgets
        }
      });
    });
    
    // Wait for all requests to complete
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    console.log(`Completed ${requestCount} concurrent requests in ${duration}ms`);
    console.log(`Average time per request: ${(duration / requestCount).toFixed(2)}ms`);
    
    // Check that we got valid results for all requests
    const validResults = results.filter(r => Array.isArray(r) && r.length > 0);
    console.log(`Got valid recommendations for ${validResults.length}/${requestCount} requests`);
    
    return results;
  } catch (error) {
    console.error('Error in rate limiting test:', error);
    throw error;
  }
}

// Run all tests
async function runTests() {
  try {
    await testBasicRecommendations();
    await testPersonalizedRecommendations();
    await testRateLimiting();
    
    console.log('\n=== All AI Recommendation Tests Completed ===');
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

// Execute tests if this file is run directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testBasicRecommendations,
  testPersonalizedRecommendations,
  testRateLimiting,
  runTests
};