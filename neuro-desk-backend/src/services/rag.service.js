/**
 * RAG Service — Retrieval-Augmented Generation
 * - Embeddings: local all-MiniLM-L6-v2 (free, no API)
 * - LLM:        Groq (free tier — llama-3.1-8b-instant)
 * - Vector DB:  Pinecone (384-dim index)
 */

const Groq = require('groq-sdk');
const { embedText } = require('./embedding.service');
const { getPineconeIndex } = require('../config/pinecone');
const Document = require('../models/document.model');
const Settings = require('../models/settings.model');

// Lazy Groq client
let _groq = null;
const getGroq = () => {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
};

// ─── Retrieve relevant chunks from Pinecone ───────────────────────────────────

async function retrieveChunks(queryEmbedding, topK = 5, namespaces = []) {
  const index = await getPineconeIndex();
  const results = [];

  // If no namespaces specified, query ALL ready documents
  if (namespaces.length === 0) {
    const docs = await Document.find({ status: 'ready' }).select('pineconeNamespace fileName');
    namespaces = docs.map((d) => d.pineconeNamespace).filter(Boolean);
  }

  if (namespaces.length === 0) {
    return []; // nothing indexed yet
  }

  for (const ns of namespaces) {
    try {
      const res = await index.namespace(ns).query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      });
      results.push(...(res.matches || []));
    } catch (err) {
      console.warn(`[RAG] Skipping namespace ${ns}: ${err.message}`);
    }
  }

  // Sort by score descending and return top-K overall
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

// ─── Build context from retrieved matches ─────────────────────────────────────

function buildContext(matches) {
  const contextParts = [];
  const sourceSet = new Set();
  let totalScore = 0;

  for (const match of matches) {
    const meta = match.metadata || {};
    if (meta.text) {
      contextParts.push(
        `[Source: ${meta.fileName}, Chunk #${meta.chunkIndex}]\n${meta.text}`
      );
      sourceSet.add(meta.fileName);
      totalScore += match.score || 0;
    }
  }

  const avgConfidence = matches.length > 0 ? totalScore / matches.length : 0;

  return {
    context: contextParts.join('\n\n---\n\n'),
    sources: Array.from(sourceSet),
    confidence: parseFloat(avgConfidence.toFixed(4)),
  };
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(query, context, systemPrompt) {
  return [
    {
      role: 'system',
      content: systemPrompt || "You are a helpful assistant.",
    },
    {
      role: 'user',
      content: context
        ? `Context from knowledge base:\n\n${context}\n\n---\n\nQuestion: ${query}`
        : query,
    },
  ];
}

// ─── Main RAG Query ───────────────────────────────────────────────────────────

async function ragQuery(query, options = {}) {
  const startTime = Date.now();
  const topK = options.topK || 5;
  const namespaces = options.namespaces || [];

  // Fetch live system settings to apply dynamic modifications
  const settings = await Settings.getSystemSettings();
  const model = options.model || settings.defaultAiModel || process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const customPrompt = settings.customSystemPrompt;

  // Detect casual/conversational queries (greetings, thanks, etc.)
  const casualPatterns = /^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening)|thanks|thank\s*you|bye|goodbye|ok|okay|sure|yes|no|yo|sup|what's up|how are you)[!?.\s]*$/i;
  if (casualPatterns.test(query.trim())) {
    // Skip RAG entirely — let LLM handle it naturally
    const messages = options.conversationHistory
      ? [...options.conversationHistory, { role: 'user', content: query }]
      : buildPrompt(query, '', customPrompt);
    if (options.conversationHistory && messages[0]?.role !== 'system') {
      messages.unshift(buildPrompt('', '', customPrompt)[0]);
    }
    const completion = await getGroq().chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 256,
    });
    return {
      answer: completion.choices[0].message.content.trim(),
      sources: [],
      confidence: 1,
      tokens_used: completion.usage?.total_tokens || 0,
      latency_ms: Date.now() - startTime,
      model,
    };
  }

  // 1. Embed query using local model (free)
  const queryEmbedding = await embedText(query);

  // 2. Retrieve chunks
  const matches = await retrieveChunks(queryEmbedding, topK, namespaces);

  // Fallback if no good matches (lowered threshold from 0.3 → 0.15)
  if (matches.length === 0 || (matches[0]?.score || 0) < 0.15) {
    return {
      answer: "I don't have enough information in the knowledge base to answer this question. Try rephrasing, or upload relevant documents.",
      sources: [],
      confidence: 0,
      tokens_used: 0,
      latency_ms: Date.now() - startTime,
      model,
    };
  }

  // 3. Build context + sources
  const { context, sources, confidence } = buildContext(matches);

  // 4. Build prompt (can include conversation history if provided)
  const messages = options.conversationHistory
    ? [...options.conversationHistory, { role: 'user', content: `Context from knowledge base:\n\n${context}\n\n---\n\nQuestion: ${query}` }]
    : buildPrompt(query, context, customPrompt);

  // If conversation history provided, prepend system prompt
  if (options.conversationHistory && messages[0]?.role !== 'system') {
    messages.unshift(buildPrompt('', '', customPrompt)[0]); // get system message
  }

  // 5. Call Groq LLM
  const completion = await getGroq().chat.completions.create({
    model,
    messages,
    temperature: 0.2,
    max_tokens: 1024,
  });

  const answer = completion.choices[0].message.content.trim();
  const tokensUsed = completion.usage?.total_tokens || 0;

  return {
    answer,
    sources,
    confidence,
    tokens_used: tokensUsed,
    latency_ms: Date.now() - startTime,
    model,
  };
}

module.exports = { ragQuery };
