/**
 * Loan Routes
 * Handles financial operations on financial-operations-channel
 */

const express = require('express');
const router = express.Router();
const fabricGateway = require('../fabric/gateway');
const logger = require('../utils/logger');
const { secureUpload } = require('../middleware/secureFileUpload');
const documentStorage = require('../services/documentStorage');
const crypto = require('crypto');

const CHANNEL_NAME = process.env.CHANNEL_FINANCIAL || 'financial-operations-channel';
const CHAINCODE_NAME = process.env.CHAINCODE_NAME || 'iu-unified';
const CONTRACT_NAME = 'LoanContract';

/**
 * Simple access verification helper.
 * Replace with real auth/ACL in production.
 */
async function verifyDocumentAccess(loan, documentId, userId, org) {
  // Government can access all documents
  if (org === 'government') return true;

  // Creditor who created the loan can access
  if (org === 'creditor') {
    if (loan.creditorId && (loan.creditorId === userId || userId === 'creditor')) return true;
    return true; // default allow for creditors in current simplified model
  }

  // Debtor (borrower) can access their own loan documents
  if (org === 'debtor') {
    if (loan.borrowerId && loan.borrowerId === userId) return true;
    return false;
  }

  return false;
}

/**
 * POST /api/loans
 * Create a new loan (Creditor only)
 * Supports multipart/form-data for file uploads with encryption and security
 */
router.post('/', secureUpload.array('documents', 10), async (req, res, next) => {
  try {
    // Extract loan data from form data
    const loanDataString = req.body.loanData;
    
    if (!loanDataString) {
      return res.status(400).json({
        success: false,
        error: 'loanData is required'
      });
    }

    const loanData = JSON.parse(loanDataString);

    // Validate required fields
    const required = ['loanId', 'creditorId', 'borrowerId', 'amount', 'interestRate', 'term', 'purpose'];
    for (const field of required) {
      if (!loanData[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    const uploadedDocuments = [];

    // Process uploaded documents with encryption and GridFS storage
    if (req.files && req.files.length > 0) {
      logger.info(`Processing ${req.files.length} documents for loan ${loanData.loanId}`);

        for (const file of req.files) {
          try {
            // Calculate hash BEFORE encryption for blockchain integrity verification
            const preEncryptionHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

            // Prepare metadata expected by documentStorage
            const meta = {
              filename: file.originalname,
              mimetype: file.mimetype,
              loanId: loanData.loanId,
              borrowerId: loanData.borrowerId,
              creditorId: loanData.creditorId,
              uploadedBy: loanData.creditorId,
              purpose: loanData.purpose
            };

            // Store document in MongoDB GridFS with encryption
            const storeResult = await documentStorage.storeDocument(file.buffer, meta);

            const fileId = storeResult.fileId;
            const documentHash = storeResult.documentHash || preEncryptionHash;

            uploadedDocuments.push({
              documentId: fileId,
              fileName: file.originalname,
              fileType: file.mimetype,
              fileSize: file.size,
              hash: documentHash,
              uploadedAt: new Date().toISOString(),
              uploadedBy: loanData.creditorId,
              status: 'active'
            });

            logger.info(`Document stored securely: ${file.originalname} (ID: ${fileId}, Hash: ${documentHash.substring(0, 16)}...)`);
          } catch (docError) {
            logger.error(`Error storing document ${file.originalname}:`, docError);
            throw new Error(`Failed to store document ${file.originalname}: ${docError.message}`);
          }
        }
    }
    
    // Add documents metadata to loan data
    loanData.documents = uploadedDocuments;

    // Add timestamp if not present
    if (!loanData.submittedAt) {
      loanData.submittedAt = new Date().toISOString();
    }

    logger.info('Creating loan with encrypted documents:', {
      loanId: loanData.loanId,
      documentCount: uploadedDocuments.length,
      documentsHashed: uploadedDocuments.map(d => d.hash.substring(0, 16) + '...')
    });

    const result = await fabricGateway.submitTransaction(
      'creditor',
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'createLoan',
      JSON.stringify(loanData)
    );

    // Log document access on blockchain
    for (const doc of uploadedDocuments) {
      try {
        await fabricGateway.submitTransaction(
          'creditor',
          CHANNEL_NAME,
          CHAINCODE_NAME,
          CONTRACT_NAME,
          'logDocumentAccess',
          loanData.loanId,
          doc.documentId,
          'upload',
          loanData.creditorId
        );
      } catch (logError) {
        logger.warn(`Failed to log document access for ${doc.documentId}:`, logError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Loan created successfully with encrypted documents',
      data: JSON.parse(result),
      documentsUploaded: uploadedDocuments.length,
      documents: uploadedDocuments.map(doc => ({
        documentId: doc.documentId,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        hash: doc.hash,
        uploadedAt: doc.uploadedAt
      }))
    });
  } catch (error) {
    logger.error('Error creating loan:', error);
    next(error);
  }
});

/**
 * GET /api/loans
 * Query loans (filtered by organization)
 */
router.get('/', async (req, res, next) => {
  try {
    const { org = 'creditor' } = req.query;

    // Validate organization
    if (!['government', 'creditor', 'debtor'].includes(org)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid organization. Must be: government, creditor, or debtor'
      });
    }

    logger.info(`Querying loans for ${org}`);

    const result = await fabricGateway.evaluateTransaction(
      org,
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'queryLoans'
    );

    const loans = JSON.parse(result);

    res.json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (error) {
    logger.error('Error querying loans:', error);
    next(error);
  }
});

/**
 * GET /api/loans/:loanId
 * Get specific loan by ID
 */
router.get('/:loanId', async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const { org = 'creditor' } = req.query;

    logger.info(`Getting loan ${loanId} for ${org}`);

    const result = await fabricGateway.evaluateTransaction(
      org,
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'getLoan',
      loanId
    );

    const loan = JSON.parse(result);

    res.json({
      success: true,
      data: loan
    });
  } catch (error) {
    if (error.message.includes('does not exist')) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }
    logger.error('Error getting loan:', error);
    next(error);
  }
});

