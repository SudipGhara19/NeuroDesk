import React from 'react';
import {
  Zap,
  Sparkles,
  Gem,
  Wind,
  Bot,
} from 'lucide-react';

// ─── Model icon mapping ──────────────────────────────────────────────────────

export const MODEL_ICONS: Record<string, React.ReactNode> = {
  'llama-3.1-8b-instant': <Zap className="w-4 h-4 text-amber-400" />,
  'llama-3.3-70b-versatile': <Sparkles className="w-4 h-4 text-violet-400" />,
  'openai/gpt-oss-120b': <Gem className="w-4 h-4 text-cyan-400" />,
  'meta-llama/llama-4-scout-17b-16e-instruct': <Wind className="w-4 h-4 text-emerald-400" />,
};

export const DEFAULT_MODEL_ICON = <Bot className="w-4 h-4" />;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
