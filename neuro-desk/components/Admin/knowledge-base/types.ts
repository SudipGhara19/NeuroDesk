// Types for the Knowledge Base feature
export interface KBDocument {
  _id: string;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'txt' | 'docx' | 'md';
  fileSize: number;
  status: 'processing' | 'ready' | 'failed';
  chunkCount: number;
  version: number;
  uploadedBy: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RAGResponse {
  answer: string;
  sources: string[];
  confidence: number;
  tokens_used: number;
  latency_ms: number;
  model?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadState {
  file: File | null;
  title: string;
  status: FileStatus;
  progress: number;
  error: string | null;
}
