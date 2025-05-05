/**
 * Client Satisfaction API Verification Script
 * 
 * This script helps verify that the client satisfaction API is working correctly
 * by making direct HTTP requests to the API endpoints and validating the responses.
 * 
 * Usage: 
 *   1. Start the backend server with: node server.js
 *   2. In a new terminal, run: node db/verify-satisfaction-api.js
 */
const http = require('http');

// Configuration
const API_HOST = 'localhost';
const API_PORT = 8000;
const API_PATH = '/api/satisfaction/predictions';

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
          reject(new Error(`Failed to parse response: ${error.message}`));
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
 * Verify the client satisfaction API
 */
async function verifyApi() {
  console.log('=== Client Satisfaction API Verification ===');
  console.log(`Testing endpoint: http://${API_HOST}:${API_PORT}${API_PATH}`);
  
  try {
    // Make request to the API
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: API_PATH,
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
      console.error('Response:', response.body);
      return false;
    }
    
    // Check response structure
    if (!response.body || !response.body.predictions) {
      console.error('ERROR: Response does not contain predictions field');
      console.error('Response:', response.body);
      return false;
    }
    
    const { predictions, usingRealData, usingMockData } = response.body;
    
    console.log('\n=== API Response Analysis ===');
    console.log(`Using real data: ${usingRealData === true ? 'YES ✓' : 'NO ✗'}`);
    console.log(`Using mock data: ${usingMockData === true ? 'YES ✓' : 'NO ✗'}`);
    console.log(`Number of predictions: ${predictions.length}`);
    
    // Deep analysis of the first prediction
    if (predictions.length > 0) {
      const firstPrediction = predictions[0];
      console.log('\nFirst prediction:');
      console.log(`- ID: ${firstPrediction.id}`);
      console.log(`- Name: ${firstPrediction.name}`);
      console.log(`- Client: ${firstPrediction.client}`);
      console.log(`- Status: ${firstPrediction.status}`);
      console.log(`- Score: ${firstPrediction.satisfactionScore}`);
      console.log(`- Key Insight: ${firstPrediction.keyInsight}`);
      
      // Check if it's clearly marked as mock data
      const isMockName = firstPrediction.name.includes('[MOCK') || firstPrediction.name.includes('⚠️');
      const isMockClient = firstPrediction.client.includes('[MOCK');
      const isMockInsight = firstPrediction.keyInsight.includes('[MOCK') || firstPrediction.keyInsight.includes('MOCK DATA');
      
      console.log('\nMock data indicators:');
      console.log(`- Mock name: ${isMockName ? 'YES' : 'NO'}`);
      console.log(`- Mock client: ${isMockClient ? 'YES' : 'NO'}`);
      console.log(`- Mock insight: ${isMockInsight ? 'YES' : 'NO'}`);
      
      const isClearlyMock = isMockName || isMockClient || isMockInsight;
      const usesRealData = usingRealData === true && usingMockData !== true;
      
      console.log('\n=== Verification Result ===');
      
      if (usesRealData && !isClearlyMock) {
        console.log('✅ SUCCESS: API is returning REAL project data!');
        console.log('The frontend should now be displaying real project data.');
        return true;
      } else if (usingMockData === true && isClearlyMock) {
        console.log('❌ ISSUE: API is returning MOCK data, but it is properly labeled.');
        console.log('This means the API could not retrieve real data from the database.');
        console.log('Check database connection and ensure Projects table has data.');
        return false;
      } else {
        console.log('❌ ERROR: API response is inconsistent:');
        console.log(`- usingRealData: ${usingRealData}`);
        console.log(`- usingMockData: ${usingMockData}`);
        console.log(`- Clear mock indicators: ${isClearlyMock}`);
        console.log('This suggests an issue with the API implementation.');
        return false;
      }
    } else {
      console.log('⚠️ WARNING: No predictions returned by the API');
      return false;
    }
  } catch (error) {
    console.error('ERROR during verification:', error);
    console.error('Make sure the backend server is running on port 8000');
    return false;
  }
}

// Run the verification
verifyApi()
  .then(success => {
    console.log('\n=== Summary ===');
    if (success) {
      console.log('✅ Client Satisfaction API is working correctly with real data!');
      console.log('The frontend should now show real project satisfaction metrics.');
    } else {
      console.log('❌ API verification failed. See details above.');
      console.log('\nTroubleshooting steps:');
      console.log('1. Make sure the backend server is running on port 8000');
      console.log('2. Check database connection settings in db/config.js');
      console.log('3. Verify Projects table has data with "SELECT COUNT(*) FROM Projects"');
      console.log('4. Check Allocations table with "SELECT COUNT(*) FROM Allocations"');
      console.log('5. Examine server logs for any errors during API requests');
    }
    
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error during verification:', error);
    process.exit(1);
  });