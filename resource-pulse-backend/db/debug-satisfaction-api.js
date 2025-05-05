/**
 * Debug Client Satisfaction API
 * Direct test of the API endpoints
 */
const http = require('http');
const { poolPromise } = require('../db/config');

// Execute simple request to API
async function testApi() {
  console.log('Testing client satisfaction API...');
  
  try {
    // First connect to DB and verify projects exist
    const pool = await poolPromise;
    console.log('Connected to database successfully');
    
    const countResult = await pool.request().query('SELECT COUNT(*) as count FROM Projects');
    const projectCount = countResult.recordset[0].count;
    console.log(`Database has ${projectCount} projects`);
    
    // Make HTTP request to satisfaction API
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/satisfaction/predictions',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    console.log('Making API request to:', `http://${options.hostname}:${options.port}${options.path}`);
    
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            console.log('---- API RESPONSE ----');
            console.log(`usingMockData: ${parsedData.usingMockData || false}`);
            console.log(`usingRealData: ${parsedData.usingRealData || false}`);
            console.log(`# of predictions: ${parsedData.predictions ? parsedData.predictions.length : 0}`);
            
            if (parsedData.predictions && parsedData.predictions.length > 0) {
              console.log('\nFirst prediction:');
              console.log(`- Project: ${parsedData.predictions[0].name}`);
              console.log(`- Client: ${parsedData.predictions[0].client}`);
              console.log(`- Score: ${parsedData.predictions[0].satisfactionScore}`);
              console.log(`- Insight: ${parsedData.predictions[0].keyInsight}`);
              
              // Check if project names contain [MOCK]
              const hasMockTag = parsedData.predictions.some(p => 
                p.name && p.name.includes('[MOCK]')
              );
              
              console.log(`\nPredictions contain [MOCK] tag: ${hasMockTag}`);
            }
            
            resolve({
              success: true,
              usingMockData: parsedData.usingMockData || false,
              usingRealData: parsedData.usingRealData || false,
              count: parsedData.predictions ? parsedData.predictions.length : 0
            });
          } catch (e) {
            console.error('Error parsing response data:', e);
            reject(e);
          }
        });
      });
      
      req.on('error', (e) => {
        console.error(`ERROR: ${e.message}`);
        reject(e);
      });
      
      req.end();
    });
  } catch (error) {
    console.error('Error testing API:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testApi()
  .then(result => {
    console.log('\nTest completed:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });