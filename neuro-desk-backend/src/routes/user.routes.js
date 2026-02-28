const express = require('express');
const router = express.Router();
const { getUsers, getUserProfile, updateUserProfile } = require('../controllers/user.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.get('/', verifyToken, getUsers); // Admin check can be added later

module.exports = router;
