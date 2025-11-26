
/**
 * Document Storage Service using MongoDB GridFS
 * Handles encryption, hashing, and secure storage of loan documents
 */

const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const crypto = require('crypto');
const stream = require('stream');
const logger = require('../utils/logger');

class DocumentStorageService {
  constructor() {
    this.client = null;
    this.db = null;
    this.bucket = null;
    this.connected = false;

    // Encryption configuration
    this.algorithm = 'aes-256-gcm';
    this.encryptionKey = process.env.DOCUMENT_ENCRYPTION_KEY ||
      crypto.randomBytes(32); // 256-bit key

    // Ensure key is exactly 32 bytes
    if (typeof this.encryptionKey === 'string') {
      this.encryptionKey = Buffer.from(this.encryptionKey, 'hex');
    }

    if (this.encryptionKey.length !== 32) {
      throw new Error('Encryption key must be 32 bytes for AES-256');
    }
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const dbName = process.env.MONGODB_DB_NAME || 'iu_documents';

      this.client = new MongoClient(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      await this.client.connect();
      this.db = this.client.db(dbName);
      this.bucket = new GridFSBucket(this.db, {
        bucketName: 'loan_documents'
      });

      this.connected = true;
      logger.info('Connected to MongoDB GridFS');

      // Create indexes for metadata
      await this.db.collection('loan_documents.files').createIndex({
        'metadata.loanId': 1
      });
      await this.db.collection('loan_documents.files').createIndex({
        'metadata.documentHash': 1
      });
      await this.db.collection('loan_documents.files').createIndex({
        'metadata.uploadedBy': 1
      });

      // Create access log collection
      await this.db.collection('document_access_logs').createIndex({
        documentId: 1,
        timestamp: -1
      });

    } catch (error) {
      logger.error('MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.connected = false;
      logger.info('Disconnected from MongoDB');
    }
  }

  /**
   * Generate hash of document before encryption
   * This hash will be stored on blockchain for integrity verification
   */
  generateDocumentHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Encrypt document buffer
   * Returns { encrypted: Buffer, iv: Buffer, authTag: Buffer }
   */
  encryptDocument(buffer) {
    try {
      // Generate random IV (Initialization Vector)
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(buffer),
        cipher.final()
      ]);

      // Get auth tag for GCM mode
      const authTag = cipher.getAuthTag();

      return { encrypted, iv, authTag };
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Document encryption failed');
    }
  }

  /**
   * Decrypt document buffer
   */
  decryptDocument(encryptedBuffer, iv, authTag) {
    try {
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      const decrypted = Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final()
      ]);

      return decrypted;
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Document decryption failed');
    }
  }

  /**
   * Store document in GridFS with encryption
   * @param {Buffer} fileBuffer - Original file buffer
   * @param {Object} metadata - Document metadata
   * @returns {Object} - { fileId, hash, metadata }
   */
  async storeDocument(fileBuffer, metadata) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      // 1. Generate hash BEFORE encryption (for blockchain verification)
      const documentHash = this.generateDocumentHash(fileBuffer);

      // 2. Encrypt the document
      const { encrypted, iv, authTag } = this.encryptDocument(fileBuffer);

      // 3. Prepare metadata
      const enhancedMetadata = {
        ...metadata,
        documentHash,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        encrypted: true,
        uploadedAt: new Date(),
        fileSize: fileBuffer.length,
        encryptedSize: encrypted.length
      };

      // 4. Store in GridFS
      const uploadStream = this.bucket.openUploadStream(metadata.filename, {
        metadata: enhancedMetadata,
        contentType: metadata.mimetype
      });

      // Create readable stream from encrypted buffer
      const bufferStream = new stream.PassThrough();
      bufferStream.end(encrypted);

      // Upload to GridFS
      await new Promise((resolve, reject) => {
        bufferStream
          .pipe(uploadStream)
          .on('finish', resolve)
          .on('error', reject);
      });

      logger.info(`Document stored: ${uploadStream.id} with hash: ${documentHash}`);

      return {
        fileId: uploadStream.id.toString(),
        documentHash,
        metadata: enhancedMetadata
      };

    } catch (error) {
      logger.error('Document storage error:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt document from GridFS
   * @param {string} fileId - GridFS file ID
   * @returns {Object} - { buffer, metadata }
   */
  async retrieveDocument(fileId) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      // Get file metadata first
      const files = await this.bucket.find({
        _id: new ObjectId(fileId)
      }).toArray();

      if (files.length === 0) {
        throw new Error('Document not found');
      }

      const fileMetadata = files[0].metadata;

      // Download encrypted file
      const downloadStream = this.bucket.openDownloadStream(new ObjectId(fileId));

      // Collect chunks
      const chunks = [];
      for await (const chunk of downloadStream) {
        chunks.push(chunk);
      }
      const encryptedBuffer = Buffer.concat(chunks);

      // Decrypt the document
      const iv = Buffer.from(fileMetadata.iv, 'hex');
      const authTag = Buffer.from(fileMetadata.authTag, 'hex');
      const decryptedBuffer = this.decryptDocument(encryptedBuffer, iv, authTag);

      // Verify hash
      const computedHash = this.generateDocumentHash(decryptedBuffer);
      if (computedHash !== fileMetadata.documentHash) {
        throw new Error('Document integrity check failed - hash mismatch');
      }

      return {
        buffer: decryptedBuffer,
        metadata: fileMetadata,
        filename: files[0].filename
      };

    } catch (error) {
      logger.error('Document retrieval error:', error);
      throw error;
    }
  }

  /**
   * Get document metadata without downloading the file
   */
  async getDocumentMetadata(fileId) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const files = await this.bucket.find({
        _id: new ObjectId(fileId)
      }).toArray();

      if (files.length === 0) {
        throw new Error('Document not found');
      }

      return {
        fileId: files[0]._id.toString(),
        filename: files[0].filename,
        length: files[0].length,
        uploadDate: files[0].uploadDate,
        metadata: files[0].metadata
      };

    } catch (error) {
      logger.error('Error fetching metadata:', error);
      throw error;
    }
  }

  /**
   * List all documents for a loan
   */
  async listDocumentsByLoan(loanId) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const files = await this.bucket.find({
        'metadata.loanId': loanId
      }).toArray();

      return files.map(file => ({
        fileId: file._id.toString(),
        filename: file.filename,
        size: file.length,
        uploadDate: file.uploadDate,
        documentType: file.metadata.documentType,
        documentHash: file.metadata.documentHash,
        uploadedBy: file.metadata.uploadedBy
      }));

    } catch (error) {
      logger.error('Error listing documents:', error);
      throw error;
    }
  }

  /**
   * Delete document from GridFS
   * Note: Consider soft-delete for compliance
   */
  async deleteDocument(fileId, reason = 'User requested deletion') {
    if (!this.connected) {
      await this.connect();
    }

    try {
      // Log deletion for audit trail
      await this.db.collection('document_deletions').insertOne({
        fileId,
        deletedAt: new Date(),
        reason
      });

      // Delete from GridFS
      await this.bucket.delete(new ObjectId(fileId));

      logger.info(`Document deleted: ${fileId}, reason: ${reason}`);

    } catch (error) {
      logger.error('Document deletion error:', error);
      throw error;
    }
  }

  /**
   * Log document access for audit trail
   */
  async logDocumentAccess(fileId, userId, action, metadata = {}) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      await this.db.collection('document_access_logs').insertOne({
        documentId: fileId,
        userId,
        action, // 'view', 'download', 'verify'
        timestamp: new Date(),
        metadata,
        ipAddress: metadata.ipAddress || 'unknown'
      });

    } catch (error) {
      logger.error('Error logging document access:', error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }

  /**
   * Verify document integrity against blockchain hash
   */
  async verifyDocumentIntegrity(fileId, blockchainHash) {
    try {
      const { buffer, metadata } = await this.retrieveDocument(fileId);

      // Compare stored hash with blockchain hash
      if (metadata.documentHash !== blockchainHash) {
        logger.warn(`Hash mismatch for document ${fileId}`);
        return {
          valid: false,
          reason: 'Hash mismatch with blockchain',
          storedHash: metadata.documentHash,
          blockchainHash
        };
      }

      // Re-compute hash from decrypted document
      const computedHash = this.generateDocumentHash(buffer);

      if (computedHash !== blockchainHash) {
        logger.error(`Document corruption detected for ${fileId}`);
        return {
          valid: false,
          reason: 'Document has been corrupted',
          computedHash,
          blockchainHash
        };
      }

      return {
        valid: true,
        hash: computedHash,
        message: 'Document integrity verified'
      };

    } catch (error) {
      logger.error('Integrity verification error:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const files = await this.bucket.find({}).toArray();

      const stats = {
        totalDocuments: files.length,
        totalSize: files.reduce((sum, file) => sum + file.length, 0),
        totalSizeFormatted: this.formatBytes(
          files.reduce((sum, file) => sum + file.length, 0)
        ),
        byLoan: {}
      };

      // Group by loan
      files.forEach(file => {
        const loanId = file.metadata?.loanId;
        if (loanId) {
          if (!stats.byLoan[loanId]) {
            stats.byLoan[loanId] = { count: 0, size: 0 };
          }
          stats.byLoan[loanId].count++;
          stats.byLoan[loanId].size += file.length;
        }
      });

      return stats;

    } catch (error) {
      logger.error('Error getting storage stats:', error);
      throw error;
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
module.exports = new DocumentStorageService();
