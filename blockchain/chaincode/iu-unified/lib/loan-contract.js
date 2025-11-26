'use strict';

const { Contract } = require('fabric-contract-api');
const SimpleLoan = require('../models/SimpleLoan');
const AuditRecord = require('../models/AuditRecord');

/**
 * LoanContract - Financial Operations Contract
 * Handles loan creation, approval, and management on financial-operations-channel
 */
class LoanContract extends Contract {
  
  constructor() {
    super('LoanContract');
  }

  /**
   * Initialize the ledger with sample data (optional)
   */
  async initLedger(ctx) {
    console.info('============= START : Initialize Ledger ===========');
    console.info('============= END : Initialize Ledger ===========');
  }

  /**
   * CREATE LOAN - Only accessible by CreditorMSP
   * Creates a new loan record awaiting admin approval
   */
  async createLoan(ctx, loanData) {
    console.info('============= START : Create Loan ===========');

    // Verify channel
    const channelID = ctx.stub.getChannelID();
    if (channelID !== 'financial-operations-channel') {
      throw new Error(`This function is only available on financial-operations-channel. Current channel: ${channelID}`);
    }
    
    // Verify caller is CreditorMSP
    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'CreditorMSP') {
      throw new Error('Only Creditor organization can create loans');
    }
    
    // Parse loan data
    const loanObj = typeof loanData === 'string' ? JSON.parse(loanData) : loanData;
    
    // Create loan with initial status
    const loan = new SimpleLoan({
      ...loanObj,
      status: 'awaiting-admin',
      adminApproval: 'pending',
      borrowerDecision: 'pending',
      submittedAt: new Date().toISOString()
    });
    
    // Check if loan already exists
    const existingLoan = await ctx.stub.getState(loan.loanId);
    if (existingLoan && existingLoan.length > 0) {
      throw new Error(`Loan ${loan.loanId} already exists`);
    }
    
    // Store loan
    await ctx.stub.putState(loan.loanId, Buffer.from(loan.toString()));
    
    // Create audit record
    await this.createAuditRecord(ctx, 'LOAN_CREATED', loan);
    
