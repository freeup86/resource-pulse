/**
 * Test Financial Optimization Controller
 * This script tests the financial optimization controller directly
 */
const financialController = require('../controllers/financialOptimizationController-fixed');

// Mock Express request and response objects
const mockReq = {
  query: {
    startDate: '2025-05-01',
    endDate: '2025-08-01',
    optimizationTarget: 'profit'
  },
  body: {}
};

const mockRes = {
  json: (data) => {
    console.log('=== Response Data ===');
    console.log(JSON.stringify(data, null, 2));
  },
  status: (code) => ({
    json: (data) => {
      console.log(`=== Error Response (${code}) ===`);
      console.log(JSON.stringify(data, null, 2));
    }
  }),
  set: (key, value) => {
    console.log(`Setting response header: ${key}=${value}`);
  }
};

// Test cost-revenue analysis
console.log('\n=== Testing Cost Revenue Analysis ===');
financialController.getCostRevenueAnalysis(mockReq, mockRes)
  .then(() => {
    console.log('Test completed successfully');
  })
  .catch(err => {
    console.error('Test failed with error:', err);
  });