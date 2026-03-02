// ─── AI Chat Types ────────────────────────────────────────────────────────────

export interface AiModel {
  id: string;
  name: string;
  description: string;
  speed: string;
  quality: string;
  contextWindow: number;
}

export interface AiMessage {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: string[];
  confidence?: number;
  tokensUsed?: number;
  latencyMs?: number;
  model?: string;
  timestamp: string;
}

export interface AiSession {
  _id: string;
  title: string;
  model: string;
  messages: AiMessage[];
  stats: {
    totalMessages: number;
    totalTokens: number;
    avgLatency: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AiSessionSummary {
  _id: string;
  title: string;
  model: string;
  stats: { totalMessages: number; totalTokens: number; avgLatency: number };
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageResponse {
  message: AiMessage;
  sessionTitle: string;
  model: string;
}
