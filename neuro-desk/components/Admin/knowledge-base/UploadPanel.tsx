'use client';

import { useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import DropZone from './DropZone';
import { uploadDocument, pollDocumentStatus } from './api';
import { KBDocument } from './types';
import { Upload, CheckCircle2 } from 'lucide-react';

interface Props {
  onUploaded: (doc: KBDocument) => void;
}

type Phase = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export default function UploadPanel({ onUploaded }: Props) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<KBDocument | null>(null);

  const reset = () => {
    setFile(null);
    setTitle('');
    setPhase('idle');
    setUploadPct(0);
    setError(null);
    setSuccess(null);
  };

  const handleFileSelect = (f: File) => {
    setFile(f);
    setError(null);
    // Auto-fill title from filename
    if (!title) {
      setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setPhase('uploading');
    setError(null);

    try {
      // Step 1: upload
      const doc = await uploadDocument(file, title || file.name, (pct) => setUploadPct(pct));

      // Step 2: poll until ready
      setPhase('processing');
      const finalDoc = await pollDocumentStatus(doc._id);

      if (finalDoc.status === 'failed') {
        throw new Error(finalDoc.errorMessage || 'Processing failed on server.');
      }

      setPhase('done');
      setSuccess(finalDoc);
      onUploaded(finalDoc);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setPhase('error');
      setError(e?.response?.data?.message || e?.message || 'Upload failed');
    }
  };

  const busy = phase === 'uploading' || phase === 'processing';

  return (
    <div className={`rounded-2xl border transition-all ${
      dark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-gray-100 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center gap-3 ${dark ? 'border-white/5' : 'border-gray-100'}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
          ${dark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
          <Upload className="w-4 h-4" />
        </div>
        <div>
          <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-gray-800'}`}>
            Upload Document
          </h3>
          <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
            File is parsed, chunked, embedded, and synced to Pinecone automatically
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Success state */}
        {phase === 'done' && success ? (
          <div className={`p-5 rounded-2xl border text-center space-y-3 ${
            dark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'
          }`}>
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
            <div>
              <p className="font-bold text-emerald-500">Successfully Synced!</p>
              <p className={`text-xs mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className="font-semibold">{success.title}</span> · {success.chunkCount} chunks indexed in Pinecone
              </p>
            </div>
            <button
              onClick={reset}
              className="text-xs font-bold px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-all"
            >
              Upload Another
            </button>
          </div>
        ) : (
          <>
            {/* Drop zone */}
            <DropZone onFileSelect={handleFileSelect} disabled={busy} />

            {/* Title input */}
            {file && (
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={file.name.replace(/\.[^.]+$/, '')}
                  disabled={busy}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                    ${dark
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-violet-500/50'
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-violet-400'
                    } disabled:opacity-50`}
                />
              </div>
            )}

            {/* Progress bar */}
            {(phase === 'uploading' || phase === 'processing') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {phase === 'uploading' ? `Uploading… ${uploadPct}%` : 'Processing & indexing in Pinecone…'}
                  </span>
                  <span className="w-3 h-3 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-gray-100'}`}>
                  {phase === 'uploading'
                    ? <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
                    : <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full animate-[progressPulse_1.5s_ease-in-out_infinite]" style={{ width: '100%' }} />
                  }
                </div>
                {phase === 'processing' && (
                  <p className={`text-[11px] ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                    This may take a few seconds depending on document size…
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={!file || busy}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98]
                ${!file || busy
                  ? dark ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25'
                }`}
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {phase === 'uploading' ? 'Uploading…' : 'Indexing…'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload & Sync to Vector DB
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
