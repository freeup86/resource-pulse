const express = require('express');
const router = express.Router({ mergeParams: true });
const wbsController = require('../controllers/wbsController');
const { authenticate, checkRole } = require('../middleware/auth');

// Phases
router.get('/phases', authenticate, wbsController.getPhases);
router.post('/phases', authenticate, checkRole(['Admin', 'ProjectManager']), wbsController.createPhase);
router.put('/phases/:id', authenticate, checkRole(['Admin', 'ProjectManager']), wbsController.updatePhase);
router.delete('/phases/:id', authenticate, checkRole(['Admin', 'ProjectManager']), wbsController.deletePhase);

// Tasks
router.get('/tasks', authenticate, wbsController.getTasks);
router.post('/tasks', authenticate, checkRole(['Admin', 'ProjectManager']), wbsController.createTask);
router.put('/tasks/:id', authenticate, checkRole(['Admin', 'ProjectManager', 'User']), wbsController.updateTask); // Users can update tasks assigned to them (simplified for now)
router.delete('/tasks/:id', authenticate, checkRole(['Admin', 'ProjectManager']), wbsController.deleteTask);

module.exports = router;
