'use strict';

/**
 * AuditRecord Model
 * Represents an audit trail entry for governance monitoring
 */
class AuditRecord {
  constructor(obj) {
    this.docType = 'AuditRecord';
    this.recordId = obj.recordId;
    this.action = obj.action;
    this.loanId = obj.loanId;
    this.msp = obj.msp;
    this.userIdentity = obj.userIdentity || '';
    this.timestamp = obj.timestamp || new Date().toISOString();
    this.loanSnapshot = obj.loanSnapshot || {};
    this.additionalData = obj.additionalData || {};
  }

  static fromJSON(data) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    return new AuditRecord(data);
  }

  toJSON() {
    return {
      docType: this.docType,
      recordId: this.recordId,
      action: this.action,
      loanId: this.loanId,
      msp: this.msp,
      userIdentity: this.userIdentity,
      timestamp: this.timestamp,
      loanSnapshot: this.loanSnapshot,
      additionalData: this.additionalData
    };
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }
}

module.exports = AuditRecord;
