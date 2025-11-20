const express = require('express');
const router = express.Router({ mergeParams: true });
const financialController = require('../controllers/financialController');
const { authenticate, checkRole } = require('../middleware/auth');

// Financial Phasing
router.get('/phasing', authenticate, financialController.getPhasing);
router.post('/phasing', authenticate, checkRole(['Admin', 'ProjectManager']), financialController.upsertPhasing);

// Expenses
router.get('/expenses', authenticate, financialController.getExpenses);
router.post('/expenses', authenticate, checkRole(['Admin', 'ProjectManager']), financialController.createExpense);
router.delete('/expenses/:id', authenticate, checkRole(['Admin', 'ProjectManager']), financialController.deleteExpense);

// Snapshots
router.get('/snapshots', authenticate, financialController.getSnapshots);
router.post('/snapshots', authenticate, checkRole(['Admin', 'ProjectManager']), financialController.createSnapshot);

module.exports = router;
