'use client';

import { Bot, ChevronDown } from 'lucide-react';
import { MODEL_ICONS, DEFAULT_MODEL_ICON } from './constants';
import type { AiModel } from './types';

interface Props {
  models: AiModel[];
  selectedModel: string;
  onSelect: (id: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  dark: boolean;
}

export default function ModelPicker({ models, selectedModel, onSelect, open, setOpen, dark }: Props) {
  const current = models.find((m) => m.id === selectedModel);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
          ${dark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
        {MODEL_ICONS[selectedModel] || DEFAULT_MODEL_ICON}
        <span>{current?.name || selectedModel}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 top-full mt-2 w-72 rounded-xl border shadow-2xl z-50 overflow-hidden
            ${dark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200'}`}>
            <div className={`px-3 py-2 border-b ${dark ? 'border-white/5' : 'border-gray-100'}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Select Model</p>
            </div>
            {models.map((m) => (
              <button key={m.id}
                onClick={() => { onSelect(m.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all
                  ${selectedModel === m.id
                    ? dark ? 'bg-violet-500/10' : 'bg-violet-50'
                    : dark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                  }`}>
                <span className="shrink-0">{MODEL_ICONS[m.id] || DEFAULT_MODEL_ICON}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>{m.name}</p>
                  <p className={`text-[10px] mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{m.description}</p>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase
                  ${m.speed === 'fast' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {m.speed}
                </span>
                {selectedModel === m.id && (
                  <svg className="w-4 h-4 text-violet-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
