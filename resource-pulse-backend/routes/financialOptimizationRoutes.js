/**
 * Financial Optimization Routes
 * Defines API routes for financial optimization functionality
 */
const express = require('express');
const router = express.Router();
const financialOptimizationController = require('../controllers/financialOptimizationController-fixed');

// Generate optimized allocations - old endpoint
router.get('/optimized-allocations', financialOptimizationController.generateOptimizedAllocations);

// Get cost vs revenue analysis
router.get('/cost-revenue', financialOptimizationController.getCostRevenueAnalysis);

// Get optimization recommendations
router.get('/optimization', financialOptimizationController.generateOptimizedAllocations);

// Apply optimization recommendations
router.post('/optimization/apply', financialOptimizationController.applyOptimizations);

module.exports = router;