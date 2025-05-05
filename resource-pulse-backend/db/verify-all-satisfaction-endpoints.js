/**
 * Client Satisfaction API Comprehensive Verification Script
 * 
 * This script verifies all client satisfaction API endpoints to ensure
 * they are working correctly and returning real data.
 * 
 * Usage: 
 *   1. Start the backend server with: node server.js
 *   2. In a new terminal, run: node db/verify-all-satisfaction-endpoints.js
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
  '/projects/4/pairings'
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
    
    console.log(`Using real data: ${usingRealData === true ? 'YES ✓' : 'NO ✗'}`);
    console.log(`Using mock data: ${usingMockData === true ? 'YES ✓' : 'NO ✗'}`);
    
    // Specific checks based on endpoint
    if (endpoint === '/predictions') {
      if (!response.body.predictions || !Array.isArray(response.body.predictions)) {
        console.error('ERROR: Response does not contain a valid predictions array');
        return false;
      }
      console.log(`Predictions count: ${response.body.predictions.length}`);
    }
    
    if (endpoint === '/projects/4') {
      if (!response.body.projectId || !response.body.projectName) {
        console.error('ERROR: Response does not contain valid project details');
        return false;
      }
      console.log(`Project name: ${response.body.projectName}`);
      console.log(`Client: ${response.body.client}`);
    }
    
    if (endpoint === '/projects/4/factors') {
      if (!response.body.positiveFactors || !Array.isArray(response.body.positiveFactors)) {
        console.error('ERROR: Response does not contain valid positive factors');
        return false;
      }
      console.log(`Positive factors: ${response.body.positiveFactors.length}`);
      console.log(`Negative factors: ${response.body.negativeFactors.length}`);
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
    
    // Check for mock data indicators in key fields
    const hasAnyMockIndicator = JSON.stringify(response.body).includes('[MOCK') || 
                                 JSON.stringify(response.body).includes('⚠️');
    
    if (usingRealData === true && !hasAnyMockIndicator) {
      console.log('✅ SUCCESS: API is returning REAL data!');
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
  console.log('=== Client Satisfaction API Comprehensive Verification ===');
  
  const results = {};
  
  // Test each endpoint
  for (const endpoint of ENDPOINTS) {
    results[endpoint] = await verifyEndpoint(endpoint);
  }
  
  // Summarize results
  console.log('\n=== VERIFICATION SUMMARY ===');
  let allPassed = true;
  
  for (const endpoint of ENDPOINTS) {
    const status = results[endpoint] ? '✅ PASSED' : '❌ FAILED';
    console.log(`${API_BASE_PATH}${endpoint}: ${status}`);
    if (!results[endpoint]) allPassed = false;
  }
  
  console.log('\n=== OVERALL RESULT ===');
  if (allPassed) {
    console.log('✅ SUCCESS: All client satisfaction API endpoints are working with real data!');
    console.log('The frontend should now be displaying real client satisfaction data.');
  } else {
    console.log('❌ ISSUE: Some endpoints are not returning real data or are failing.');
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