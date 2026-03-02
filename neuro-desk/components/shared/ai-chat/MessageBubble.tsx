'use client';

import { Brain, Target, Zap, Clock, FileText, Cpu, User as UserIcon } from 'lucide-react';
import { MODEL_ICONS, DEFAULT_MODEL_ICON } from './constants';
import type { AiMessage, AiModel } from './types';

interface Props {
  msg: AiMessage;
  dark: boolean;
  models: AiModel[];
  userInitial: string;
}

export default function MessageBubble({ msg, dark, models, userInitial }: Props) {
  const isUser = msg.role === 'user';
  const confidencePct = msg.confidence != null ? Math.round(msg.confidence * 100) : null;

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* AI avatar */}
      {!isUser && (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5
          ${dark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
          <Brain className={`w-4 h-4 ${dark ? 'text-violet-400' : 'text-violet-600'}`} />
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        {/* Bubble */}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-md shadow-lg shadow-violet-500/10'
            : dark
              ? 'bg-white/5 text-gray-200 rounded-bl-md border border-white/5'
              : 'bg-gray-50 text-gray-700 rounded-bl-md border border-gray-100'
          }`}>
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>

        {/* Metadata row */}
        {!isUser && (confidencePct != null || msg.tokensUsed != null) && (
          <div className="flex flex-wrap items-center gap-2 mt-1.5 px-1">
            {confidencePct != null && (
              <span className={`flex items-center gap-0.5 text-[10px] font-bold ${
                confidencePct >= 70 ? 'text-emerald-400' :
                confidencePct >= 40 ? 'text-amber-400' : 'text-red-400'
              }`}>
                <Target className="w-2.5 h-2.5" />
                {confidencePct}%
              </span>
            )}
            {msg.tokensUsed != null && (
              <span className={`flex items-center gap-0.5 text-[10px] ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                <Zap className="w-2.5 h-2.5" />
                {msg.tokensUsed}
              </span>
            )}
            {msg.latencyMs != null && (
              <span className={`flex items-center gap-0.5 text-[10px] ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                <Clock className="w-2.5 h-2.5" />
                {msg.latencyMs}ms
              </span>
            )}
            {msg.model && (
              <span className={`flex items-center gap-0.5 text-[10px] ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                {MODEL_ICONS[msg.model] || <Cpu className="w-2.5 h-2.5" />}
                <span>{models.find(m => m.id === msg.model)?.name || msg.model}</span>
              </span>
            )}
          </div>
        )}

        {/* Sources */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 px-1">
            {msg.sources.map((src) => (
              <span key={src} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full
                ${dark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                <FileText className="w-2.5 h-2.5" />
                {src}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] mt-1 px-1 ${dark ? 'text-gray-700' : 'text-gray-300'}`}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5
          ${dark ? 'bg-white/10' : 'bg-gray-200'}`}>
          <UserIcon className={`w-4 h-4 ${dark ? 'text-white' : 'text-gray-600'}`} />
        </div>
      )}
    </div>
  );
}
