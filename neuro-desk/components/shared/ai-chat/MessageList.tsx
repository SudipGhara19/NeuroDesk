'use client';

import { useRef, useEffect } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';
import type { AiMessage, AiModel } from './types';

interface Props {
  messages: AiMessage[];
  sending: boolean;
  dark: boolean;
  models: AiModel[];
  userInitial: string;
  onSuggest: (text: string) => void;
}

export default function MessageList({ messages, sending, dark, models, userInitial, onSuggest }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg
          ${dark ? 'bg-gradient-to-br from-violet-900/30 to-purple-900/30' : 'bg-gradient-to-br from-violet-100 to-purple-100'}`}>
          <Brain className={`w-10 h-10 ${dark ? 'text-violet-400' : 'text-violet-500'}`} />
        </div>
        <h2 className={`text-2xl font-black mb-2 ${dark ? 'text-white' : 'text-gray-800'}`}>
          NeuroDesk AI
        </h2>
        <p className={`text-sm max-w-sm mb-6 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
          Ask anything about your uploaded knowledge base. Responses are powered by RAG.
        </p>
        <div className="grid grid-cols-2 gap-2 max-w-md w-full">
          {['Summarize the latest report', 'What are the key findings?', 'Explain the strategy pillars', 'Compare Q2 vs Q3 results'].map((q) => (
            <button key={q} onClick={() => onSuggest(q)}
              className={`p-3 rounded-xl text-xs text-left font-medium transition-all hover:scale-[1.02] active:scale-95
                ${dark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'}`}>
              <Sparkles className={`w-3 h-3 mb-1 ${dark ? 'text-violet-400' : 'text-violet-500'}`} />
              {q}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {messages.filter(m => m.role !== 'system').map((msg, i) => (
        <MessageBubble key={msg._id || i} msg={msg} dark={dark} models={models} userInitial={userInitial} />
      ))}

      {/* Typing indicator */}
      {sending && (
        <div className="flex gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
            ${dark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
            <Brain className={`w-4 h-4 ${dark ? 'text-violet-400' : 'text-violet-600'}`} />
          </div>
          <div className={`px-4 py-3 rounded-2xl rounded-bl-md ${dark ? 'bg-white/5 border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
