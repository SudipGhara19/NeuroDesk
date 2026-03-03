'use client';

import { KBDocument } from './types';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Archive, FileText, Book, File, ClipboardList, Paperclip, RefreshCw } from 'lucide-react';
import { useRef, useState } from 'react';
import { reIndexDocument } from './api';

interface Props {
  documents: KBDocument[];
  loading: boolean;
  onDelete: (doc: KBDocument) => void;
  onReIndex?: () => void;
}

const STATUS_CONFIG = {
  ready: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    label: 'Ready',
  },
  processing: {
    dot: 'bg-amber-400 animate-pulse',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    label: 'Processing…',
  },
  failed: {
    dot: 'bg-red-500',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    label: 'Failed',
  },
};

const FILE_COLORS: Record<string, string> = {
  pdf: 'text-red-400 bg-red-500/10',
  docx: 'text-blue-400 bg-blue-500/10',
  txt: 'text-gray-400 bg-gray-500/10',
  md: 'text-purple-400 bg-purple-500/10',
};

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5" />,
  docx: <Book className="w-5 h-5" />,
  txt: <File className="w-5 h-5" />,
  md: <ClipboardList className="w-5 h-5" />,
};

function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SkeletonRow({ dark }: { dark: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl animate-pulse ${dark ? 'bg-white/5' : 'bg-gray-50'}`}>
      <div className={`w-10 h-10 rounded-lg ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
      <div className="flex-1 space-y-2">
        <div className={`h-3 w-48 rounded ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
        <div className={`h-2 w-32 rounded ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
      </div>
      <div className={`h-6 w-20 rounded-full ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
      <div className={`w-8 h-8 rounded-lg ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
    </div>
  );
}

export default function DocumentList({ documents, loading, onDelete, onReIndex }: Props) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [reIndexingId, setReIndexingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleReIndex = async (doc: KBDocument, file: File) => {
    setReIndexingId(doc._id);
    try {
      await reIndexDocument(doc._id, file);
      onReIndex?.();
    } catch (err) {
      console.error('[ReIndex] Failed:', err);
    } finally {
      setReIndexingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} dark={dark} />)
        : documents.length === 0
          ? (
            <div className={`flex flex-col items-center justify-center py-16 rounded-xl border border-dashed
              ${dark ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
              <div className="text-4xl mb-3 text-gray-400">
                <Archive className="w-12 h-12" />
              </div>
              <p className="font-semibold text-sm">No documents yet</p>
              <p className="text-xs mt-1">Upload your first document to get started</p>
            </div>
          )
          : documents.map((doc) => {
            const status = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.processing;
            const fileColor = FILE_COLORS[doc.fileType] ?? FILE_COLORS.txt;
            const fileIcon = FILE_ICONS[doc.fileType] ?? <Paperclip className="w-5 h-5" />;

            return (
              <div
                key={doc._id}
                className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
                  ${dark
                    ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                  }`}
              >
                {/* File type icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${fileColor}`}>
                  {fileIcon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${dark ? 'text-white' : 'text-gray-800'}`}>
                    {doc.title}
                  </p>
                  <div className={`flex items-center gap-2 text-xs mt-0.5 flex-wrap ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span className={`uppercase font-bold px-1.5 py-0.5 rounded text-[10px] ${fileColor}`}>
                      {doc.fileType}
                    </span>
                    <span>{formatBytes(doc.fileSize)}</span>
                    <span>·</span>
                    <span>{doc.chunkCount > 0 ? `${doc.chunkCount} chunks` : '—'}</span>
                    <span>·</span>
                    <span title={new Date(doc.createdAt).toLocaleString()}>
                      {timeAgo(doc.createdAt)}
                    </span>
                    <span>·</span>
                    <span>by {doc.uploadedBy?.fullName ?? '—'}</span>
                  </div>
                  {doc.status === 'failed' && doc.errorMessage && (
                    <p className="text-xs text-red-400 mt-1 truncate">{doc.errorMessage}</p>
                  )}
                </div>

                {/* Status badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold flex-shrink-0 ${status.bg} ${status.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </div>

                {/* Version badge */}
                {doc.version >= 1 && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex-shrink-0 ${dark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    v{doc.version}
                  </span>
                )}

                {/* Re-Index button */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.docx"
                    className="hidden"
                    ref={(el) => { fileInputRefs.current[doc._id] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleReIndex(doc, file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => fileInputRefs.current[doc._id]?.click()}
                    disabled={reIndexingId === doc._id || doc.status === 'processing'}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                      ${dark
                        ? 'hover:bg-blue-500/20 text-gray-500 hover:text-blue-400'
                        : 'hover:bg-blue-50 text-gray-400 hover:text-blue-500'
                      }`}
                    title="Re-Index document with updated file"
                  >
                    <RefreshCw className={`w-4 h-4 ${reIndexingId === doc._id ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => onDelete(doc)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200
                    ${dark
                      ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400'
                      : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                    }`}
                  title="Delete document"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                  </svg>
                </button>
              </div>
            );
          })
      }
    </div>
  );
}
