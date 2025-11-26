/**
 * File Upload Middleware
 * Handles multipart/form-data file uploads for loan documents
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/loan-documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomhash-originalname
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

// File filter - only allow specific document types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, Word, and Excel documents are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10 // Maximum 10 files per upload
  }
});

/**
 * Process uploaded files and create metadata
 */
const processDocuments = (files) => {
  if (!files || files.length === 0) {
    return [];
  }

  return files.map(file => ({
    documentId: `DOC-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
    storedFileName: file.filename,
    filePath: file.path,
    uploadedAt: new Date().toISOString(),
    hash: generateFileHash(file.path)
  }));
};

/**
 * Generate SHA256 hash of file for integrity verification
 */
const generateFileHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
};

/**
 * Delete uploaded files (cleanup on error)
 */
const deleteFiles = (files) => {
  if (!files || files.length === 0) return;

  files.forEach(file => {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error(`Error deleting file ${file.path}:`, error);
    }
  });
};

module.exports = {
  upload,
  processDocuments,
  deleteFiles,
  uploadDir
};