/**
 * POST /api/loans/:loanId/approve
 * Approve loan by admin (Government only)
 */
router.post('/:loanId/approve', async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const { notes = '' } = req.body;

    logger.info(`Government approving loan ${loanId}`);

    const result = await fabricGateway.submitTransaction(
      'government',
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'approveLoanByAdmin',
      loanId,
      notes
    );

    res.json({
      success: true,
      message: 'Loan approved by admin',
      data: JSON.parse(result)
    });
  } catch (error) {
    logger.error('Error approving loan:', error);
    next(error);
  }
});

/**
 * POST /api/loans/:loanId/reject
 * Reject loan by admin (Government only)
 */
router.post('/:loanId/reject', async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const { reason = '' } = req.body;

    logger.info(`Government rejecting loan ${loanId}`);

    const result = await fabricGateway.submitTransaction(
      'government',
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'rejectLoanByAdmin',
      loanId,
      reason
    );

    res.json({
      success: true,
      message: 'Loan rejected by admin',
      data: JSON.parse(result)
    });
  } catch (error) {
    logger.error('Error rejecting loan:', error);
    next(error);
  }
});

/**
 * POST /api/loans/:loanId/accept
 * Accept loan by borrower (Debtor only)
 */
router.post('/:loanId/accept', async (req, res, next) => {
  try {
    const { loanId } = req.params;

    logger.info(`Borrower accepting loan ${loanId}`);

    const result = await fabricGateway.submitTransaction(
      'debtor',
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'approveLoanByBorrower',
      loanId
    );

    res.json({
      success: true,
      message: 'Loan accepted by borrower',
      data: JSON.parse(result)
    });
  } catch (error) {
    logger.error('Error accepting loan:', error);
    next(error);
  }
});

/**
 * POST /api/loans/:loanId/decline
 * Decline loan by borrower (Debtor only)
 */
