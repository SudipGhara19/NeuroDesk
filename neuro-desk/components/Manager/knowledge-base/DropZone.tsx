'use client';

import { useRef, useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';

const ALLOWED = ['.pdf', '.txt', '.docx', '.md'];
const ALLOWED_MIME = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/markdown',
  'text/x-markdown',
];

interface Props {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  txt: '📝',
  docx: '📘',
  md: '📋',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DropZone({ onFileSelect, disabled }: Props) {
  const { theme } = useTheme();
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dark = theme === 'dark';

  const validate = (file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED.includes(ext) && !ALLOWED_MIME.includes(file.type)) {
      setError(`Unsupported type: ${ext}. Allowed: PDF, TXT, DOCX, MD`);
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File exceeds 20 MB limit.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleFile = (file: File) => {
    if (!validate(file)) return;
    setSelectedFile(file);
    onFileSelect(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const ext = selectedFile?.name.split('.').pop()?.toLowerCase() ?? '';
  const Icon = FILE_ICONS[ext] ?? '📎';

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center gap-3 select-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${dragging
          ? 'border-violet-500 bg-violet-500/10 scale-[1.01]'
          : dark
            ? 'border-white/10 hover:border-violet-500/50 hover:bg-white/5 bg-white/[0.02]'
            : 'border-gray-200 hover:border-violet-400/60 hover:bg-violet-50/30 bg-gray-50/60'
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ALLOWED.join(',')}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        disabled={disabled}
      />

      {/* Animated blob */}
      <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none
        ${dragging ? 'opacity-100' : 'opacity-0'}
        bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)]`}
      />

      {selectedFile ? (
        <>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg
            ${dark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
            {Icon}
          </div>
          <div className="text-center">
            <p className={`font-bold text-sm truncate max-w-xs ${dark ? 'text-white' : 'text-gray-800'}`}>
              {selectedFile.name}
            </p>
            <p className={`text-xs mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              {ext.toUpperCase()} · {formatBytes(selectedFile.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); onFileSelect(null as unknown as File); setError(null); }}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition-all
              ${dark ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
          >
            Change file
          </button>
        </>
      ) : (
        <>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
            ${dragging
              ? 'bg-violet-500/20 scale-110'
              : dark ? 'bg-white/5 group-hover:bg-violet-500/10' : 'bg-white group-hover:bg-violet-50'
            } shadow-sm`}>
            <svg className={`w-8 h-8 transition-colors ${dragging ? 'text-violet-400' : dark ? 'text-gray-500 group-hover:text-violet-400' : 'text-gray-400 group-hover:text-violet-500'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-2.32 5.75 5.75 0 0 1 1.442 11.095H6.75Z"/>
            </svg>
          </div>
          <div className="text-center">
            <p className={`font-bold text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Drop your file here, or <span className="text-violet-500">browse</span>
            </p>
            <p className={`text-xs mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              PDF, TXT, DOCX, MD — up to 20 MB
            </p>
          </div>
        </>
      )}

      {error && (
        <p className="text-xs font-semibold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg">
          {error}
        </p>
      )}
    </div>
  );
}
