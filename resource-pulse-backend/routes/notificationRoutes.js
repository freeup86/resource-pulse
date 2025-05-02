// notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// User notifications
router.get('/users/:userId/notifications', notificationController.getUserNotifications);
router.get('/users/:userId/notifications/unread', notificationController.getUnreadCount);
router.put('/notifications/:notificationId/read', notificationController.markAsRead);
router.put('/users/:userId/notifications/read', notificationController.markAllAsRead);

// User notification settings
router.get('/users/:userId/settings', notificationController.getUserSettings);
router.put('/users/:userId/settings', notificationController.updateUserSettings);

// System settings
router.get('/settings', notificationController.getSystemSettings);
router.put('/settings', notificationController.updateSystemSettings);

// Testing/debug endpoints
router.post('/users/:userId/digest', notificationController.triggerWeeklyDigest);
router.post('/process-emails', notificationController.processEmailQueue);

module.exports = router;