import api from '@/lib/axios';
import type { AiModel, AiSession, AiSessionSummary, SendMessageResponse } from './types';

// ─── Models ───────────────────────────────────────────────────────────────────

export async function fetchModels(): Promise<AiModel[]> {
  const { data } = await api.get('/ai-chat/models');
  return data.models;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(model?: string): Promise<AiSession> {
  const { data } = await api.post('/ai-chat/sessions', { model });
  return data.session;
}

export async function fetchSessions(page = 1, limit = 30): Promise<{
  sessions: AiSessionSummary[];
  pagination: { page: number; total: number; pages: number };
}> {
  const { data } = await api.get('/ai-chat/sessions', { params: { page, limit } });
  return data;
}

export async function fetchSession(id: string): Promise<AiSession> {
  const { data } = await api.get(`/ai-chat/sessions/${id}`);
  return data.session;
}

export async function deleteSessionApi(id: string): Promise<void> {
  await api.delete(`/ai-chat/sessions/${id}`);
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function sendMessageApi(
  sessionId: string,
  query: string,
  model?: string
): Promise<SendMessageResponse> {
  const { data } = await api.post(`/ai-chat/sessions/${sessionId}/messages`, { query, model });
  return data;
}

// ─── Model Switch ─────────────────────────────────────────────────────────────

export async function switchModelApi(
  sessionId: string,
  model: string
): Promise<{ model: string }> {
  const { data } = await api.patch(`/ai-chat/sessions/${sessionId}/model`, { model });
  return data;
}

// ─── Streaming Message (SSE via fetch) ────────────────────────────────────────

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onMeta?: (meta: { sources: string[]; confidence: number; model: string }) => void;
  onDone?: (latencyMs: number) => void;
  onError?: (err: string) => void;
}

export async function streamMessageApi(
  sessionId: string,
  query: string,
  model: string | undefined,
  callbacks: StreamCallbacks,
  token: string  // JWT access token needed for manual fetch (Axios interceptors not available here)
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5868/api';

  const response = await fetch(`${baseUrl}/ai-chat/sessions/${sessionId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ query, model }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Stream failed' }));
    callbacks.onError?.(err.message || 'Stream request failed');
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError?.('No readable stream body');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? ''; // keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const payload = JSON.parse(line.slice(6));
          if (payload.token !== undefined) callbacks.onToken(payload.token);
          if (payload.latency_ms !== undefined) callbacks.onDone?.(payload.latency_ms);
        } catch { /* malformed chunk — skip */ }
      } else if (line.startsWith('event: meta')) {
        // Next line will have the meta data
      } else if (line.startsWith('data: ') && buffer.includes('meta')) {
        // handled above
      } else if (line.startsWith('event: done')) {
        // handled via the data: {latency_ms} line that follows
      } else if (line.startsWith('event: error')) {
        callbacks.onError?.('Stream error from server');
      }
    }
  }

  // Process any remaining data in buffer
  if (buffer.startsWith('data: ')) {
    try {
      const payload = JSON.parse(buffer.slice(6));
      if (payload.token !== undefined) callbacks.onToken(payload.token);
      if (payload.latency_ms !== undefined) callbacks.onDone?.(payload.latency_ms);
    } catch { /* ignore */ }
  }
}
