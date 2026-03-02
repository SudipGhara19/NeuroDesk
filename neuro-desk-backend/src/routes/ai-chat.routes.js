const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const {
  listModels,
  createChatSession,
  listChatSessions,
  getChatSession,
  deleteChatSession,
  sendChatMessage,
  switchModel,
} = require('../controllers/ai-chat.controller');

// All routes require authentication
router.use(verifyToken);

// GET /api/ai-chat/models — list available LLM models
router.get('/models', listModels);

// POST /api/ai-chat/sessions — create a new chat session
router.post('/sessions', createChatSession);

// GET /api/ai-chat/sessions — list user's sessions
router.get('/sessions', listChatSessions);

// GET /api/ai-chat/sessions/:id — get session with messages
router.get('/sessions/:id', getChatSession);

// DELETE /api/ai-chat/sessions/:id — delete session
router.delete('/sessions/:id', deleteChatSession);

// POST /api/ai-chat/sessions/:id/messages — send a message
router.post('/sessions/:id/messages', sendChatMessage);

// PATCH /api/ai-chat/sessions/:id/model — switch model mid-session
router.patch('/sessions/:id/model', switchModel);

module.exports = router;
