const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');
const { authenticate, checkRole } = require('../middleware/auth');

// Public (authenticated) routes
router.get('/', authenticate, currencyController.getExchangeRates);

// Admin only routes
router.post('/', authenticate, checkRole(['Admin']), currencyController.upsertExchangeRate);

module.exports = router;
