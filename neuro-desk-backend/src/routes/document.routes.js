const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
  queryDocuments,
} = require('../controllers/document.controller');

// POST /api/documents/upload — any authenticated user can upload
router.post(
  '/upload',
  verifyToken,
  upload.single('file'),
  uploadDocument
);

// POST /api/documents/query — any authenticated user can query
router.post('/query', verifyToken, queryDocuments);

// GET /api/documents/ — list all documents
router.get('/', verifyToken, listDocuments);

// GET /api/documents/:id — get single document
router.get('/:id', verifyToken, getDocument);

// DELETE /api/documents/:id — admin/manager only
router.delete(
  '/:id',
  verifyToken,
  restrictTo('Admin', 'Manager'),  // match User model enum: 'Admin'|'Manager'|'User'
  deleteDocument
);

module.exports = router;