router.post('/:loanId/decline', async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const { reason = '' } = req.body;

    logger.info(`Borrower declining loan ${loanId}`);

    const result = await fabricGateway.submitTransaction(
      'debtor',
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'rejectLoanByBorrower',
      loanId,
      reason
    );

    res.json({
      success: true,
      message: 'Loan declined by borrower',
      data: JSON.parse(result)
    });
  } catch (error) {
    logger.error('Error declining loan:', error);
    next(error);
  }
});

/**
 * GET /api/loans/:loanId/documents
 * Get list of all documents for a specific loan
 */
router.get('/:loanId/documents', async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const { org = 'creditor' } = req.query;

    logger.info(`Getting documents for loan ${loanId}`);

    // Get loan details
    const result = await fabricGateway.evaluateTransaction(
      org,
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'getLoan',
      loanId
    );

    const loan = JSON.parse(result);

    // Return only document metadata (not file content)
    const documents = loan.documents || [];
    
    res.json({
      success: true,
      loanId: loanId,
      count: documents.length,
      documents: documents.map(doc => ({
        documentId: doc.documentId,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt,
        hash: doc.hash
      }))
    });
  } catch (error) {
    logger.error('Error getting loan documents:', error);
    next(error);
  }
});

/**
 * GET /api/loans/:loanId/documents/:documentId
 * Download a specific document file with access control and integrity verification
 */
router.get('/:loanId/documents/:documentId', async (req, res, next) => {
  try {
    const { loanId, documentId } = req.params;
    const { org = 'creditor' } = req.query;
    const userId = req.user?.userId || org; // TODO: Get from auth

    logger.info(`Download requested: document ${documentId} for loan ${loanId} by ${userId}`);

    // Get loan details from blockchain
    const result = await fabricGateway.evaluateTransaction(
      org,
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'getLoan',
      loanId
    );

    const loan = JSON.parse(result);
    const documents = loan.documents || [];
    
    // Find the specific document
    const document = documents.find(doc => doc.documentId === documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Verify access permissions (simplified - enhance based on your business logic)
    const hasAccess = await verifyDocumentAccess(loan, documentId, userId, org);
    if (!hasAccess) {
      logger.warn(`Access denied: ${userId} tried to access document ${documentId}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied to this document'
      });
    }

      // Retrieve encrypted document from GridFS, decrypt and verify
      try {
        const { buffer, metadata, filename } = await documentStorage.retrieveDocument(document.documentId);

        // Log download access (best-effort)
        try {
          await documentStorage.logDocumentAccess(document.documentId, req.user?.id || document.uploadedBy || 'unknown', 'download', { loanId });
        } catch (logErr) {
          logger.warn('Failed to log document download access:', logErr.message);
        }

        // Set headers for file download
        const contentType = metadata?.contentType || document.fileType || 'application/octet-stream';
        const outName = filename || document.fileName || 'document';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${outName}"`);
        res.setHeader('Content-Length', buffer.length);

        // Send the decrypted buffer
        return res.send(buffer);
      } catch (storageErr) {
        logger.error('Error retrieving document from storage:', storageErr);
        return res.status(500).json({ success: false, error: 'Failed to retrieve document' });
      }
  } catch (error) {
    logger.error('Error downloading document:', error);
    next(error);
  }
});

/**
 * Helper function to verify document access permissions
 */
async function verifyDocumentAccess(loan, documentId, userId, org) {
  // Business logic for access control
  // Creditor: can access their own loans
  // Debtor: can access loans where they are the borrower
  // Government: can access all approved loans
  
  if (org === 'government') {
    return loan.status === 'approved' || loan.status === 'active';
  }
  
  if (org === 'creditor') {
    return loan.creditorId === userId || loan.creditorId.includes(userId);
  }
  
  if (org === 'debtor') {
    return loan.borrowerId === userId;
  }
  
  return false;
}

/**
 * POST /api/loans/:loanId/documents
 * Add additional documents to an existing loan
 */
router.post('/:loanId/documents', secureUpload.array('documents', 5), async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const { org = 'creditor' } = req.query;
    const userId = req.user?.userId || org;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No documents provided'
      });
    }

    // Get loan to verify it exists
    const loanResult = await fabricGateway.evaluateTransaction(
      org,
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'getLoan',
      loanId
    );

    const loan = JSON.parse(loanResult);
    const uploadedDocuments = [];

    // Process each uploaded document
    for (const file of req.files) {
      try {
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        const documentId = await documentStorage.storeDocument(
          file.buffer,
          file.originalname,
          file.mimetype,
          {
            loanId,
            borrowerId: loan.borrowerId,
            creditorId: loan.creditorId,
            uploadedBy: userId,
            uploadDate: new Date().toISOString()
          }
        );

        uploadedDocuments.push({
          documentId,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          hash: fileHash,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userId,
          status: 'active'
        });

        logger.info(`Additional document stored: ${file.originalname} for loan ${loanId}`);
      } catch (docError) {
        logger.error(`Error storing document ${file.originalname}:`, docError);
        throw new Error(`Failed to store document: ${docError.message}`);
      }
    }

    // Update loan with new documents on blockchain
    for (const doc of uploadedDocuments) {
      await fabricGateway.submitTransaction(
        org,
        CHANNEL_NAME,
        CHAINCODE_NAME,
        CONTRACT_NAME,
        'addDocumentToLoan',
        loanId,
        JSON.stringify(doc)
      );

      // Log the upload
      await fabricGateway.submitTransaction(
        org,
        CHANNEL_NAME,
        CHAINCODE_NAME,
        CONTRACT_NAME,
        'logDocumentAccess',
        loanId,
        doc.documentId,
        'upload',
        userId
      );
    }

    res.status(201).json({
      success: true,
      message: 'Documents added successfully',
      documentsAdded: uploadedDocuments.length,
      documents: uploadedDocuments.map(doc => ({
        documentId: doc.documentId,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        hash: doc.hash,
        uploadedAt: doc.uploadedAt
      }))
    });
  } catch (error) {
    logger.error('Error adding documents to loan:', error);
    next(error);
  }
});

