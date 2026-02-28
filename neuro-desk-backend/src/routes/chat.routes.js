const express = require('express');
const router = express.Router();
const { getChatHistory } = require('../controllers/chat.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, getChatHistory);
router.get('/:recipientId', verifyToken, getChatHistory);

module.exports = router;
