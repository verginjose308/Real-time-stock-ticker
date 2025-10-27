import { body, param, query, validationResult } from 'express-validator';

// Custom validation middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }

  next();
};

// Auth validation rules
export const validateRegister = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .isAlphanumeric()
    .withMessage('Username can only contain letters and numbers'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  handleValidationErrors
];

export const validateLogin = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Stock validation rules
export const validateStockSymbol = [
  param('symbol')
    .isLength({ min: 1, max: 10 })
    .withMessage('Stock symbol must be between 1 and 10 characters')
    .isUppercase()
    .withMessage('Stock symbol must be uppercase')
    .matches(/^[A-Z]+$/)
    .withMessage('Stock symbol can only contain letters'),
  
  handleValidationErrors
];

export const validateStockSearch = [
  query('q')
    .isLength({ min: 1, max: 50 })
    .withMessage('Search query must be between 1 and 50 characters')
    .trim()
    .escape(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  handleValidationErrors
];

// Watchlist validation rules
export const validateWatchlistAdd = [
  body('symbol')
    .isLength({ min: 1, max: 10 })
    .withMessage('Stock symbol must be between 1 and 10 characters')
    .isUppercase()
    .withMessage('Stock symbol must be uppercase'),
  
  body('customName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Custom name cannot exceed 50 characters')
    .trim()
    .escape(),
  
  body('targetPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Target price must be a positive number'),
  
  body('notes')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters')
    .trim()
    .escape(),
  
  handleValidationErrors
];

// Alert validation rules
export const validateAlertCreate = [
  body('stockSymbol')
    .isLength({ min: 1, max: 10 })
    .withMessage('Stock symbol must be between 1 and 10 characters')
    .isUppercase()
    .withMessage('Stock symbol must be uppercase'),
  
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Alert name must be between 1 and 100 characters')
    .trim()
    .escape(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim()
    .escape(),
  
  body('condition.type')
    .isIn([
      'PRICE_ABOVE', 'PRICE_BELOW', 'PRICE_PERCENT_UP', 'PRICE_PERCENT_DOWN',
      'VOLUME_ABOVE', 'VOLUME_BELOW', 'PRICE_CHANGE_UP', 'PRICE_CHANGE_DOWN'
    ])
    .withMessage('Invalid condition type'),
  
  body('condition.targetValue')
    .isFloat({ min: 0 })
    .withMessage('Target value must be a positive number'),
  
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid priority level'),
  
  body('notification.types')
    .optional()
    .isArray()
    .withMessage('Notification types must be an array'),
  
  body('notification.types.*')
    .isIn(['EMAIL', 'PUSH', 'SMS', 'IN_APP'])
    .withMessage('Invalid notification type'),
  
  handleValidationErrors
];

// User profile validation
export const validateProfileUpdate = [
  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters')
    .trim()
    .escape(),
  
  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters')
    .trim()
    .escape(),
  
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number')
    .trim()
    .escape(),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
    .trim()
    .escape(),
  
  handleValidationErrors
];

// Password change validation
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New passwords do not match');
      }
      return true;
    }),
  
  handleValidationErrors
];

// MongoDB ID validation
export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];