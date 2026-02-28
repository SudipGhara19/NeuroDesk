const express = require('express');
const router = express.Router();
const { signup, login, forgotPassword, resetPassword, logout } = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', verifyToken, logout);

module.exports = router;