/**
 * DELETE /api/loans/:loanId/documents/:documentId
 * Soft delete a document (marks as deleted, maintains blockchain record)
 */
router.delete('/:loanId/documents/:documentId', async (req, res, next) => {
  try {
    const { loanId, documentId } = req.params;
    const { org = 'creditor', reason = '' } = req.query;
    const userId = req.user?.userId || org;

    logger.info(`Delete requested for document ${documentId} from loan ${loanId}`);

    // Mark document as deleted in MongoDB (GDPR compliance)
    await documentStorage.markDocumentDeleted(documentId, userId, reason);

    // Update blockchain to reflect deletion
    await fabricGateway.submitTransaction(
      org,
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'markDocumentDeleted',
      loanId,
      documentId,
      userId,
      reason
    );

    // Log the deletion
    await fabricGateway.submitTransaction(
      org,
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'logDocumentAccess',
      loanId,
      documentId,
      'delete',
      userId
    );

    res.json({
      success: true,
      message: 'Document marked as deleted',
      documentId,
      deletedBy: userId,
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error deleting document:', error);
    next(error);
  }
});

/**
 * GET /api/loans/:loanId/documents/:documentId/audit
 * Get audit trail for a specific document
 */
router.get('/:loanId/documents/:documentId/audit', async (req, res, next) => {
  try {
    const { loanId, documentId } = req.params;
    const { org = 'government' } = req.query;

    logger.info(`Audit trail requested for document ${documentId}`);

    // Get audit trail from blockchain
    const result = await fabricGateway.evaluateTransaction(
      org,
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'getDocumentAuditTrail',
      loanId,
      documentId
    );

    const auditTrail = JSON.parse(result);

    res.json({
      success: true,
      documentId,
      loanId,
      auditTrail
    });
  } catch (error) {
    logger.error('Error getting document audit trail:', error);
    next(error);
  }
});

module.exports = router;