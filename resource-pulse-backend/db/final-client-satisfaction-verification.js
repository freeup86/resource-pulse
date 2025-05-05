/**
 * Final Client Satisfaction API Comprehensive Verification Script
 * 
 * This script verifies all client satisfaction API endpoints to ensure
 * they are working correctly and returning real data, including the new 
 * clients endpoint.
 * 
 * Usage: 
 *   1. Start the backend server with: node server.js
 *   2. In a new terminal, run: node db/final-client-satisfaction-verification.js
 */
const http = require('http');

// Configuration
const API_HOST = 'localhost';
const API_PORT = 8000;
const API_BASE_PATH = '/api/satisfaction';

// List of endpoints to check
const ENDPOINTS = [
  '/predictions',
  '/projects/4',
  '/projects/4/factors',
  '/projects/4/pairings',
  '/clients',
  '/at-risk'
];

/**
 * Make a simple HTTP GET request
 */
function httpGet(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonData
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}\nRaw response: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

/**
 * Verify a single API endpoint
 */
async function verifyEndpoint(endpoint) {
  const fullPath = `${API_BASE_PATH}${endpoint}`;
  console.log(`\n===== ${fullPath} =====`);
  
  try {
    // Make request to the API
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: fullPath,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    console.log('Sending request...');
    const response = await httpGet(options);
    
    console.log(`Response status: ${response.statusCode}`);
    
    // Check if we got a successful response
    if (response.statusCode !== 200) {
      console.error('ERROR: API returned non-200 status code');
      console.error('Response:', JSON.stringify(response.body, null, 2));
      return false;
    }
    
    // Check basic response structure
    if (!response.body) {
      console.error('ERROR: Response does not contain a valid body');
      console.error('Response:', response.body);
      return false;
    }
    
    const { usingRealData, usingMockData } = response.body;
    
    if (usingRealData !== undefined) {
      console.log(`Using real data: ${usingRealData === true ? 'YES ✓' : 'NO ✗'}`);
    }
    
    if (usingMockData !== undefined) {
      console.log(`Using mock data: ${usingMockData === true ? 'YES ✓' : 'NO ✗'}`);
    }
    
    // Specific checks based on endpoint
    if (endpoint === '/predictions') {
      if (!response.body.predictions || !Array.isArray(response.body.predictions)) {
        console.error('ERROR: Response does not contain a valid predictions array');
        return false;
      }
      console.log(`Predictions count: ${response.body.predictions.length}`);
      
      // Check a sample prediction
      if (response.body.predictions.length > 0) {
        const sample = response.body.predictions[0];
        console.log(`Sample prediction: ID ${sample.id} - ${sample.name}`);
      }
    }
    
    if (endpoint === '/projects/4') {
      if (!response.body.projectId || !response.body.projectName) {
        console.error('ERROR: Response does not contain valid project details');
        return false;
      }
      console.log(`Project name: ${response.body.projectName}`);
      console.log(`Client: ${response.body.client}`);
      console.log(`Overall satisfaction score: ${response.body.overallSatisfaction?.score || 'N/A'}`);
      
      if (response.body.resourcePredictions) {
        console.log(`Number of resource predictions: ${response.body.resourcePredictions.length}`);
      }
    }
    
    if (endpoint === '/projects/4/factors') {
      if (!response.body.positiveFactors || !Array.isArray(response.body.positiveFactors)) {
        console.error('ERROR: Response does not contain valid positive factors');
        return false;
      }
      console.log(`Positive factors: ${response.body.positiveFactors.length}`);
      console.log(`Negative factors: ${response.body.negativeFactors?.length || 0}`);
      
      // Show a sample factor if available
      if (response.body.positiveFactors.length > 0) {
        console.log(`Sample factor: ${response.body.positiveFactors[0].factor}`);
      }
    }
    
    if (endpoint === '/projects/4/pairings') {
      if (!response.body.pairings || !Array.isArray(response.body.pairings)) {
        console.error('ERROR: Response does not contain valid pairings array');
        return false;
      }
      console.log(`Project name: ${response.body.projectName}`);
      console.log(`Pairings count: ${response.body.pairings.length}`);
      console.log(`Message: ${response.body.message}`);
    }
    
    if (endpoint === '/clients') {
      if (!response.body.clients || !Array.isArray(response.body.clients)) {
        console.error('ERROR: Response does not contain valid clients array');
        return false;
      }
      console.log(`Clients count: ${response.body.clients.length}`);
      
      // Show sample client if available
      if (response.body.clients.length > 0) {
        const sample = response.body.clients[0];
        console.log(`Sample client: ${sample.clientName} (${sample.projectCount} projects)`);
      }
    }
    
    if (endpoint === '/at-risk') {
      if (!response.body.clients || !Array.isArray(response.body.clients)) {
        console.error('ERROR: Response does not contain valid at-risk clients array');
        return false;
      }
      console.log(`At-risk clients count: ${response.body.clients.length}`);
      console.log(`Message: ${response.body.message}`);
      
      // Show sample at-risk client if available
      if (response.body.clients.length > 0) {
        const sample = response.body.clients[0];
        console.log(`Sample at-risk client: ${sample.clientName} (Risk: ${sample.riskLevel})`);
      }
    }
    
    // Check for mock data indicators in key fields
    const responseStr = JSON.stringify(response.body);
    const hasAnyMockIndicator = responseStr.includes('[MOCK') || responseStr.includes('⚠️');
    
    if (usingRealData === true && !hasAnyMockIndicator) {
      console.log('✅ SUCCESS: API is returning REAL data!');
      return true;
    } else if (usingRealData === undefined) {
      // For endpoints that don't include the usingRealData flag
      console.log('✅ SUCCESS: API returned valid data');
      return true;
    } else if (usingMockData === true && hasAnyMockIndicator) {
      console.log('⚠️ WARNING: API is returning MOCK data, but it is properly labeled.');
      return false;
    } else {
      console.log('❌ ERROR: API response is inconsistent:');
      console.log(`- usingRealData: ${usingRealData}`);
      console.log(`- usingMockData: ${usingMockData}`);
      console.log(`- Has mock indicators: ${hasAnyMockIndicator}`);
      return false;
    }
  } catch (error) {
    console.error('ERROR during verification:', error);
    return false;
  }
}

