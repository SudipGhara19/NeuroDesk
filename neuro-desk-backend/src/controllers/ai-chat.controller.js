const {
  getAvailableModels,
  createSession,
  listSessions,
  getSession,
  deleteSession,
  sendMessage,
  updateSessionModel,
} = require('../services/ai-chat.service');
const { ragQuery } = require('../services/rag.service');
const AiChat = require('../models/ai-chat.model');
const User = require('../models/user.model');
const Groq = require('groq-sdk');

let _groqClient = null;
const getGroq = () => {
  if (!_groqClient) _groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groqClient;
};

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

// ─── POST /api/ai-chat/sessions/:id/stream ────────────────────────────────────

const streamChatMessage = async (req, res) => {
  try {
    // Check AI restriction first
    const user = await User.findById(req.user.id).select('isAiRestricted');
    if (user?.isAiRestricted) {
      return res.status(403).json({ message: 'AI access is restricted for your account.' });
    }

    const { query, model } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Query is required.' });
    }

    const session = await AiChat.findOne({ _id: req.params.id, userId: req.user.id });
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    const targetModel = model && ['llama-3.1-8b-instant','llama-3.3-70b-versatile','openai/gpt-oss-120b','meta-llama/llama-4-scout-17b-16e-instruct'].includes(model)
      ? model
      : session.model;

    // ── Step 1: RAG retrieval (non-streaming — gets context chunks) ────────────
    const ragResult = await ragQuery(query.trim(), {
      model: targetModel,
      // NOTE: intentionally NOT passing conversationHistory for streaming to keep it snappy
    });

    // ── Step 2: Set up SSE headers ─────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    // Send sources metadata first as a special event
    res.write(`event: meta\ndata: ${JSON.stringify({ sources: ragResult.sources, confidence: ragResult.confidence, model: targetModel })}\n\n`);

    let fullAnswer = '';
    const startTime = Date.now();

    // ── Step 3: Stream from Groq ───────────────────────────────────────────────
    // If it was a cache hit, stream the cached answer word-by-word (simulate streaming)
    if (ragResult.cache_hit) {
      const words = ragResult.answer.split(' ');
      for (const word of words) {
        const chunk = word + ' ';
        fullAnswer += chunk;
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
        await new Promise(r => setTimeout(r, 15)); // ~15ms per word
      }
    } else {
      // Build the same prompt that ragQuery would use for the actual LLM call
      const systemPrompt = ragResult.answer.length > 0 ? null : 'You are NeuroDesk AI.';
      const contextBlock = ragResult.sources.length > 0
        ? `Context from knowledge base:\n\n${ragResult.answer}\n\n---\n\nQuestion: ${query.trim()}`
        : query.trim();

      // Stream the actual LLM response
      const stream = await getGroq().chat.completions.create({
        model: targetModel,
        messages: [
          { role: 'system', content: systemPrompt || 'You are NeuroDesk AI, a helpful knowledge assistant.' },
          { role: 'user', content: contextBlock },
        ],
        temperature: 0.2,
        max_tokens: 1024,
        stream: true,
      });

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) {
          fullAnswer += token;
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      }
    }

    // ── Step 4: Signal completion ──────────────────────────────────────────────
    const latencyMs = Date.now() - startTime;
    res.write(`event: done\ndata: ${JSON.stringify({ latency_ms: latencyMs })}\n\n`);
    res.end();

    // ── Step 5: Persist the streaming message to session history (async) ───────
    setImmediate(async () => {
      try {
        session.messages.push({ role: 'user', content: query.trim(), timestamp: new Date() });
        session.messages.push({
          role: 'assistant',
          content: fullAnswer.trim() || ragResult.answer,
          sources: ragResult.sources,
          confidence: ragResult.confidence,
          latencyMs,
          model: targetModel,
          timestamp: new Date(),
        });
        if (session.title === 'New Chat' && session.messages.filter(m => m.role === 'user').length === 1) {
          session.autoTitle();
        }
        session.stats.totalMessages = session.messages.length;
        await session.save();

        // ── Update UserData analytics (tokens, query count, cost) ─────────────
        // Groq streaming doesn't return token counts — estimate from output chars (~4 chars/token)
        const estimatedTokens = Math.ceil(fullAnswer.length / 4);
        const { trackAnalytics } = require('../services/ai-chat.service');
        await trackAnalytics(req.user.id, query.trim(), {
          answer: fullAnswer.trim(),
          sources: ragResult.sources,
          confidence: ragResult.confidence,
          tokens_used: estimatedTokens,
          latency_ms: latencyMs,
        }, targetModel);
      } catch (e) {
        console.error('[Stream] Failed to persist session:', e.message);
      }
    });
  } catch (err) {
    console.error('[Stream] Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Stream failed.', error: err.message });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
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
  streamChatMessage,
};
