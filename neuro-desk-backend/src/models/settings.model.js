const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // A singleton check field to make sure there's only one settings document
    singleton: {
      type: String,
      default: 'system',
      unique: true,
      required: true,
    },
    allowRegistration: {
      type: Boolean,
      default: true,
    },
    defaultAiModel: {
      type: String,
      default: 'llama-3.1-8b-instant',
    },
    customSystemPrompt: {
      type: String,
      default: 'You are NeuroDesk AI, a friendly and helpful knowledge assistant for the team.\n\nIf the user sends a casual greeting (like "hi", "hello", "hey"), respond warmly and let them know you\'re ready to help with questions about their knowledge base.\n\nFor knowledge-related questions, answer using the provided context.\n\nRules:\n- Be friendly, natural, and conversational.\n- Give clear, direct, well-structured answers. Do NOT hedge with phrases like "according to the context".\n- Do NOT include inline source citations like [Source: ...] — sources are displayed separately in the UI.\n- If the context does not contain enough info, say so briefly and suggest what they could ask or upload.\n- Use bullet points or short paragraphs when appropriate.',
    },
    ragTopK: {
      type: Number,
      default: 5,
    },
    ragConfidenceThreshold: {
      type: Number,
      default: 0.15,
    },
    chunkSize: {
      type: Number,
      default: 500,
    },
    chunkOverlap: {
      type: Number,
      default: 50,
    }
  },
  {
    timestamps: true,
  }
);

// Helper method to always return the singleton settings document
settingsSchema.statics.getSystemSettings = async function () {
  let settings = await this.findOne({ singleton: 'system' });
  if (!settings) {
    settings = await this.create({ singleton: 'system' });
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
