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

function buildPrompt(query, context) {
  return [
    {
      role: 'system',
      content: `You are NeuroDesk AI, an expert knowledge assistant for the team's internal knowledge base.

Answer the user's question using ONLY the information provided in the context below.

Rules:
- Give a clear, direct, well-structured answer. Do NOT hedge with phrases like "according to the context" or "based on the provided context".
- Do NOT include any inline source citations like [Source: ...] or [Chunk #...] in your reply — sources are displayed separately in the UI.
- If the context genuinely does not contain enough information, say only: "I don't have enough information in the knowledge base to answer this."
- Be concise and professional. Use bullet points or short paragraphs when appropriate.`,
    },
    {
      role: 'user',
      content: `Context from knowledge base:\n\n${context}\n\n---\n\nQuestion: ${query}`,
    },
  ];
}

// ─── Main RAG Query ───────────────────────────────────────────────────────────

async function ragQuery(query, options = {}) {
  const startTime = Date.now();
  const topK = options.topK || 5;
  const namespaces = options.namespaces || [];

  // 1. Embed query using local model (free)
  const queryEmbedding = await embedText(query);

  // 2. Retrieve chunks
  const matches = await retrieveChunks(queryEmbedding, topK, namespaces);

  // Fallback if no good matches
  if (matches.length === 0 || (matches[0]?.score || 0) < 0.3) {
    return {
      answer: "I don't have enough information in the knowledge base to answer this question. Please upload relevant documents first.",
      sources: [],
      confidence: 0,
      tokens_used: 0,
      latency_ms: Date.now() - startTime,
    };
  }

  // 3. Build context + sources
  const { context, sources, confidence } = buildContext(matches);

  // 4. Build prompt
  const messages = buildPrompt(query, context);

  // 5. Call Groq LLM (free tier)
  const completion = await getGroq().chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
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
  };
}

module.exports = { ragQuery };
