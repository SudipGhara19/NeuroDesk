'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import type { RootState } from '@/lib/store';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import type { AiModel, AiMessage, AiSession, AiSessionSummary } from './ai-chat/types';
import {
  fetchModels,
  createSession,
  fetchSessions,
  fetchSession,
  deleteSessionApi,
  sendMessageApi,
  streamMessageApi,
} from './ai-chat/api';
import api from '@/lib/axios';

import SessionSidebar from './ai-chat/SessionSidebar';
import ModelPicker from './ai-chat/ModelPicker';
import MessageList from './ai-chat/MessageList';
import ChatInput from './ai-chat/ChatInput';
import DeleteConfirmModal from './ai-chat/DeleteConfirmModal';

// ─── Main Component (Orchestrator) ────────────────────────────────────────────

export default function AiChat() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const user = useSelector(selectCurrentUser);
  const accessToken = useSelector((state: RootState) => state.auth?.token || '');

  // State
  const [sessions, setSessions] = useState<AiSessionSummary[]>([]);
  const [activeSession, setActiveSession] = useState<AiSession | null>(null);
  const [models, setModels] = useState<AiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama-3.1-8b-instant');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Data Loading ───────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await fetchSessions(1, 50);
      setSessions(res.sessions);
    } catch { /* silent */ }
    finally { setLoadingSessions(false); }
  }, []);

  useEffect(() => {
    loadSessions();
    fetchModels().then(setModels).catch(() => {});
  }, [loadSessions]);

  // ── Session CRUD ───────────────────────────────────────────────────────
  const handleNewChat = async () => {
    try {
      const session = await createSession(selectedModel);
      setActiveSession(session);
      setSessions((prev) => [
        { _id: session._id, title: session.title, model: session.model, stats: session.stats, createdAt: session.createdAt, updatedAt: session.updatedAt },
        ...prev,
      ]);
      setInput('');
    } catch { /* silent */ }
  };

  const handleSelectSession = async (id: string) => {
    try {
      const session = await fetchSession(id);
      setActiveSession(session);
      setSelectedModel(session.model);
    } catch { /* silent */ }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSessionApi(id);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      if (activeSession?._id === id) setActiveSession(null);
      setDeleteConfirm(null);
    } catch { /* silent */ }
  };

  // ── Send Message (with streaming) ──────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    let session = activeSession;
    if (!session) {
      try {
        session = await createSession(selectedModel);
        setActiveSession(session);
        setSessions((prev) => [
          { _id: session!._id, title: session!.title, model: session!.model, stats: session!.stats, createdAt: session!.createdAt, updatedAt: session!.updatedAt },
          ...prev,
        ]);
      } catch { return; }
    }

    // Optimistic: add user message + empty streaming placeholder
    const userMsg: AiMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    const streamingMsg: AiMessage = { role: 'assistant', content: '', timestamp: new Date().toISOString() };
    setActiveSession((prev) => prev ? { ...prev, messages: [...prev.messages, userMsg, streamingMsg] } : prev);
    setInput('');
    setSending(true);

    try {
      let streamFailed = false;
      let finalContent = '';

      await streamMessageApi(
        session!._id,
        text,
        selectedModel,
        {
          onToken: (token) => {
            finalContent += token;
            setActiveSession((prev) => {
              if (!prev) return prev;
              const msgs = [...prev.messages];
              const lastIdx = msgs.length - 1;
              if (msgs[lastIdx]?.role === 'assistant') {
                msgs[lastIdx] = { ...msgs[lastIdx], content: finalContent };
              }
              return { ...prev, messages: msgs };
            });
          },
          onMeta: (meta) => {
            // Update the streaming placeholder with sources/model/confidence once RAG meta arrives
            setActiveSession((prev) => {
              if (!prev) return prev;
              const msgs = [...prev.messages];
              const lastIdx = msgs.length - 1;
              if (msgs[lastIdx]?.role === 'assistant') {
                msgs[lastIdx] = {
                  ...msgs[lastIdx],
                  sources: meta.sources,
                  confidence: meta.confidence,
                  model: meta.model,
                };
              }
              return { ...prev, messages: msgs };
            });
          },
          onDone: (latencyMs) => {
            // Stamp latency on the last message when streaming finishes
            setActiveSession((prev) => {
              if (!prev) return prev;
              const msgs = [...prev.messages];
              const lastIdx = msgs.length - 1;
              if (msgs[lastIdx]?.role === 'assistant') {
                msgs[lastIdx] = { ...msgs[lastIdx], latencyMs };
              }
              return { ...prev, messages: msgs };
            });
            // Refresh UserData analytics in the background so stats update immediately
            api.get('/users/profile').catch(() => {});
          },
          onError: () => { streamFailed = true; },
        },
        accessToken
      );

      if (streamFailed || !finalContent) {
        // Fallback to regular HTTP if streaming failed
        const result = await sendMessageApi(session!._id, text, selectedModel);
        setActiveSession((prev) => {
          if (!prev) return prev;
          const msgs = prev.messages.filter((m) => !(m.role === 'assistant' && m.content === ''));
          return { ...prev, messages: [...msgs, result.message], title: result.sessionTitle };
        });
        setSessions((prev) =>
          prev.map((s) => s._id === session!._id ? { ...s, title: result.sessionTitle, updatedAt: new Date().toISOString() } : s)
        );
      }
    } catch {
      const errMsg: AiMessage = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', timestamp: new Date().toISOString() };
      setActiveSession((prev) => {
        if (!prev) return prev;
        const msgs = prev.messages.filter((m) => !(m.role === 'assistant' && m.content === ''));
        return { ...prev, messages: [...msgs, errMsg] };
      });
    } finally {
      setSending(false);
    }
  };

  const currentModel = models.find((m) => m.id === selectedModel);
  const userName = user?.fullName || user?.email || '';
  const userInitial = (userName || 'U')[0].toUpperCase();

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0 overflow-hidden rounded-2xl border"
      style={{ borderColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>

      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} shrink-0 transition-all duration-300 overflow-hidden border-r flex flex-col
        ${dark ? 'bg-[#0d0d0d] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
        <SessionSidebar
          sessions={sessions}
          activeId={activeSession?._id || null}
          loading={loadingSessions}
          dark={dark}
          userName={userName}
          onNewChat={handleNewChat}
          onSelect={handleSelectSession}
          onDelete={(id) => setDeleteConfirm(id)}
        />
      </div>

      {/* Main Chat */}
      <div className={`flex-1 flex flex-col min-w-0 ${dark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>

        {/* Header */}
        <div className={`h-14 flex items-center gap-3 px-4 border-b shrink-0
          ${dark ? 'border-white/5' : 'border-gray-100'}`}>
          <button onClick={() => setShowSidebar(!showSidebar)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
              ${dark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
          <h3 className={`flex-1 text-sm font-bold truncate ${dark ? 'text-white' : 'text-gray-800'}`}>
            {activeSession?.title || 'NeuroDesk AI'}
          </h3>
          <ModelPicker
            models={models}
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
            open={showModelPicker}
            setOpen={setShowModelPicker}
            dark={dark}
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <MessageList
            messages={activeSession?.messages || []}
            sending={sending}
            dark={dark}
            models={models}
            userInitial={userInitial}
            onSuggest={(text) => setInput(text)}
          />
        </div>

        {/* Input */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          sending={sending}
          dark={dark}
          modelName={currentModel?.name || selectedModel}
        />
      </div>

      {/* Delete modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          dark={dark}
          onConfirm={() => handleDeleteSession(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
