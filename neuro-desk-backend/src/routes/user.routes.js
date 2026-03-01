const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserProfile, 
  updateUserProfile,
  updateUserStatus,
  updateAiRestriction,
  deleteUser,
  createManager
} = require('../controllers/user.controller');
const { verifyToken, restrictTo } = require('../middlewares/auth.middleware');

router.post('/manager', verifyToken, restrictTo('Admin'), createManager);

router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);

// Admin & Manager Routes
router.get('/', verifyToken, restrictTo('Admin', 'Manager'), getUsers);
router.patch('/:id/status', verifyToken, restrictTo('Admin', 'Manager'), updateUserStatus);
router.patch('/:id/restrict-ai', verifyToken, restrictTo('Admin', 'Manager'), updateAiRestriction);

// Admin, Manager & User Routes
router.delete('/:id', verifyToken, deleteUser);

module.exports = router;
