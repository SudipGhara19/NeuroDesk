import api from '@/lib/axios';
import { KBDocument, RAGResponse } from './types';

// Upload a document (multipart/form-data)
export async function uploadDocument(
  file: File,
  title: string,
  onProgress?: (pct: number) => void
): Promise<KBDocument> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);

  const { data } = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (evt.total) {
        onProgress?.(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });
  return data.document;
}

// List all documents
export async function listDocuments(
  page = 1,
  limit = 20
): Promise<{ documents: KBDocument[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
  const { data } = await api.get(`/documents/?page=${page}&limit=${limit}`);
  return data;
}

// Delete a document
export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}

// RAG Query
export async function queryKnowledgeBase(
  query: string,
  topK = 5,
  documentIds?: string[]
): Promise<RAGResponse> {
  const { data } = await api.post('/documents/query', { query, topK, documentIds });
  return data;
}

// Poll document status until ready/failed or timeout
export async function pollDocumentStatus(
  id: string,
  intervalMs = 2000,
  maxAttempts = 30
): Promise<KBDocument> {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await api.get(`/documents/${id}`);
    const doc = data.document as KBDocument;
    if (doc.status === 'ready' || doc.status === 'failed') return doc;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Document processing timed out.');
}

// Re-index a document with a new file (Admin/Manager only)
export async function reIndexDocument(
  id: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ message: string; document: Partial<KBDocument> }> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post(`/documents/${id}/reindex`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (evt.total) {
        onProgress?.(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });
  return data;
}
