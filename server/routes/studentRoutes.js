// Student routes
const express = require('express');
const { body, param, query } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const studentController = require('../controllers/studentController');

const router = express.Router();

// Validate request middleware
const studentCreateValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isDate().withMessage('Valid date of birth is required'),
  body('parentId').optional().isInt().withMessage('Parent ID must be an integer'),
  body('currentSkillLevel').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid skill level')
];

const studentUpdateValidation = [
  param('id').isInt().withMessage('Invalid student ID'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isDate().withMessage('Valid date of birth is required'),
  body('parentId').optional().isInt().withMessage('Parent ID must be an integer'),
  body('currentSkillLevel').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid skill level')
];

const studentGetValidation = [
  param('id').isInt().withMessage('Invalid student ID')
];

const studentsListValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('active').optional().isBoolean().withMessage('Active must be a boolean'),
  query('ageMin').optional().isInt({ min: 0 }).withMessage('Minimum age must be a positive integer'),
  query('ageMax').optional().isInt({ min: 0 }).withMessage('Maximum age must be a positive integer')
];

// All student routes require authentication
router.use(auth);

// Get all students
router.get(
  '/',
  studentsListValidation,
  validateRequest,
  authorize(['admin', 'instructor']),
  studentController.getAllStudents
);

// Get a student by ID
router.get(
  '/:id',
  studentGetValidation,
  validateRequest,
  authorize(['admin', 'instructor', 'parent']),
  studentController.getStudentById
);

// Create a new student
router.post(
  '/',
  studentCreateValidation,
  validateRequest,
  authorize(['admin']),
  studentController.createStudent
);

// Update a student
router.put(
  '/:id',
  studentUpdateValidation,
  validateRequest,
  authorize(['admin']),
  studentController.updateStudent
);

// Delete a student
router.delete(
  '/:id',
  studentGetValidation,
  validateRequest,
  authorize(['admin']),
  studentController.deleteStudent
);

module.exports = router;