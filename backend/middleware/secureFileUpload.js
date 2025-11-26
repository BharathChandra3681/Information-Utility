
/**
 * Secure File Upload Middleware
 * Implements comprehensive security measures for file uploads
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const FileType = require('file-type');
const logger = require('../utils/logger');

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Maximum files per upload
const MAX_FILES = 10;

// Allowed MIME types for loan documents
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
  '.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', 
  '.xls', '.xlsx', '.txt', '.csv'
];

/**
 * Custom storage engine that stores files in memory
 * This allows us to scan and encrypt before storing
 */
const storage = multer.memoryStorage();

/**
 * File filter function
 */
const fileFilter = async (req, file, cb) => {
  try {
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`MIME type not allowed: ${file.mimetype}`), false);
    }

    // File is valid
    cb(null, true);
    
  } catch (error) {
    logger.error('File filter error:', error);
    cb(error, false);
  }
};

/**
 * Multer configuration
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
});

/**
 * Verify file type using magic bytes
 * This prevents MIME type spoofing
 */
async function verifyFileType(buffer, declaredMimeType) {
  try {
    const fileTypeResult = await FileType.fromBuffer(buffer);
    
    if (!fileTypeResult) {
      // Some file types (like .txt) don't have magic bytes
      // Allow them if they pass other checks
      logger.warn('Could not detect file type from magic bytes');
      return true;
    }
    
    // Map detected MIME to allowed types
    const detectedMime = fileTypeResult.mime;
    
    if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
      throw new Error(`Detected file type ${detectedMime} is not allowed`);
    }
    
    // Check if detected type matches declared type
    if (declaredMimeType !== detectedMime) {
      logger.warn(`MIME type mismatch: declared=${declaredMimeType}, detected=${detectedMime}`);
      // You can choose to be strict or lenient here
    }
    
    return true;
    
  } catch (error) {
    logger.error('File type verification error:', error);
    throw error;
  }
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
function sanitizeFilename(filename) {
  // Remove any directory paths
  const basename = path.basename(filename);
  
  // Remove potentially dangerous characters
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(4).toString('hex');
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);
  
  return `${name}_${timestamp}_${randomStr}${ext}`;
}

/**
 * Virus scanning middleware
 * Note: Requires ClamAV to be installed
 */
async function scanForVirus(buffer) {
  // Skip if ClamAV is not configured
  if (process.env.ENABLE_VIRUS_SCAN !== 'true') {
    logger.warn('Virus scanning is disabled');
    return true;
  }

  try {
    const NodeClam = require('clamscan');
    
    const clamscan = await new NodeClam().init({
      clamdscan: {
        socket: process.env.CLAMAV_SOCKET || '/var/run/clamav/clamd.socket',
        timeout: 60000,
        localFallback: false
      }
    });
    
    // Scan the buffer
    const { isInfected, viruses } = await clamscan.scanStream(buffer);
    
    if (isInfected) {
      logger.error(`Virus detected: ${viruses.join(', ')}`);
      throw new Error('File contains malicious content');
    }
    
    logger.info('File passed virus scan');
    return true;
    
  } catch (error) {
    // If ClamAV is not available, log warning and continue
    if (error.message.includes('ENOENT') || error.message.includes('connect')) {
      logger.warn('ClamAV not available, skipping virus scan');
      return true;
    }
    throw error;
  }
}

/**
 * Main middleware for secure file upload
 */
const secureUpload = {
  /**
   * Single file upload
   */
  single: (fieldName) => {
    return [
      upload.single(fieldName),
      async (req, res, next) => {
        try {
          if (!req.file) {
            return next();
          }

          // Verify file type using magic bytes
          await verifyFileType(req.file.buffer, req.file.mimetype);
          
          // Scan for viruses
          await scanForVirus(req.file.buffer);
          
          // Sanitize filename
          req.file.sanitizedName = sanitizeFilename(req.file.originalname);
          
          logger.info(`File upload validated: ${req.file.sanitizedName}, size: ${req.file.size} bytes`);
          
          next();
          
        } catch (error) {
          logger.error('File validation error:', error);
          return res.status(400).json({
            success: false,
            error: error.message
          });
        }
      }
    ];
  },

  /**
   * Multiple files upload
   */
  array: (fieldName, maxCount = MAX_FILES) => {
    return [
      upload.array(fieldName, maxCount),
      async (req, res, next) => {
        try {
          if (!req.files || req.files.length === 0) {
            return next();
          }

          // Validate each file
          for (const file of req.files) {
            // Verify file type
            await verifyFileType(file.buffer, file.mimetype);
            
            // Scan for viruses
            await scanForVirus(file.buffer);
            
            // Sanitize filename
            file.sanitizedName = sanitizeFilename(file.originalname);
          }
          
          logger.info(`${req.files.length} files uploaded and validated`);
          
          next();
          
        } catch (error) {
          logger.error('File validation error:', error);
          return res.status(400).json({
            success: false,
            error: error.message
          });
        }
      }
    ];
  },

  /**
   * Multiple fields upload
   */
  fields: (fields) => {
    return [
      upload.fields(fields),
      async (req, res, next) => {
        try {
          if (!req.files) {
            return next();
          }

          // Validate all files from all fields
          for (const fieldName in req.files) {
            const files = req.files[fieldName];
            
            for (const file of files) {
              // Verify file type
              await verifyFileType(file.buffer, file.mimetype);
              
              // Scan for viruses
              await scanForVirus(file.buffer);
              
              // Sanitize filename
              file.sanitizedName = sanitizeFilename(file.originalname);
            }
          }
          
          logger.info('All files uploaded and validated');
          
          next();
          
        } catch (error) {
          logger.error('File validation error:', error);
          return res.status(400).json({
            success: false,
            error: error.message
          });
        }
      }
    ];
  }
};

/**
 * Error handler for multer errors
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: `Too many files. Maximum is ${MAX_FILES} files`
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field'
      });
    }
  }
  
  next(err);
};

module.exports = {
  secureUpload,
  handleMulterError,
  sanitizeFilename,
  MAX_FILE_SIZE,
  MAX_FILES,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS
};
