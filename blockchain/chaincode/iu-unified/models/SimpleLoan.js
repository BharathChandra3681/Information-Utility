'use strict';

/**
 * SimpleLoan Model
 * Represents a loan record in the financial operations system
 */
class SimpleLoan {
  constructor(obj) {
    this.docType = 'SimpleLoan';
    this.loanId = obj.loanId;
    this.borrowerName = obj.borrowerName;
    this.creditorName = obj.creditorName || '';
    this.loanAmount = obj.loanAmount;
    this.loanStartDate = obj.loanStartDate;
    this.maturityDate = obj.maturityDate || '';
    this.status = obj.status || 'awaiting-admin';
    this.adminApproval = obj.adminApproval || 'pending';
    this.borrowerDecision = obj.borrowerDecision || 'pending';
    this.submittedAt = obj.submittedAt || new Date().toISOString();
    this.adminApprovedAt = obj.adminApprovedAt || '';
    this.borrowerApprovedAt = obj.borrowerApprovedAt || '';
    this.rejectionReason = obj.rejectionReason || '';
    this.creditorMSP = 'CreditorMSP';
    this.debtorMSP = 'DebtorMSP';
    
    // Supporting documents metadata
    this.documents = obj.documents || [];
  }

  static fromJSON(data) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    return new SimpleLoan(data);
  }

  toJSON() {
    return {
      docType: this.docType,
      loanId: this.loanId,
      borrowerName: this.borrowerName,
      creditorName: this.creditorName,
      loanAmount: this.loanAmount,
      loanStartDate: this.loanStartDate,
      maturityDate: this.maturityDate,
      status: this.status,
      adminApproval: this.adminApproval,
      borrowerDecision: this.borrowerDecision,
      submittedAt: this.submittedAt,
      adminApprovedAt: this.adminApprovedAt,
      borrowerApprovedAt: this.borrowerApprovedAt,
      rejectionReason: this.rejectionReason,
      creditorMSP: this.creditorMSP,
      debtorMSP: this.debtorMSP,
      documents: this.documents
    };
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }
}

module.exports = SimpleLoan;