    console.info('============= END : Create Loan ===========');
    return loan.toJSON();
  }

  /**
   * APPROVE LOAN BY ADMIN - Only accessible by GovernmentMSP
   * Government approves the loan, changing status to awaiting-borrower
   */
  async approveLoanByAdmin(ctx, loanId) {
    console.info('============= START : Admin Approve Loan ===========');

    // Only GovernmentMSP can approve
    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'GovernmentMSP') {
      throw new Error('Only Government can approve loans');
    }
    
    // Get loan
    const loanBytes = await ctx.stub.getState(loanId);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`Loan ${loanId} not found`);
    }
    
    const loan = SimpleLoan.fromJSON(loanBytes.toString());
    
    // Update loan status
    loan.adminApproval = 'approved';
    loan.status = 'awaiting-borrower';
    loan.adminApprovedAt = new Date().toISOString();
    
    // Store updated loan
    await ctx.stub.putState(loanId, Buffer.from(loan.toString()));
    
    // Audit trail
    await this.createAuditRecord(ctx, 'ADMIN_APPROVED', loan);
    
    console.info('============= END : Admin Approve Loan ===========');
    return loan.toJSON();
  }

  /**
   * REJECT LOAN BY ADMIN - Only accessible by GovernmentMSP
   */
  async rejectLoanByAdmin(ctx, loanId, reason) {
    console.info('============= START : Admin Reject Loan ===========');

    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'GovernmentMSP') {
      throw new Error('Only Government can reject loans');
    }
    
    const loanBytes = await ctx.stub.getState(loanId);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`Loan ${loanId} not found`);
    }
    
    const loan = SimpleLoan.fromJSON(loanBytes.toString());
    loan.adminApproval = 'rejected';
    loan.status = 'rejected-by-admin';
    loan.rejectionReason = reason || 'No reason provided';
    
    await ctx.stub.putState(loanId, Buffer.from(loan.toString()));
    await this.createAuditRecord(ctx, 'ADMIN_REJECTED', loan);
    
    console.info('============= END : Admin Reject Loan ===========');
    return loan.toJSON();
  }

  /**
   * APPROVE LOAN BY BORROWER - Only accessible by DebtorMSP
   */
  async approveLoanByBorrower(ctx, loanId) {
    console.info('============= START : Borrower Approve Loan ===========');

    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'DebtorMSP') {
      throw new Error('Only Debtor organization can approve loan acceptance');
    }
    
    const loanBytes = await ctx.stub.getState(loanId);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`Loan ${loanId} not found`);
    }
    
    const loan = SimpleLoan.fromJSON(loanBytes.toString());
    
    if (loan.adminApproval !== 'approved') {
      throw new Error('Loan must be approved by admin first');
    }
    
    loan.borrowerDecision = 'accepted';
    loan.status = 'confirmed';
    loan.borrowerApprovedAt = new Date().toISOString();
    
    await ctx.stub.putState(loanId, Buffer.from(loan.toString()));
    await this.createAuditRecord(ctx, 'BORROWER_ACCEPTED', loan);
    
    console.info('============= END : Borrower Approve Loan ===========');
    return loan.toJSON();
  }

  /**
   * REJECT LOAN BY BORROWER - Only accessible by DebtorMSP
   */
  async rejectLoanByBorrower(ctx, loanId, reason) {
    console.info('============= START : Borrower Reject Loan ===========');

    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'DebtorMSP') {
      throw new Error('Only Debtor organization can reject loans');
    }
    
    const loanBytes = await ctx.stub.getState(loanId);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`Loan ${loanId} not found`);
    }
    
    const loan = SimpleLoan.fromJSON(loanBytes.toString());
    loan.borrowerDecision = 'rejected';
    loan.status = 'rejected-by-borrower';
    loan.rejectionReason = reason || 'Borrower declined';
    
    await ctx.stub.putState(loanId, Buffer.from(loan.toString()));
    await this.createAuditRecord(ctx, 'BORROWER_REJECTED', loan);
    
    console.info('============= END : Borrower Reject Loan ===========');
    return loan.toJSON();
  }

  /**
   * QUERY LOANS - All organizations can query, filtered by MSP
   */
  async queryLoans(ctx, filtersString) {
    console.info('============= START : Query Loans ===========');

    const clientMSP = ctx.clientIdentity.getMSPID();
    const filters = filtersString ? JSON.parse(filtersString) : {};
    
    // Build query
    const query = {
      selector: {
        docType: 'SimpleLoan',
        ...filters
      }
    };
    
    // Apply org-specific filters
    if (clientMSP === 'CreditorMSP') {
      query.selector.creditorMSP = 'CreditorMSP';
    } else if (clientMSP === 'DebtorMSP') {
      query.selector.debtorMSP = 'DebtorMSP';
    }
    // GovernmentMSP sees all loans
    
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const results = await this.getAllResults(iterator);
    
    console.info('============= END : Query Loans ===========');
    return JSON.stringify(results);
  }

  /**
   * GET LOAN BY ID
   */
  async getLoan(ctx, loanId) {
    const loanBytes = await ctx.stub.getState(loanId);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`Loan ${loanId} not found`);
    }
    return loanBytes.toString();
  }

  /**
   * ADD DOCUMENT METADATA TO LOAN
   * Stores document hash and metadata on blockchain for integrity verification
   * @param {string} loanId - The loan ID
   * @param {string} documentMetadata - JSON string containing document info
   */
  async addDocumentToLoan(ctx, loanId, documentMetadata) {
    console.info('============= START : Add Document to Loan ===========');

    // Verify caller is CreditorMSP (only creditor can add documents)
    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'CreditorMSP') {
      throw new Error('Only Creditor organization can add documents to loans');
    }

    // Get loan
    const loanBytes = await ctx.stub.getState(loanId);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`Loan ${loanId} not found`);
    }

    const loan = SimpleLoan.fromJSON(loanBytes.toString());

    // Parse document metadata
    const docMeta = typeof documentMetadata === 'string' 
      ? JSON.parse(documentMetadata) 
      : documentMetadata;

    // Add document to loan's documents array
    if (!loan.documents) {
      loan.documents = [];
    }

    const documentRecord = {
      documentId: docMeta.fileId,
      documentHash: docMeta.documentHash,
      documentType: docMeta.documentType,
      filename: docMeta.filename,
      uploadedBy: docMeta.uploadedBy,
      uploadedAt: new Date().toISOString(),
      verified: false
    };

    loan.documents.push(documentRecord);

    // Update loan on blockchain
    await ctx.stub.putState(loanId, Buffer.from(loan.toString()));

    // Create audit record
    await this.createAuditRecord(ctx, 'DOCUMENT_ADDED', loan);

    console.info('============= END : Add Document to Loan ===========');
    return JSON.stringify(documentRecord);
  }

  /**
   * VERIFY DOCUMENT INTEGRITY
   * Verifies that a document's hash matches what's stored on blockchain
   * @param {string} loanId - The loan ID
   * @param {string} documentId - The document ID
   * @param {string} providedHash - Hash to verify against blockchain
   */
  async verifyDocumentIntegrity(ctx, loanId, documentId, providedHash) {
    console.info('============= START : Verify Document Integrity ===========');

    // Get loan
    const loanBytes = await ctx.stub.getState(loanId);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`Loan ${loanId} not found`);
    }

    const loan = SimpleLoan.fromJSON(loanBytes.toString());

    // Find document in loan's documents array
    const document = loan.documents?.find(doc => doc.documentId === documentId);
    
    if (!document) {
      throw new Error(`Document ${documentId} not found in loan ${loanId}`);
    }

    // Compare hashes
    const isValid = document.documentHash === providedHash;

    // Update verification status
    if (isValid && !document.verified) {
      document.verified = true;
      document.verifiedAt = new Date().toISOString();
      document.verifiedBy = ctx.clientIdentity.getID();
      
      // Update loan
      await ctx.stub.putState(loanId, Buffer.from(loan.toString()));
      
      // Create audit record
      await this.createAuditRecord(ctx, 'DOCUMENT_VERIFIED', loan);
    }

    console.info('============= END : Verify Document Integrity ===========');
    return JSON.stringify({
      documentId,
      loanId,
      isValid,
      blockchainHash: document.documentHash,
      providedHash,
      verified: document.verified || false
    });
  }

  /**
   * LOG DOCUMENT ACCESS
   * Records document access attempts on blockchain for audit trail
   * @param {string} loanId - The loan ID
   * @param {string} documentId - The document ID
   * @param {string} action - The action performed (view, download, etc.)
   */
  async logDocumentAccess(ctx, loanId, documentId, action) {
    console.info('============= START : Log Document Access ===========');

    const accessLog = {
      recordId: `ACCESS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      loanId,
      documentId,
      action,
      accessedBy: ctx.clientIdentity.getID(),
      accessedByMSP: ctx.clientIdentity.getMSPID(),
      timestamp: new Date().toISOString()
    };

    // Create composite key for efficient querying
    const compositeKey = ctx.stub.createCompositeKey('documentAccess', [
      loanId,
      documentId,
      accessLog.timestamp
    ]);

    await ctx.stub.putState(compositeKey, Buffer.from(JSON.stringify(accessLog)));

    console.info('============= END : Log Document Access ===========');
    return JSON.stringify(accessLog);
  }

  /**
   * GET DOCUMENT ACCESS LOG
   * Retrieves access history for a document
   * @param {string} loanId - The loan ID
   * @param {string} documentId - The document ID (optional)
   */
  async getDocumentAccessLog(ctx, loanId, documentId = null) {
    console.info('============= START : Get Document Access Log ===========');

    // Build partial composite key
    const keyParts = documentId ? [loanId, documentId] : [loanId];
    const iterator = await ctx.stub.getStateByPartialCompositeKey('documentAccess', keyParts);

    const logs = [];
    let res = await iterator.next();

    while (!res.done) {
      if (res.value && res.value.value.toString()) {
        try {
          const log = JSON.parse(res.value.value.toString('utf8'));
          logs.push(log);
        } catch (err) {
          console.log(err);
        }
      }
      res = await iterator.next();
    }

    await iterator.close();

    console.info('============= END : Get Document Access Log ===========');
    return JSON.stringify(logs);
  }

  /**
   * GET DOCUMENT AUDIT TRAIL
   * Retrieves complete audit trail for a specific document
   * @param {string} loanId - The loan ID
   * @param {string} documentId - The document ID
   */
  async getDocumentAuditTrail(ctx, loanId, documentId) {
    console.info('============= START : Get Document Audit Trail ===========');
    
    // Get all access logs for this document
    const accessLogs = JSON.parse(await this.getDocumentAccessLog(ctx, loanId, documentId));
    
    // Get loan to include document metadata
    const loanBytes = await ctx.stub.getState(loanId);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`Loan ${loanId} not found`);
    }
    
    const loan = SimpleLoan.fromJSON(loanBytes.toString());
    const document = loan.documents?.find(doc => doc.documentId === documentId);
    
    const auditTrail = {
      loanId,
      documentId,
      documentMetadata: document || null,
      accessHistory: accessLogs.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ),
      totalAccesses: accessLogs.length,
      firstAccess: accessLogs.length > 0 ? accessLogs[accessLogs.length - 1].timestamp : null,
      lastAccess: accessLogs.length > 0 ? accessLogs[0].timestamp : null
    };
    
    console.info('============= END : Get Document Audit Trail ===========');
    return JSON.stringify(auditTrail);
  }

  /**
   * MARK DOCUMENT AS DELETED
   * Soft delete - maintains blockchain record but marks document as deleted
   * For GDPR compliance and data retention policies
   * @param {string} loanId - The loan ID
   * @param {string} documentId - The document ID
   * @param {string} deletedBy - User ID who deleted the document
   * @param {string} reason - Reason for deletion
   */
  async markDocumentDeleted(ctx, loanId, documentId, deletedBy, reason) {
    console.info('============= START : Mark Document Deleted ===========');
    
    // Get loan
    const loanBytes = await ctx.stub.getState(loanId);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`Loan ${loanId} not found`);
    }
    
    const loan = SimpleLoan.fromJSON(loanBytes.toString());
    
    // Find and update document
    if (!loan.documents || loan.documents.length === 0) {
      throw new Error(`No documents found for loan ${loanId}`);
    }
    
    const docIndex = loan.documents.findIndex(doc => doc.documentId === documentId);
    if (docIndex === -1) {
      throw new Error(`Document ${documentId} not found in loan ${loanId}`);
    }
    
    // Update document status
    loan.documents[docIndex].status = 'deleted';
    loan.documents[docIndex].deletedAt = new Date().toISOString();
    loan.documents[docIndex].deletedBy = deletedBy;
    loan.documents[docIndex].deletionReason = reason;
    
    // Store updated loan
    await ctx.stub.putState(loanId, Buffer.from(loan.toString()));
    
    // Log the deletion
    await this.logDocumentAccess(ctx, loanId, documentId, 'delete');
    
    console.info('============= END : Mark Document Deleted ===========');
    return JSON.stringify({
      success: true,
      documentId,
      status: 'deleted',
      deletedAt: loan.documents[docIndex].deletedAt,
      deletedBy: deletedBy
    });
  }

  /**
   * CREATE AUDIT RECORD
   * Creates an audit trail entry that will be visible on governance-channel
   */
  async createAuditRecord(ctx, action, loan) {
    const auditRecord = new AuditRecord({
      recordId: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: action,
      loanId: loan.loanId,
      msp: ctx.clientIdentity.getMSPID(),
      userIdentity: ctx.clientIdentity.getID(),
      timestamp: new Date().toISOString(),
      loanSnapshot: loan.toJSON()
    });
    
    // Create composite key for efficient querying
    const compositeKey = ctx.stub.createCompositeKey('audit', [
      auditRecord.timestamp,
      auditRecord.recordId
    ]);
    
    await ctx.stub.putState(compositeKey, Buffer.from(auditRecord.toString()));
    console.info(`Audit record created: ${auditRecord.recordId}`);
  }

  /**
   * Helper function to get all results from iterator
   */
  async getAllResults(iterator) {
    const allResults = [];
    let res = await iterator.next();
    
    while (!res.done) {
      if (res.value && res.value.value.toString()) {
        try {
          const record = JSON.parse(res.value.value.toString('utf8'));
          allResults.push(record);
        } catch (err) {
          console.log(err);
        }
      }
      res = await iterator.next();
    }
    
    await iterator.close();
    return allResults;
  }
}

module.exports = LoanContract;
