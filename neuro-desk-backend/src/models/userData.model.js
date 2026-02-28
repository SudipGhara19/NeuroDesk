const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  department: { type: String },
  bio: { type: String },
  stats: {
    totalQueries: { type: Number, default: 0 },
    docsUploaded: { type: Number, default: 0 },
    totalTokensUsed: { type: Number, default: 0 },
    avgLatencyMs: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    totalCostEstimate: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  },
  presence: {
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
  },
  analytics: {
    queryFrequency: {
      daily: { type: Number, default: 0 },
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 }
    },
    popularSearchPatterns: [{ type: String }],
    sessionHistory: [{
      startTime: { type: Date },
      endTime: { type: Date },
      durationMs: { type: Number }
    }]
  },
  queries: [{
    queryText: { type: String, required: true },
    response: { type: String },
    sources: [{ type: String }],
    confidence: { type: Number },
    tokensUsed: { type: Number },
    latencyMs: { type: Number },
    timestamp: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

module.exports = mongoose.model('UserData', userDataSchema);
