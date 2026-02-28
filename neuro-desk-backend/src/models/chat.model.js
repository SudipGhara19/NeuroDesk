const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for group/global chat
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexing for faster retrieval
chatSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