/**
 * Run verification for all endpoints
 */
async function verifyAllEndpoints() {
  console.log('=== Client Satisfaction API Final Comprehensive Verification ===');
  
  const results = {};
  
  // Test each endpoint
  for (const endpoint of ENDPOINTS) {
    results[endpoint] = await verifyEndpoint(endpoint);
  }
  
  // Summarize results
  console.log('\n=== VERIFICATION SUMMARY ===');
  let allPassed = true;
  let passedCount = 0;
  
  for (const endpoint of ENDPOINTS) {
    const status = results[endpoint] ? '✅ PASSED' : '❌ FAILED';
    console.log(`${API_BASE_PATH}${endpoint}: ${status}`);
    if (results[endpoint]) passedCount++;
    else allPassed = false;
  }
  
  console.log(`\nPassed ${passedCount} out of ${ENDPOINTS.length} endpoints`);
  
  console.log('\n=== OVERALL RESULT ===');
  if (allPassed) {
    console.log('✅ SUCCESS: All client satisfaction API endpoints are working correctly!');
    console.log('The frontend should now be displaying real client satisfaction data.');
  } else if (passedCount > ENDPOINTS.length / 2) {
    console.log('⚠️ PARTIAL SUCCESS: Most endpoints are working, but some issues remain.');
    console.log('Please review the individual test results above for more details.');
  } else {
    console.log('❌ ISSUE: Multiple endpoints are not returning proper data.');
    console.log('Please review the individual test results above for more details.');
  }
  
  return allPassed;
}

// Run the verification
verifyAllEndpoints()
  .then(success => {
    console.log('\n=== VERIFICATION COMPLETED ===');
    if (!success) {
      console.log('\nTroubleshooting steps:');
      console.log('1. Make sure the backend server is running on port 8000');
      console.log('2. Check database connection settings in db/config.js');
      console.log('3. Verify Projects table has data with "SELECT COUNT(*) FROM Projects"');
      console.log('4. Examine server logs for any errors during API requests');
      console.log('5. Check the controller implementation for each endpoint');
    }
    
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error during verification:', error);
    process.exit(1);
  });