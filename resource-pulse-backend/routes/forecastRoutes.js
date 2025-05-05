const express = require('express');
const router = express.Router();
const { 
  getUtilizationForecast, 
  getBottlenecks, 
  getWorkloadBalancing 
} = require('../controllers/forecastController');

// GET utilization forecast
router.get('/utilization', getUtilizationForecast);

// GET bottlenecks detection
router.get('/bottlenecks', getBottlenecks);

// GET workload balancing recommendations
router.get('/workload-balancing', getWorkloadBalancing);

module.exports = router;