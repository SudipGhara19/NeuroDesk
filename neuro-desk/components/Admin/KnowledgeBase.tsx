'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import UploadPanel from './knowledge-base/UploadPanel';
import DocumentList from './knowledge-base/DocumentList';
import QueryPanel from './knowledge-base/QueryPanel';
import { KBDocument, RAGResponse } from './knowledge-base/types';
import { listDocuments, deleteDocument } from './knowledge-base/api';
import { Lock, ClipboardList, Upload, Search, Brain, BookOpen, CheckCircle2, Clock, Hash, FileText } from 'lucide-react';

type ActiveTab = 'documents' | 'upload' | 'query';

interface ConfirmState { open: boolean; doc: KBDocument | null; }

function StatCard({ label, value, icon, color, dark }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; dark: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${dark ? 'bg-white/3 border-white/5' : 'bg-white border-gray-100'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className={`text-xl font-black leading-none ${dark ? 'text-white' : 'text-gray-800'}`}>{value}</p>
        <p className={`text-[11px] font-semibold mt-0.5 uppercase tracking-wider ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
      </div>
    </div>
  );
}

export default function KnowledgeBase() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const user = useSelector(selectCurrentUser);

  const [activeTab, setActiveTab] = useState<ActiveTab>('documents');
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, doc: null });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Lifted query state — persists across tab switches ──────────────────────
  const [queryText, setQueryText] = useState('');
  const [queryResult, setQueryResult] = useState<RAGResponse | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const canAccess = user?.role === 'Admin' || user?.role === 'Manager';

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listDocuments(1, 50);
      setDocuments(res.documents);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUploaded = (doc: KBDocument) => {
    setDocuments((prev) => {
      const exists = prev.find((d) => d._id === doc._id);
      return exists ? prev.map((d) => (d._id === doc._id ? doc : d)) : [doc, ...prev];
    });
    setActiveTab('documents');
    setTimeout(fetchDocs, 3000);
  };

  const handleDeleteConfirm = async () => {
    if (!confirm.doc) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteDocument(confirm.doc._id);
      setDocuments((prev) => prev.filter((d) => d._id !== confirm.doc?._id));
      setConfirm({ open: false, doc: null });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setDeleteError(e?.response?.data?.message || e?.message || 'Delete failed');
    } finally { setDeleting(false); }
  };

  const ready = documents.filter((d) => d.status === 'ready').length;
  const processing = documents.filter((d) => d.status === 'processing').length;
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunkCount || 0), 0);

  if (!canAccess) {
    return (
      <div className={`rounded-2xl border flex flex-col items-center justify-center py-20 gap-4
        ${dark ? 'bg-white/3 border-white/5 text-gray-400' : 'bg-white border-gray-100 text-gray-400'}`}>
        <div className="text-gray-500 mb-2">
          <Lock className="w-12 h-12" />
        </div>
        <p className="font-bold">Access Restricted</p>
        <p className="text-sm">Only Admins and Managers can manage the Knowledge Base.</p>
      </div>
    );
  }

  const TABS = [
    { id: 'documents' as ActiveTab, label: 'Documents', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'upload'    as ActiveTab, label: 'Upload',    icon: <Upload className="w-4 h-4" />  },
    { id: 'query'     as ActiveTab, label: 'Query AI',  icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-4">

      {/* ── Header card ──────────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border overflow-hidden shrink-0 ${dark ? 'bg-white/3 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
        {/* Gradient top bar */}
        <div className="h-1 w-full bg-linear-to-r from-violet-600 via-purple-500 to-pink-500" />

        <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg
              ${dark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-xl font-black ${dark ? 'text-white' : 'text-gray-800'}`}>Knowledge Base</h2>
              <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Upload, index & query via Pinecone RAG</p>
            </div>
          </div>
          <button onClick={fetchDocs} disabled={loading}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95
              ${dark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 pb-4">
          <StatCard label="Total Docs"    value={documents.length}              icon={<BookOpen className="w-4 h-4" />} color={dark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}  dark={dark} />
          <StatCard label="Indexed"       value={ready}                          icon={<CheckCircle2 className="w-4 h-4" />} color={dark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'} dark={dark} />
          <StatCard label="Processing"    value={processing}                     icon={<Clock className="w-4 h-4" />} color={dark ? 'bg-amber-500/20 text-amber-400'   : 'bg-amber-100 text-amber-600'}   dark={dark} />
          <StatCard label="Total Chunks"  value={totalChunks.toLocaleString()}  icon={<Hash className="w-4 h-4" />} color={dark ? 'bg-blue-500/20 text-blue-400'    : 'bg-blue-100 text-blue-600'}    dark={dark} />
        </div>

        {/* Tab nav */}
        <div className={`px-6 border-t flex gap-1 ${dark ? 'border-white/5' : 'border-gray-100'}`}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-all relative
                ${activeTab === tab.id
                  ? dark ? 'text-violet-400' : 'text-violet-600'
                  : dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                }`}>
              <span>{tab.icon}</span>
              {tab.label}
              {/* Badge for query result */}
              {tab.id === 'query' && queryResult && (
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 ml-0.5" />
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-violet-600 to-purple-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content — fills remaining height ─────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'documents' && (
          <div className={`h-full rounded-2xl border p-4 md:p-6 flex flex-col
            ${dark ? 'bg-white/3 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className={`text-sm font-black uppercase tracking-widest ${dark ? 'text-gray-400' : 'text-gray-500'}`}>All Documents</h3>
              <button onClick={() => setActiveTab('upload')}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg
                  bg-linear-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all active:scale-95">
                + Upload New
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <DocumentList documents={documents} loading={loading} onDelete={(doc) => setConfirm({ open: true, doc })} onReIndex={fetchDocs} />
            </div>
          </div>
        )}

        {activeTab === 'upload' && <UploadPanel onUploaded={handleUploaded} />}

        {/* Query tab — uses lifted state so result survives tab switches */}
        {activeTab === 'query' && (
          <QueryPanel
            query={queryText}       setQuery={setQueryText}
            result={queryResult}    setResult={setQueryResult}
            loading={queryLoading}  setLoading={setQueryLoading}
            error={queryError}      setError={setQueryError}
          />
        )}
      </div>

      {/* ── Delete Confirm Modal ──────────────────────────────────────────────── */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !deleting && setConfirm({ open: false, doc: null })}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className={`relative w-full max-w-md rounded-2xl border p-6 space-y-4
            ${dark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200 shadow-2xl'}`}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916"/>
                </svg>
              </div>
              <div>
                <h4 className={`font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>Delete Document</h4>
                <p className={`text-xs mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  This removes the document and purges all vectors from Pinecone.
                </p>
              </div>
            </div>

            <div className={`p-3 rounded-xl text-sm font-semibold flex items-center gap-1.5 ${dark ? 'bg-white/5 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
              <FileText className="w-4 h-4" /> {confirm.doc?.title}
              <span className={`ml-2 text-xs font-normal ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                · uploaded by {(confirm.doc?.uploadedBy as { fullName?: string })?.fullName ?? '—'}
                · {confirm.doc?.chunkCount ?? 0} chunks
              </span>
            </div>

            {deleteError && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{deleteError}</p>}

            <div className="flex gap-3">
              <button onClick={() => !deleting && setConfirm({ open: false, doc: null })} disabled={deleting}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                  ${dark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-all active:scale-95 disabled:opacity-60">
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting…
                  </span>
                ) : 'Delete & Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
