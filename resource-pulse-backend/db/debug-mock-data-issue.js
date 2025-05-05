/**
 * Special Debug Script for Mock Data Issue
 * This script bypasses the normal API routing to directly test the controller
 */
const fs = require('fs');
const path = require('path');
const { poolPromise } = require('../db/config');

// Check controller file for proper mock data
const controllerPath = path.join(__dirname, '..', 'controllers', 'clientSatisfactionController.js');

async function debugSatisfactionApi() {
  console.log('=== Debugging Mock Data Issue ===');
  
  try {
    // First, verify the controller file was properly updated
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    
    // Check for our warning symbol in mock data
    const hasWarningSymbol = controllerContent.includes('⚠️');
    console.log(`Controller includes warning symbols: ${hasWarningSymbol ? 'YES' : 'NO'}`);
    
    // Check for enhanced mock data response
    const hasEnhancedMockResponse = controllerContent.includes('mockDataReason');
    console.log(`Controller includes enhanced mock response: ${hasEnhancedMockResponse ? 'YES' : 'NO'}`);
    
    // Create a clean instance of the controller
    console.log('\nCleaning module cache to ensure fresh controller instance...');
    delete require.cache[require.resolve('../controllers/clientSatisfactionController')];
    const controller = require('../controllers/clientSatisfactionController');
    
    // Mock req/res objects
    const mockReq = { 
      query: {}, 
      originalUrl: '/api/satisfaction/predictions',
      headers: {}
    };
    
    let responseData = null;
    const mockRes = {
      json: function(data) {
        responseData = data;
        console.log('Controller response:', {
          usingMockData: data.usingMockData || false,
          usingRealData: data.usingRealData || false,
          isMockDataForClient: data.isMockDataForClient || false,
          predictions: data.predictions ? data.predictions.length : 0
        });
        return this;
      },
      status: function(code) {
        console.log(`Response status: ${code}`);
        return this;
      }
    };
    
    // Test database connection directly
    console.log('\nVerifying database connection...');
    try {
      const pool = await poolPromise;
      console.log('Database connection established');
      
      const projectsResult = await pool.request().query('SELECT COUNT(*) as count FROM Projects');
      const projectCount = projectsResult.recordset[0].count;
      console.log(`Projects table has ${projectCount} rows`);
      
      const allocationsResult = await pool.request().query('SELECT COUNT(*) as count FROM Allocations');
      const allocationCount = allocationsResult.recordset[0].count;
      console.log(`Allocations table has ${allocationCount} rows`);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
    }
    
    // Create a special version of useMockProjectsData to intercept calls
    let mockDataCalled = false;
    const originalUseMockProjectsData = controller.useMockProjectsData;
    
    if (typeof originalUseMockProjectsData === 'function') {
      console.log('\nIntercepting useMockProjectsData function...');
      // Note: This won't work if useMockProjectsData is not exported
      controller.useMockProjectsData = function(req, res) {
        console.log('*** useMockProjectsData was called ***');
        mockDataCalled = true;
        return originalUseMockProjectsData(req, res);
      };
    } else {
      console.log('\nWARNING: useMockProjectsData is not directly accessible');
    }
    
    // Run the controller function
    console.log('\nExecuting controller function directly...');
    await controller.getAllSatisfactionPredictions(mockReq, mockRes);
    
    // Analyze the result
    console.log('\n=== Result Analysis ===');
    console.log(`Mock data function called: ${mockDataCalled ? 'YES' : 'NO'}`);
    
    if (responseData && responseData.predictions && responseData.predictions.length > 0) {
      const firstItem = responseData.predictions[0];
      
      console.log('\nFirst prediction:');
      console.log(`- Name: ${firstItem.name}`);
      console.log(`- Client: ${firstItem.client}`);
      console.log(`- Contains warning symbol: ${firstItem.name.includes('⚠️') ? 'YES' : 'NO'}`);
      console.log(`- Contains [MOCK] tag: ${firstItem.name.includes('[MOCK') ? 'YES' : 'NO'}`);
      console.log(`- Client has [MOCK] prefix: ${firstItem.client.includes('[MOCK') ? 'YES' : 'NO'}`);
    }
    
    // Additional checks
    console.log('\nChecking for possible route issues...');
    
    // Check if clientSatisfactionRoutes.js is importing the controller correctly
    const routesPath = path.join(__dirname, '..', 'routes', 'clientSatisfactionRoutes.js');
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    
    // Look for controller import
    const importMatch = routesContent.match(/require\(['"]\.\.\/controllers\/clientSatisfactionController['"]\)/);
    console.log(`Routes file imports controller correctly: ${importMatch ? 'YES' : 'NO'}`);
    
    // Check if server.js is using the routes correctly
    const serverPath = path.join(__dirname, '..', 'server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Look for routes usage
    const routesUsageMatch = serverContent.match(/app\.use\(['"]\/api\/satisfaction['"]\s*,\s*clientSatisfactionRoutes\)/);
    console.log(`Server uses satisfaction routes correctly: ${routesUsageMatch ? 'YES' : 'NO'}`);
    
    return {
      success: true,
      mockDataCalled,
      hasWarningSymbol,
      hasEnhancedMockResponse,
      isProbablyRouteIssue: !mockDataCalled && responseData && responseData.usingRealData
    };
  } catch (error) {
    console.error('Debug error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run diagnostic
debugSatisfactionApi()
  .then(result => {
    console.log('\n=== Diagnosis ===');
    
    if (result.success) {
      if (result.isProbablyRouteIssue) {
        console.log('DIAGNOSIS: The controller code is working properly, but it seems that the API routes are not using the updated controller.');
        console.log('\nPossible solutions:');
        console.log('1. Restart the backend server completely to ensure changes are loaded');
        console.log('2. Check for any caching mechanisms that might be preventing the controller update from being used');
        console.log('3. Ensure there are no duplicate controller files or route definitions');
      } else if (!result.hasWarningSymbol || !result.hasEnhancedMockResponse) {
        console.log('DIAGNOSIS: The controller file was not properly updated with the mock data changes.');
        console.log('\nPossible solutions:');
        console.log('1. Re-apply the changes to add warning symbols and enhanced mock response');
        console.log('2. Check if there are file permission issues preventing updates');
      } else if (result.mockDataCalled) {
        console.log('DIAGNOSIS: The mock data function is being called, which means the database query is failing.');
        console.log('\nPossible solutions:');
        console.log('1. Check database connection settings');
        console.log('2. Verify the Projects table has data');
        console.log('3. Look for errors in the controller logic that might be triggering the fallback');
      } else {
        console.log('DIAGNOSIS: The issue is unclear; multiple factors might be contributing.');
      }
    } else {
      console.log('DIAGNOSIS: Could not determine the issue due to an error in the debug script.');
    }
    
    console.log('\nNext steps:');
    console.log('1. Try a complete server restart: stop and restart the Node.js process');
    console.log('2. Apply a more direct fix by modifying `useMockProjectsData` to unconditionally include clear mock indicators');
    
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });