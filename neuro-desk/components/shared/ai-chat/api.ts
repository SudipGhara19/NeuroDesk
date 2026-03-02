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
