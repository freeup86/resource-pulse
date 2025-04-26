const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

// GET /api/resources - Get all resources
router.get('/', resourceController.getAllResources);

// GET /api/resources/:id - Get a single resource
router.get('/:id', resourceController.getResourceById);

// POST /api/resources - Create a new resource
router.post('/', resourceController.createResource);

// PUT /api/resources/:id - Update a resource
router.put('/:id', resourceController.updateResource);

// DELETE /api/resources/:id - Delete a resource
router.delete('/:id', resourceController.deleteResource);

module.exports = router;