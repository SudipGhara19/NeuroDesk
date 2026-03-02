const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: { type: String, required: true },
  // AI-specific metadata (only for assistant messages)
  sources: [{ type: String }],
  confidence: { type: Number },
  tokensUsed: { type: Number },
  latencyMs: { type: Number },
  model: { type: String },          // which Groq model generated this
  timestamp: { type: Date, default: Date.now },
});

const aiChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'New Chat',
    trim: true,
  },
  model: {
    type: String,
    default: 'llama-3.1-8b-instant', // default model for this session
  },
  messages: [messageSchema],
  stats: {
    totalMessages: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    avgLatency: { type: Number, default: 0 },
  },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate title from first user message
aiChatSchema.methods.autoTitle = function () {
  const firstUserMsg = this.messages.find((m) => m.role === 'user');
  if (firstUserMsg) {
    this.title = firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '...' : '');
  }
};

module.exports = mongoose.model('AiChat', aiChatSchema);
