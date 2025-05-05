/**
 * Direct Client Satisfaction Controller Test
 * Isolated execution of client satisfaction controller to identify issues
 */
const { poolPromise } = require('./config');
const clientSatisfactionController = require('../controllers/clientSatisfactionController');

// Mock Express req/res objects
function createMockReq(params = {}, query = {}) {
  return { params, query };
}

function createMockRes() {
  const res = {
    status: function(code) {
      this.statusCode = code;
      console.log(`STATUS: ${code}`);
      return this;
    },
    json: function(data) {
      this.responseData = data;
      console.log('RESPONSE:', {
        usingMockData: data.usingMockData || false,
        usingRealData: data.usingRealData || false,
        recordCount: data.predictions ? data.predictions.length : 0
      });
      
      // Check for mock data flags
      if (data.predictions && data.predictions.length > 0) {
        const firstItem = data.predictions[0];
        console.log('First prediction:', {
          id: firstItem.id,
          name: firstItem.name,
          client: firstItem.client,
          score: firstItem.satisfactionScore,
          isMock: firstItem.name.includes('[MOCK]') || (firstItem.keyInsight && firstItem.keyInsight.includes('MOCK DATA'))
        });
      }
      
      return this;
    },
    responseData: null,
    statusCode: 200
  };
  return res;
}

async function testControllerDirectly() {
  try {
    console.log('=== TESTING CLIENT SATISFACTION CONTROLLER DIRECTLY ===');
    
    // Simple test request
    const req = createMockReq({}, { limit: 100 });
    const res = createMockRes();
    
    console.log('Calling getAllSatisfactionPredictions directly...');
    
    // Call controller function
    await clientSatisfactionController.getAllSatisfactionPredictions(req, res);
    
    // Check response
    console.log('\nResponse status:', res.statusCode);
    console.log('mockData?', res.responseData.usingMockData || false);
    console.log('realData?', res.responseData.usingRealData || false);
    console.log('count:', res.responseData.count);
    
    // Examine one prediction
    if (res.responseData.predictions && res.responseData.predictions.length > 0) {
      const firstPrediction = res.responseData.predictions[0];
      console.log('\nFirst prediction details:');
      console.log('- Name:', firstPrediction.name);
      console.log('- Client:', firstPrediction.client);
      console.log('- Status:', firstPrediction.status);
      console.log('- Score:', firstPrediction.satisfactionScore);
      console.log('- Key Insight:', firstPrediction.keyInsight);
    }
    
    return { 
      success: true, 
      usedMockData: res.responseData.usingMockData || false,
      hasRealData: res.responseData.predictions && res.responseData.predictions.length > 0
    };
  } catch (error) {
    console.error('Error in test:', error);
    return { success: false, error: error.message };
  }
}

// Execute the test
testControllerDirectly()
  .then(result => {
    console.log('\nTest result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });