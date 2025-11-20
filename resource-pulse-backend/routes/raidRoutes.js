const express = require('express');
const router = express.Router({ mergeParams: true });
const raidController = require('../controllers/raidController');
const { authenticate, checkRole } = require('../middleware/auth');

// Get RAID items
router.get('/', authenticate, raidController.getRAID);

// Create RAID item (Admin/PM)
router.post('/', authenticate, checkRole(['Admin', 'ProjectManager']), raidController.createRAID);

// Update RAID item (Admin/PM)
router.patch('/:id', authenticate, checkRole(['Admin', 'ProjectManager']), raidController.updateRAID);

// Delete RAID item (Admin/PM)
router.delete('/:id', authenticate, checkRole(['Admin', 'ProjectManager']), raidController.deleteRAID);

module.exports = router;
