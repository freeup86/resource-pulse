const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticate, checkRole } = require('../middleware/auth');

// Get all requests (PM sees own, RM sees all)
router.get('/', authenticate, requestController.getRequests);

// Create request (PM only)
router.post('/', authenticate, checkRole(['Admin', 'ProjectManager']), requestController.createRequest);

// Update status (RM only)
router.patch('/:id/status', authenticate, checkRole(['Admin', 'ResourceManager']), requestController.updateStatus);

module.exports = router;
