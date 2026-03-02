const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { randomUUID } = require('crypto');
const { embedTexts } = require('./embedding.service'); // free local MiniLM-L6-v2 (384 dims)
const { getPineconeIndex } = require('../config/pinecone');
const Document = require('../models/document.model');

// ─── Text Extraction ─────────────────────────────────────────────────────────

async function extractText(fileBuffer, mimetype, originalname) {
  const ext = originalname.split('.').pop().toLowerCase();

  if (ext === 'pdf' || mimetype === 'application/pdf') {
    const data = await pdfParse(fileBuffer);
    return data.text;
  }

  if (
    ext === 'docx' ||
    mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  }

  if (['txt', 'md'].includes(ext)) {
    return fileBuffer.toString('utf-8');
  }

  throw new Error(`Unsupported file type: .${ext}`);
}

// ─── Chunking ─────────────────────────────────────────────────────────────────
// Sliding window: ~500 words per chunk, 50 word overlap

function chunkText(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];

  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push(words.slice(start, end).join(' '));
    if (end === words.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
}

// ─── Pinecone Upsert ──────────────────────────────────────────────────────────

async function upsertChunksToPinecone(namespace, chunks, embeddings, docMeta) {
  const index = await getPineconeIndex();
  const ns = index.namespace(namespace);

  // Ensure each embedding is a plain JS number[] (Pinecone SDK rejects TypedArrays
  // like Float32Array — it silently filters them, resulting in an empty records list)
  const vectors = chunks.map((text, i) => {
    const rawEmbedding = embeddings[i];

    // Convert to plain JS number[] (Pinecone SDK v7 rejects TypedArrays / NaN / Infinity)
    let values;
    if (Array.isArray(rawEmbedding)) {
      values = rawEmbedding.map(Number);
    } else if (rawEmbedding != null) {
      values = Array.from(rawEmbedding); // handles Float32Array
    } else {
      values = [];
    }

    return {
      id: `${namespace}_chunk_${i}_${randomUUID()}`,
      values,
      metadata: {
        docId: docMeta.docId,
        fileName: docMeta.fileName,
        fileType: docMeta.fileType,
        chunkIndex: i,
        text: text.slice(0, 1000),
      },
    };
  }).filter(v => {
    // Guard: skip empty embeddings AND embeddings containing non-finite numbers
    // (Pinecone SDK v7 silently drops records with invalid values before the HTTP call)
    if (v.values.length === 0) return false;
    const allFinite = v.values.every(n => Number.isFinite(n));
    if (!allFinite) {
      console.warn(`[Upsert] Skipping chunk ${v.metadata.chunkIndex} — contains non-finite values`);
      return false;
    }
    return true;
  });

  console.log(`[Upsert] ${vectors.length} valid vectors (dim=${vectors[0]?.values?.length ?? 0})`);

  if (vectors.length === 0) {
    throw new Error('Embedding produced 0 valid vectors — check model output.');
  }

  // Upsert in batches of 100 (Pinecone limit per request)
  // NOTE: Pinecone SDK v7 changed the API — must pass { records: [...] }, NOT a bare array
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await ns.upsert({ records: batch });
  }

  return vectors.length;
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

async function processDocument(docRecord, fileBuffer) {
  try {
    // 1. Extract text from file
    const rawText = await extractText(
      fileBuffer,
      docRecord.fileType,
      docRecord.fileName
    );

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No extractable text found in document.');
    }

    // 2. Split into chunks
    const chunks = chunkText(rawText, 500, 50);
    console.log(`[Pipeline] ${docRecord.fileName}: ${chunks.length} chunks`);

    // 3. Embed all chunks using local MiniLM-L6-v2 (free, no quota)
    console.log(`[Pipeline] Embedding ${chunks.length} chunks locally...`);
    const embeddings = await embedTexts(chunks);
    console.log(`[Pipeline] Embedding done. Upserting to Pinecone...`);

    // 4. Upsert vectors to Pinecone
    const namespace = docRecord._id.toString();
    const vectorCount = await upsertChunksToPinecone(
      namespace,
      chunks,
      embeddings,
      {
        docId: docRecord._id.toString(),
        fileName: docRecord.fileName,
        fileType: docRecord.fileType,
      }
    );

    console.log(`[Pipeline] ${docRecord.fileName}: ${vectorCount} vectors upserted.`);

    // 5. Update MongoDB record
    docRecord.chunkCount = vectorCount;
    docRecord.pineconeNamespace = namespace;
    docRecord.status = 'ready';
    await docRecord.save();

    return docRecord;
  } catch (err) {
    console.error(`[Pipeline] FAILED for ${docRecord.fileName}:`, err.message);
    docRecord.status = 'failed';
    docRecord.errorMessage = err.message;
    await docRecord.save();
    throw err;
  }
}

// ─── Delete Document Vectors ──────────────────────────────────────────────────

async function deleteDocumentVectors(namespace) {
  const index = await getPineconeIndex();
  const ns = index.namespace(namespace);
  await ns.deleteAll();
}

module.exports = { processDocument, deleteDocumentVectors };
