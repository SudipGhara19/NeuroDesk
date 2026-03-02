const path = require('path');
const Document = require('../models/document.model');
const UserData = require('../models/userData.model');
const { processDocument, deleteDocumentVectors } = require('../services/document.service');
const { ragQuery } = require('../services/rag.service');

// ─── POST /api/documents/upload ───────────────────────────────────────────────

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const ext = path.extname(originalname).replace('.', '').toLowerCase();
    const title = req.body.title || originalname.replace(/\.[^.]+$/, '');

    // 1. Create initial DB record (status: processing)
    const docRecord = await Document.create({
      title,
      fileName: originalname,
      fileType: ext,
      fileSize: size,
      uploadedBy: req.user.id,
      status: 'processing',
    });

    // 2. Track upload in UserData (increment docsUploaded counter)
    UserData.findOneAndUpdate(
      { userId: req.user.id },
      {
        $inc: { 'stats.docsUploaded': 1 },
        $set: { 'stats.lastActive': new Date() },
      },
      { upsert: true, new: true }
    ).catch((e) => console.warn('[UserData] Could not update upload stats:', e.message));

    // 3. Run pipeline asynchronously (non-blocking response)
    processDocument(docRecord, buffer).catch((err) => {
      console.error(`[Document] Pipeline failed for ${originalname}:`, err.message);
    });

    return res.status(202).json({
      message: 'Document uploaded. Processing started.',
      document: {
        _id: docRecord._id,          // must be _id so frontend poll works
        id: docRecord._id,           // also expose as id for compatibility
        title: docRecord.title,
        fileName: docRecord.fileName,
        fileType: docRecord.fileType,
        fileSize: docRecord.fileSize,
        status: docRecord.status,
        createdAt: docRecord.createdAt,
      },
    });
  } catch (err) {
    console.error('[Document] Upload error:', err);
    return res.status(500).json({ message: 'Upload failed.', error: err.message });
  }
};

// ─── GET /api/documents/ ──────────────────────────────────────────────────────

const listDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      Document.find()
        .populate('uploadedBy', 'fullName email role')  // fullName matches User model
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Document.countDocuments(),
    ]);

    return res.status(200).json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[Document] List error:', err);
    return res.status(500).json({ message: 'Failed to fetch documents.', error: err.message });
  }
};

// ─── GET /api/documents/:id ───────────────────────────────────────────────────

const getDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).populate(
      'uploadedBy',
      'fullName email role'  // fullName matches User model
    );

    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    return res.status(200).json({ document: doc });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch document.', error: err.message });
  }
};

// ─── DELETE /api/documents/:id ────────────────────────────────────────────────

const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // Delete from Pinecone first
    if (doc.pineconeNamespace) {
      await deleteDocumentVectors(doc.pineconeNamespace);
    }

    // Delete from MongoDB
    await Document.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (err) {
    console.error('[Document] Delete error:', err);
    return res.status(500).json({ message: 'Delete failed.', error: err.message });
  }
};

// ─── POST /api/documents/query ────────────────────────────────────────────────

const queryDocuments = async (req, res) => {
  try {
    const { query, topK, documentIds } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Query is required.' });
    }

    // If specific documents requested, get their namespaces
    let namespaces = [];
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      const docs = await Document.find({
        _id: { $in: documentIds },
        status: 'ready',
      }).select('pineconeNamespace');
      namespaces = docs.map((d) => d.pineconeNamespace).filter(Boolean);
    }

    const result = await ragQuery(query, { topK: topK || 5, namespaces });

    return res.status(200).json(result);
  } catch (err) {
    console.error('[RAG] Query error:', err);
    return res.status(500).json({ message: 'Query failed.', error: err.message });
  }
};

module.exports = {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
  queryDocuments,
};
