const express = require('express');
const router = express.Router();
const { signup, login, forgotPassword, resetPassword, logout, refreshToken } = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const { body } = require('express-validator');
const { validateInput } = require('../middlewares/validate.middleware');

// Strict Validation Schemas
const signupValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required').escape(),
  body('email').isEmail().withMessage('Please include a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validateInput
];

const loginValidation = [
  body('email').isEmail().withMessage('Please include a valid email').normalizeEmail(),
  body('password').exists().withMessage('Password is required'),
  validateInput
];

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', verifyToken, logout);
router.get('/refresh', refreshToken);

module.exports = router;
