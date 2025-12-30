const { body, validationResult } = require('express-validator');

// Common validation rules
exports.registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
];

exports.loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

exports.gameValidation = [
  body('gameType')
    .isIn(['tictactoe', 'handcricket', 'ludo', 'snake', 'uno', 'snakeladder'])
    .withMessage('Invalid game type'),
  
  body('maxPlayers')
    .optional()
    .isInt({ min: 2, max: 4 })
    .withMessage('Max players must be between 2 and 4')
];

// Check validation result
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));
  
  return res.status(400).json({
    success: false,
    errors: extractedErrors
  });
};