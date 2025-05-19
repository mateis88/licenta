const express = require('express');
const router = express.Router();
const { uploadDocuments } = require('../controllers/document_controllers');
const { authenticateToken } = require('../middleware/auth');

// Route for uploading documents
router.post('/upload/documents', authenticateToken, uploadDocuments);

module.exports = router; 