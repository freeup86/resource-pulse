/**
 * Client Satisfaction API Trace Tool
 * This script traces API calls to the satisfaction endpoints to debug display issues
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const clientSatisfactionController = require('../controllers/clientSatisfactionController');

// Create Express app for testing
const app = express();
app.use(cors());
app.use(morgan('dev')); // Verbose logging
app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Define routes with detailed logging
app.get('/api/satisfaction/predictions', (req, res) => {
  console.log('[TRACE] GET /api/satisfaction/predictions', {
    query: req.query,
    headers: req.headers
  });
  
  // Add response interceptor
  const originalJson = res.json;
  res.json = function(body) {
    console.log('[TRACE] Response:', {
      status: res.statusCode,
      isMockData: body.isMockDataForClient || false,
      usingRealData: body.usingRealData || false,
      count: body.count || 0
    });
    return originalJson.call(this, body);
  };
  
  clientSatisfactionController.getAllSatisfactionPredictions(req, res);
});

// Project details endpoint
app.get('/api/satisfaction/projects/:projectId', (req, res) => {
  console.log('[TRACE] GET /api/satisfaction/projects/:projectId', {
    params: req.params,
    query: req.query
  });
  
  // Add response interceptor
  const originalJson = res.json;
  res.json = function(body) {
    console.log('[TRACE] Response:', {
      status: res.statusCode,
      projectId: body.projectId,
      projectName: body.projectName,
      client: body.client,
      overallSatisfaction: body.overallSatisfaction ? body.overallSatisfaction.score : null
    });
    return originalJson.call(this, body);
  };
  
  clientSatisfactionController.getProjectSatisfactionDetails(req, res);
});

// Project factors endpoint
app.get('/api/satisfaction/projects/:projectId/factors', (req, res) => {
  console.log('[TRACE] GET /api/satisfaction/projects/:projectId/factors', {
    params: req.params
  });
  
  clientSatisfactionController.getProjectSatisfactionFactors(req, res);
});

// Resource pairings endpoint
app.get('/api/satisfaction/projects/:projectId/pairings', (req, res) => {
  console.log('[TRACE] GET /api/satisfaction/projects/:projectId/pairings', {
    params: req.params
  });
  
  clientSatisfactionController.getResourcePairingRecommendations(req, res);
});

// Start the test server
const PORT = 8001; // Use different port to avoid conflicts
app.listen(PORT, () => {
  console.log(`Trace server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/satisfaction/predictions`);
  console.log('Press Ctrl+C to stop');
});