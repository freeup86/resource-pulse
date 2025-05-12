// Authentication routes
const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const authController = require('../controllers/authController');

const router = express.Router();

// Validate request middleware
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['admin', 'instructor', 'parent', 'school_admin']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const passwordChangeValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

// Register new user
router.post(
  '/register',
  registerValidation,
  validateRequest,
  authController.register
);

// Login user
router.post(
  '/login',
  loginValidation,
  validateRequest,
  authController.login
);

// Get current user
router.get(
  '/me',
  auth,
  authController.getMe
);

// Refresh token
router.post(
  '/refresh-token',
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validateRequest,
  authController.refreshToken
);

// Change password
router.post(
  '/change-password',
  auth,
  passwordChangeValidation,
  validateRequest,
  authController.changePassword
);

module.exports = router;