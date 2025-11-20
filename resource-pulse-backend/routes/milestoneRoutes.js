const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access projectId from parent route
const milestoneController = require('../controllers/milestoneController');
const { authenticate, checkRole } = require('../middleware/auth');

// Get milestones
router.get('/', authenticate, milestoneController.getMilestones);

// Create milestone (Admin/PM)
router.post('/', authenticate, checkRole(['Admin', 'ProjectManager']), milestoneController.createMilestone);

// Update milestone (Admin/PM)
router.patch('/:id', authenticate, checkRole(['Admin', 'ProjectManager']), milestoneController.updateMilestone);

// Delete milestone (Admin/PM)
router.delete('/:id', authenticate, checkRole(['Admin', 'ProjectManager']), milestoneController.deleteMilestone);

module.exports = router;
