'use client';

import { Trash2 } from 'lucide-react';

interface Props {
  dark: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ dark, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={`relative w-full max-w-sm rounded-2xl border p-5 space-y-4
        ${dark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200 shadow-2xl'}`}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h4 className={`font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>Delete conversation?</h4>
            <p className={`text-xs mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all
              ${dark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-all active:scale-95">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
