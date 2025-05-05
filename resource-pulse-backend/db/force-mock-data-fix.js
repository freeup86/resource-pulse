/**
 * Direct Mock Data Fix
 * 
 * This script forcibly modifies the frontend API response to clearly indicate when mock data is used,
 * even if the server has cached an older version of the controller.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create a proxy server to intercept and modify the API response
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configuration
const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 8000;
const PROXY_PORT = 8001;

console.log('=== Client Satisfaction Mock Data Fix ===');

// Intercept requests to the satisfaction API
app.all('/api/satisfaction*', async (req, res) => {
  try {
    console.log(`Intercepting request to: ${req.url}`);
    
    // Forward the request to the real backend
    const options = {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${BACKEND_HOST}:${BACKEND_PORT}`
      }
    };
    
    // Remove some problematic headers
    delete options.headers['content-length'];
    
    // Forward the request and get the response
    const proxyReq = http.request(options, (proxyRes) => {
      let responseData = '';
      
      proxyRes.on('data', (chunk) => {
        responseData += chunk;
      });
      
      proxyRes.on('end', () => {
        try {
          // Process the response
          const contentType = proxyRes.headers['content-type'] || '';
          
          if (contentType.includes('application/json')) {
            // Try to parse the JSON response
            const data = JSON.parse(responseData);
            
            // Check if this is mock data without clear indicators
            if (data.usingMockData === true || !data.usingRealData) {
              console.log('Detected mock data without clear indicators, applying fix...');
              
              // Update the response to clearly indicate mock data
              data.mockDataDetected = true;
              data.usingRealData = false;
              data.isMockDataForClient = true;
              data.mockDataReason = 'Mock data detected by verification proxy';
              data.message = '⚠️ MOCK DATA DETECTED - Using sample data for demonstration';
              
              // Add clear indicators to the mock projects
              if (data.predictions && Array.isArray(data.predictions)) {
                data.predictions = data.predictions.map(project => ({
                  ...project,
                  name: project.name.includes('[MOCK]') ? project.name : `⚠️ ${project.name} [MOCK DATA]`,
                  client: project.client.includes('[MOCK]') ? project.client : `[MOCK] ${project.client}`,
                  keyInsight: project.keyInsight.includes('[MOCK]') ? project.keyInsight : `[MOCK DATA] ${project.keyInsight}`
                }));
              }
              
              // Send the modified response
              res.set('Content-Type', 'application/json');
              res.status(proxyRes.statusCode).send(JSON.stringify(data));
              console.log('Modified response sent to client');
            } else {
              // Real data, pass through unchanged
              console.log('Real data detected, passing through unchanged');
              res.set(proxyRes.headers);
              res.status(proxyRes.statusCode).send(responseData);
            }
          } else {
            // Non-JSON response, pass through unchanged
            res.set(proxyRes.headers);
            res.status(proxyRes.statusCode).send(responseData);
          }
        } catch (error) {
          console.error('Error processing response:', error);
          res.set(proxyRes.headers);
          res.status(proxyRes.statusCode).send(responseData);
        }
      });
    });
    
    // Handle errors
    proxyReq.on('error', (error) => {
      console.error('Proxy request error:', error);
      res.status(500).json({
        error: 'Proxy error',
        message: error.message
      });
    });
    
    // If the original request had a body, forward it
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      proxyReq.write(JSON.stringify(req.body));
    }
    
    proxyReq.end();
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Forward all other requests directly to backend
app.all('*', (req, res) => {
  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  
  // Remove some problematic headers
  delete options.headers['content-length'];
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.set(proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    proxyReq.write(JSON.stringify(req.body));
  }
  
  proxyReq.on('error', (error) => {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error: ' + error.message);
  });
  
  proxyReq.end();
});

// Start the proxy server
const server = app.listen(PROXY_PORT, () => {
  console.log(`\n🚀 Mock Data Fix Proxy running on port ${PROXY_PORT}`);
  console.log(`\n1. Make sure your main API server is running on port ${BACKEND_PORT}`);
  console.log(`2. Update your frontend to point to http://${BACKEND_HOST}:${PROXY_PORT} instead of ${BACKEND_PORT}`);
  console.log('\nThis proxy will automatically detect mock data and add clear visual indicators');
  console.log('Press Ctrl+C to stop the proxy\n');
  
  // Create test URL for verification
  const testUrl = `http://${BACKEND_HOST}:${PROXY_PORT}/api/satisfaction/predictions`;
  console.log(`Test the proxy with: curl ${testUrl}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down proxy...');
  server.close(() => {
    console.log('Proxy server stopped');
    process.exit(0);
  });
});