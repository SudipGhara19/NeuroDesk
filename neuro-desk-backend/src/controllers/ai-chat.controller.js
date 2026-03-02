const {
  getAvailableModels,
  createSession,
  listSessions,
  getSession,
  deleteSession,
  sendMessage,
  updateSessionModel,
} = require('../services/ai-chat.service');
const User = require('../models/user.model');

// ─── GET /api/ai-chat/models ──────────────────────────────────────────────────

const listModels = (req, res) => {
  return res.json({ models: getAvailableModels() });
};

// ─── POST /api/ai-chat/sessions ───────────────────────────────────────────────

const createChatSession = async (req, res) => {
  try {
    // Check AI restriction
    const user = await User.findById(req.user.id).select('isAiRestricted');
    if (user?.isAiRestricted) {
      return res.status(403).json({ message: 'AI access is restricted for your account.' });
    }

    const { model } = req.body;
    const session = await createSession(req.user.id, model);
    return res.status(201).json({ session });
  } catch (err) {
    console.error('[AI Chat] Create session error:', err);
    return res.status(500).json({ message: 'Failed to create session.', error: err.message });
  }
};

// ─── GET /api/ai-chat/sessions ────────────────────────────────────────────────

const listChatSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await listSessions(req.user.id, page, limit);
    return res.json(result);
  } catch (err) {
    console.error('[AI Chat] List sessions error:', err);
    return res.status(500).json({ message: 'Failed to list sessions.', error: err.message });
  }
};

// ─── GET /api/ai-chat/sessions/:id ────────────────────────────────────────────

const getChatSession = async (req, res) => {
  try {
    const session = await getSession(req.params.id, req.user.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    return res.json({ session });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to get session.', error: err.message });
  }
};

// ─── DELETE /api/ai-chat/sessions/:id ─────────────────────────────────────────

const deleteChatSession = async (req, res) => {
  try {
    const result = await deleteSession(req.params.id, req.user.id);
    if (!result) return res.status(404).json({ message: 'Session not found.' });
    return res.json({ message: 'Session deleted.' });
  } catch (err) {
    console.error('[AI Chat] Delete session error:', err);
    return res.status(500).json({ message: 'Delete failed.', error: err.message });
  }
};

// ─── POST /api/ai-chat/sessions/:id/messages ─────────────────────────────────

const sendChatMessage = async (req, res) => {
  try {
    // Check AI restriction
    const user = await User.findById(req.user.id).select('isAiRestricted');
    if (user?.isAiRestricted) {
      return res.status(403).json({ message: 'AI access is restricted for your account.' });
    }

    const { query, model } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Query is required.' });
    }

    const result = await sendMessage(req.params.id, req.user.id, query.trim(), model);
    return res.json(result);
  } catch (err) {
    console.error('[AI Chat] Send message error:', err);
    return res.status(500).json({ message: 'Failed to process message.', error: err.message });
  }
};

// ─── PATCH /api/ai-chat/sessions/:id/model ────────────────────────────────────

const switchModel = async (req, res) => {
  try {
    const { model } = req.body;
    if (!model) return res.status(400).json({ message: 'Model is required.' });

    const session = await updateSessionModel(req.params.id, req.user.id, model);
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    return res.json({ message: 'Model updated.', model: session.model });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

module.exports = {
  listModels,
  createChatSession,
  listChatSessions,
  getChatSession,
  deleteChatSession,
  sendChatMessage,
  switchModel,
};
