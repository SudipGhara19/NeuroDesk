'use client';

import { Plus, X, MessageSquare, Cpu, Loader2 } from 'lucide-react';
import { MODEL_ICONS, DEFAULT_MODEL_ICON, timeAgo } from './constants';
import type { AiSessionSummary } from './types';

interface Props {
  sessions: AiSessionSummary[];
  activeId: string | null;
  loading: boolean;
  dark: boolean;
  userName: string;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function SessionSidebar({
  sessions, activeId, loading, dark, userName, onNewChat, onSelect, onDelete,
}: Props) {
  return (
    <>
      {/* New Chat button */}
      <div className={`p-4 border-b shrink-0 ${dark ? 'border-white/5' : 'border-gray-100'}`}>
        <button onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95
            bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30">
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className={`w-5 h-5 animate-spin ${dark ? 'text-white/30' : 'text-gray-300'}`} />
          </div>
        ) : sessions.length === 0 ? (
          <div className={`text-center py-10 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold">No conversations yet</p>
            <p className="text-[11px] mt-1">Start a new chat above</p>
          </div>
        ) : (
          sessions.map((s) => (
            <div key={s._id}
              onClick={() => onSelect(s._id)}
              className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all
                ${activeId === s._id
                  ? dark ? 'bg-violet-500/10 text-white' : 'bg-violet-50 text-violet-700'
                  : dark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}>
              <span className="shrink-0">{MODEL_ICONS[s.model] || DEFAULT_MODEL_ICON}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{s.title}</p>
                <p className={`text-[10px] mt-0.5 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {s.stats.totalMessages} msgs · {timeAgo(s.updatedAt)}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(s._id); }}
                className={`opacity-0 group-hover:opacity-100 shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all
                  ${dark ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-300 hover:text-red-500'}`}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className={`p-3 border-t flex items-center justify-center gap-1.5 ${dark ? 'border-white/5' : 'border-gray-100'}`}>
        <Cpu className={`w-3 h-3 ${dark ? 'text-gray-600' : 'text-gray-400'}`} />
        <span className={`text-[10px] ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
          Powered by Groq · {userName}
        </span>
      </div>
    </>
  );
}
