// Request validation middleware
const { validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

/**
 * Validate request based on express-validator rules
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));
    
    return next(new ApiError(400, 'Validation Error', true, errorMessages));
  }
  
  next();
};

module.exports = {
  validateRequest
};