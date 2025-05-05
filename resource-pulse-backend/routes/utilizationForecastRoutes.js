/**
 * Utilization Forecast Routes
 * Defines API routes for utilization forecasting functionality
 */
const express = require('express');
const router = express.Router();
const utilizationForecastController = require('../controllers/utilizationForecastController');

// Organization-wide forecast
router.get('/organization', utilizationForecastController.generateOrganizationForecast);

// Resource-specific forecast
router.get('/resources/:resourceId', utilizationForecastController.generateResourceForecast);

// Bottleneck detection
router.get('/bottlenecks', utilizationForecastController.detectBottlenecks);

// Bench time prediction
router.get('/bench-time', utilizationForecastController.predictBenchTime);

// Allocation suggestions
router.get('/allocation-suggestions', utilizationForecastController.getAllocationSuggestions);

module.exports = router;