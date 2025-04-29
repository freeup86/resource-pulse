// src/routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

// GET /api/roles - Get all roles
router.get('/', roleController.getAllRoles);

// POST /api/roles - Create a new role
router.post('/', roleController.createRole);

// GET /api/roles/:id - Get role by ID
router.get('/:id', roleController.getRoleById);

module.exports = router;