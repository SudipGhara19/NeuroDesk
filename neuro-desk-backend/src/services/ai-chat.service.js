/**
 * AI Chat Service — orchestrates conversational RAG with full analytics tracking
 */

const AiChat = require('../models/ai-chat.model');
const UserData = require('../models/userData.model');
const { ragQuery } = require('./rag.service');

// ─── Available Groq Models (free tier) ────────────────────────────────────────

const AVAILABLE_MODELS = [
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    description: 'Fast responses, good quality',
    speed: 'fast',
    quality: 'good',
    contextWindow: 8192,
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    description: 'Highest quality, slower',
    speed: 'moderate',
    quality: 'excellent',
    contextWindow: 32768,
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    description: 'OpenAI open-source, highest quality',
    speed: 'moderate',
    quality: 'excellent',
    contextWindow: 32768,
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    description: 'Latest Llama 4, fast & capable',
    speed: 'fast',
    quality: 'good',
    contextWindow: 32768,
  },
];

function getAvailableModels() {
  return AVAILABLE_MODELS;
}

function isValidModel(modelId) {
  return AVAILABLE_MODELS.some((m) => m.id === modelId);
}

// ─── Create New Session ───────────────────────────────────────────────────────

async function createSession(userId, model) {
  const session = await AiChat.create({
    userId,
    model: model && isValidModel(model) ? model : 'llama-3.1-8b-instant',
  });
  return session;
}

// ─── List User Sessions ──────────────────────────────────────────────────────

async function listSessions(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [sessions, total] = await Promise.all([
    AiChat.find({ userId, isArchived: false })
      .select('title model stats createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    AiChat.countDocuments({ userId, isArchived: false }),
  ]);
  return { sessions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

// ─── Get Session (with messages) ──────────────────────────────────────────────

async function getSession(sessionId, userId) {
  return AiChat.findOne({ _id: sessionId, userId });
}

// ─── Delete Session ──────────────────────────────────────────────────────────

async function deleteSession(sessionId, userId) {
  return AiChat.findOneAndDelete({ _id: sessionId, userId });
}

// ─── Send Message (core flow) ─────────────────────────────────────────────────

async function sendMessage(sessionId, userId, queryText, model) {
  const session = await AiChat.findOne({ _id: sessionId, userId });
  if (!session) throw new Error('Session not found');

  // Allow model switching mid-session
  const targetModel = model && isValidModel(model) ? model : session.model;
  session.model = targetModel;

  // Push user message
  session.messages.push({
    role: 'user',
    content: queryText,
    timestamp: new Date(),
  });

  // Build conversation history for context (last 10 messages to keep within token limits)
  const recentMessages = session.messages
    .filter((m) => m.role !== 'system')
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }));

  // Run RAG query with conversation context + model
  const result = await ragQuery(queryText, {
    model: targetModel,
    conversationHistory: recentMessages.slice(0, -1), // exclude the current query (RAG adds it)
  });

  // Push assistant message
  session.messages.push({
    role: 'assistant',
    content: result.answer,
    sources: result.sources,
    confidence: result.confidence,
    tokensUsed: result.tokens_used,
    latencyMs: result.latency_ms,
    model: result.model || targetModel,
    timestamp: new Date(),
  });

  // Auto-title on first exchange
  if (session.title === 'New Chat' && session.messages.filter((m) => m.role === 'user').length === 1) {
    session.autoTitle();
  }

  // Update session stats
  const assistantMsgs = session.messages.filter((m) => m.role === 'assistant');
  session.stats.totalMessages = session.messages.length;
  session.stats.totalTokens = assistantMsgs.reduce((sum, m) => sum + (m.tokensUsed || 0), 0);
  session.stats.avgLatency = assistantMsgs.length > 0
    ? Math.round(assistantMsgs.reduce((sum, m) => sum + (m.latencyMs || 0), 0) / assistantMsgs.length)
    : 0;

  await session.save();

  // ── Update UserData analytics (fire-and-forget) ─────────────────────────
  trackAnalytics(userId, queryText, result, targetModel).catch((err) =>
    console.warn('[Analytics] Tracking failed:', err.message)
  );

  // Return the assistant response
  const lastMsg = session.messages[session.messages.length - 1];
  return {
    message: lastMsg,
    sessionTitle: session.title,
    model: targetModel,
  };
}

// ─── Analytics Tracking ───────────────────────────────────────────────────────

async function trackAnalytics(userId, queryText, result, model) {
  const now = new Date();

  // Compute running average latency
  const userData = await UserData.findOne({ userId });
  const prevTotal = userData?.stats?.totalQueries || 0;
  const prevAvg = userData?.stats?.avgLatencyMs || 0;
  const newAvg = prevTotal > 0
    ? Math.round((prevAvg * prevTotal + result.latency_ms) / (prevTotal + 1))
    : result.latency_ms;

  // Extract keywords from query for popular search patterns (top 3 words > 3 chars)
  const keywords = queryText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3);

  await UserData.findOneAndUpdate(
    { userId },
    {
      $inc: {
        'stats.totalQueries': 1,
        'stats.totalTokensUsed': result.tokens_used || 0,
        'stats.totalCostEstimate': (result.tokens_used || 0) * 0.0000005, // Estimate: $0.50 per 1M tokens
        'analytics.queryFrequency.daily': 1,
        'analytics.queryFrequency.weekly': 1,
        'analytics.queryFrequency.monthly': 1,
      },
      $set: {
        'stats.avgLatencyMs': newAvg,
        'stats.lastActive': now,
      },
      $push: {
        queries: {
          $each: [{
            queryText,
            response: result.answer?.slice(0, 500), // cap stored response
            sources: result.sources || [],
            confidence: result.confidence,
            tokensUsed: result.tokens_used,
            latencyMs: result.latency_ms,
            modelUsed: model,
            timestamp: now,
          }],
          $slice: -200, // keep only last 200 queries to avoid unbounded growth
        },
        'analytics.popularSearchPatterns': {
          $each: keywords,
          $slice: -50, // keep last 50 patterns
        },
      },
    },
    { upsert: true, new: true }
  );
}

// ─── Update Session Model ─────────────────────────────────────────────────────

async function updateSessionModel(sessionId, userId, model) {
  if (!isValidModel(model)) throw new Error(`Invalid model: ${model}`);
  const session = await AiChat.findOneAndUpdate(
    { _id: sessionId, userId },
    { model },
    { new: true }
  );
  return session;
}

module.exports = {
  getAvailableModels,
  createSession,
  listSessions,
  getSession,
  deleteSession,
  sendMessage,
  updateSessionModel,
};
