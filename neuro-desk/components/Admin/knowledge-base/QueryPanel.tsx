'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import { RAGResponse } from './types';
import { queryKnowledgeBase } from './api';
import { Search, FileText } from 'lucide-react';

interface Props {
  // Lifted state — managed by parent so result persists across tab switches
  query: string;
  setQuery: (q: string) => void;
  result: RAGResponse | null;
  setResult: (r: RAGResponse | null) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string | null;
  setError: (e: string | null) => void;
}

export default function QueryPanel({
  query, setQuery, result, setResult, loading, setLoading, error, setError
}: Props) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const handleQuery = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await queryKnowledgeBase(q);
      setResult(res);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e?.message || 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const confidenceColor =
    confidencePct >= 70 ? 'text-emerald-400' :
    confidencePct >= 40 ? 'text-amber-400' : 'text-red-400';
  const confidenceBarColor =
    confidencePct >= 70 ? 'bg-emerald-500' :
    confidencePct >= 40 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className={`rounded-2xl border flex flex-col transition-all ${
      dark ? 'bg-white/3 border-white/5' : 'bg-white border-gray-100 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center gap-3 shrink-0 ${dark ? 'border-white/5' : 'border-gray-100'}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
          ${dark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
          <Search className="w-4 h-4" />
        </div>
        <div>
          <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-gray-800'}`}>
            Query Knowledge Base
          </h3>
          <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
            Ask anything — results persist while you&apos;re on this page
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 overflow-y-auto">
        {/* Query input */}
        <div className={`flex gap-2 rounded-xl border overflow-hidden transition-all
          ${dark
            ? 'bg-white/5 border-white/10 focus-within:border-violet-500/50'
            : 'bg-gray-50 border-gray-200 focus-within:border-violet-400'
          }`}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleQuery(); }}
            placeholder="e.g. What are the main findings in the Q3 report?"
            rows={2}
            className={`flex-1 px-4 py-3 text-sm bg-transparent resize-none outline-none
              ${dark ? 'text-white placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'}`}
          />
          <button
            onClick={handleQuery}
            disabled={loading || !query.trim()}
            className={`m-2 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95
              ${loading || !query.trim()
                ? dark ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
              }`}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching
              </span>
            ) : 'Ask AI'}
          </button>
        </div>
        <p className={`text-[11px] ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
          Press <kbd className={`px-1 py-0.5 rounded text-[10px] font-mono ${dark ? 'bg-white/10' : 'bg-gray-100'}`}>Ctrl+Enter</kbd> to submit
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Answer */}
            <div className={`p-4 rounded-xl border ${
              dark ? 'bg-violet-500/5 border-violet-500/20' : 'bg-violet-50 border-violet-100'
            }`}>
              <p className={`text-xs font-black uppercase tracking-widest mb-2 ${
                dark ? 'text-violet-400' : 'text-violet-600'
              }`}>AI Answer</p>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${dark ? 'text-gray-200' : 'text-gray-700'}`}>
                {result.answer}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border ${dark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Confidence</p>
                <p className={`text-lg font-black ${confidenceColor}`}>{confidencePct}%</p>
                <div className={`mt-1.5 h-1 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  <div className={`h-full rounded-full transition-all ${confidenceBarColor}`} style={{ width: `${confidencePct}%` }} />
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${dark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Tokens Used</p>
                <p className={`text-lg font-black ${dark ? 'text-white' : 'text-gray-800'}`}>{result.tokens_used.toLocaleString()}</p>
              </div>
              <div className={`p-3 rounded-xl border ${dark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Latency</p>
                <p className={`text-lg font-black ${dark ? 'text-white' : 'text-gray-800'}`}>{result.latency_ms}ms</p>
              </div>
            </div>

            {/* Sources */}
            {result.sources.length > 0 && (
              <div>
                <p className={`text-xs font-black uppercase tracking-widest mb-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Sources</p>
                <div className="flex flex-wrap gap-2">
                  {result.sources.map((src) => (
                    <span key={src} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full
                      ${dark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      <FileText className="w-3.5 h-3.5" /> {src}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
