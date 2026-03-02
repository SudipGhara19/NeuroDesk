'use client';

import { useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface Props {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  dark: boolean;
  modelName: string;
}

export default function ChatInput({ input, setInput, onSend, sending, dark, modelName }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <div className={`p-4 border-t shrink-0 ${dark ? 'border-white/5' : 'border-gray-100'}`}>
      <div className={`flex items-end gap-2 rounded-2xl border px-4 py-2 transition-all
        ${dark
          ? 'bg-white/5 border-white/10 focus-within:border-violet-500/40 focus-within:shadow-lg focus-within:shadow-violet-500/5'
          : 'bg-gray-50 border-gray-200 focus-within:border-violet-400 focus-within:shadow-lg focus-within:shadow-violet-500/5'
        }`}>
        <textarea
          ref={ref}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
          }}
          placeholder="Ask anything about your knowledge base..."
          rows={1}
          className={`flex-1 resize-none outline-none text-sm py-1.5 bg-transparent max-h-32
            ${dark ? 'text-white placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'}`}
          style={{ minHeight: '24px' }}
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = '24px';
            t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
          }}
        />
        <button onClick={onSend} disabled={sending || !input.trim()}
          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90
            ${sending || !input.trim()
              ? dark ? 'bg-white/5 text-gray-600' : 'bg-gray-100 text-gray-400'
              : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20'
            }`}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      <p className={`text-[10px] mt-1.5 text-center ${dark ? 'text-gray-700' : 'text-gray-300'}`}>
        Enter to send · Shift+Enter for new line · Using {modelName}
      </p>
    </div>
  );
}
