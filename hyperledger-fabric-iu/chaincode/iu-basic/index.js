'use strict';

const { Contract } = require('fabric-contract-api');

class FinancialInformationUtilityContract extends Contract {
    // Deterministic timestamp helper
    _txTimestampISO(ctx) {
        const ts = ctx.stub.getTxTimestamp();
        // ts.seconds is a protobuf Long; convert to number (seconds) * 1000
        const ms = (typeof ts.seconds === 'object' ? ts.seconds.low : ts.seconds) * 1000;
        return new Date(ms).toISOString();
    }

    /**
     * Initialize the ledger with some sample financial data
     * @param {Context} ctx - The transaction context
     * @returns {String} Success message
     */
    async InitLedger(ctx) {
        const financialRecords = [
            {
                docType: 'FinancialRecord',
                recordId: 'LOAN001',
                recordType: 'LoanRecord',
                creditorId: 'CREDITOR001',
                debtorId: 'DEBTOR001',
                financialInstitution: {
                    institutionId: 'FI12345',
                    name: 'ABC Bank Ltd',
                    registrationNumber: 'REG98765',
                    type: 'Bank',
                    contact: {
                        address: '123 Finance Street, Mumbai, India',
                        phone: '+91-9876543210',
                        email: 'contact@abcbank.com'
                    }
                },
                borrower: {
                    borrowerId: 'BORR1001',
                    name: 'John Doe',
                    dateOfBirth: '1985-08-20',
                    PAN: 'ABCDE1234F',
                    aadhaar: '123456789012',
                    contact: {
                        address: '456 Residential Lane, Delhi, India',
                        phone: '+91-9123456789',
                        email: 'john.doe@example.com'
                    },
                    creditProfile: {
                        creditScore: 750,
                        creditRating: 'A'
                    }
                },
                loanDetails: {
                    loanAmount: 5000000,
                    interestRate: 7.5,
                    sanctionDate: '2023-05-01',
                    tenureMonths: 240,
                    loanType: 'Home Loan',
                    collateral: {
                        type: 'Real Estate',
                        value: 8000000,
                        description: 'Residential apartment in Mumbai'
                    }
                },
                financialData: {
                    outstandingAmount: 4800000,
                    installmentsPaid: 12,
                    nextDueDate: '2024-06-01',
                    monthlyEMI: 38742.13
                },
                status: 'Active',
                verificationStatus: 'Verified',
                accessPermissions: {
                    'CreditorMSP': true,
                    'DebtorMSP': true,
                    'AdminMSP': true
                },
                metadata: {
                    createdAt: '2023-05-01T10:30:00.000Z',
                    lastModified: '2024-05-01T10:30:00.000Z',
                    version: '1.2',
                    createdBy: 'CreditorMSP'
                },
                history: [
                    {
                        action: 'CREATED',
                        timestamp: '2023-05-01T10:30:00.000Z',
                        performedBy: 'CreditorMSP',
                        details: 'Financial record created'
                    },
                    {
                        action: 'PAYMENT_RECORDED',
                        timestamp: '2024-01-01T14:20:00.000Z',
                        performedBy: 'CreditorMSP',
                        details: 'Monthly EMI payment recorded'
                    }
                ]
            },
            {
                docType: 'FinancialRecord',
                recordId: 'LOAN002',
                recordType: 'PersonalLoan',
                creditorId: 'CREDITOR002',
                debtorId: 'DEBTOR002',
                financialInstitution: {
                    institutionId: 'FI67890',
                    name: 'XYZ Finance Corp',
                    registrationNumber: 'REG54321',
                    type: 'NBFC',
                    contact: {
                        address: '789 Business District, Bangalore, India',
                        phone: '+91-9876543211',
                        email: 'info@xyzfinance.com'
                    }
                },
                borrower: {
                    borrowerId: 'BORR2001',
                    name: 'Jane Smith',
                    dateOfBirth: '1990-03-15',
                    PAN: 'FGHIJ5678K',
                    aadhaar: '987654321098',
                    contact: {
                        address: '321 Tech Park, Bangalore, India',
                        phone: '+91-9876543212',
                        email: 'jane.smith@tech.com'
                    },
                    creditProfile: {
                        creditScore: 680,
                        creditRating: 'B+'
                    }
                },
                loanDetails: {
                    loanAmount: 1000000,
                    interestRate: 12.5,
                    sanctionDate: '2023-08-15',
                    tenureMonths: 60,
                    loanType: 'Personal Loan',
                    collateral: {
                        type: 'None',
                        value: 0,
                        description: 'Unsecured personal loan'
                    }
                },
                financialData: {
                    outstandingAmount: 850000,
                    installmentsPaid: 8,
                    nextDueDate: '2024-06-15',
                    monthlyEMI: 22524.44
                },
                status: 'Active',
                verificationStatus: 'Verified',
                accessPermissions: {
                    'CreditorMSP': true,
                    'DebtorMSP': true,
                    'AdminMSP': true
                },
                metadata: {
                    createdAt: '2023-08-15T09:15:00.000Z',
                    lastModified: '2024-04-15T09:15:00.000Z',
                    version: '1.1',
                    createdBy: 'CreditorMSP'
                },
                history: [
                    {
                        action: 'CREATED',
                        timestamp: '2023-08-15T09:15:00.000Z',
                        performedBy: 'CreditorMSP',
                        details: 'Financial record created'
                    }
                ]
            }
        ];

        for (const financialRecord of financialRecords) {
            await ctx.stub.putState(financialRecord.recordId, Buffer.from(JSON.stringify(financialRecord)));
            console.info(`Financial record ${financialRecord.recordId} initialized`);
        }

        return 'Financial Information Utility ledger initialized successfully';
    }

    /**
     * Create a new financial record (loan, debt, etc.)
     * @param {Context} ctx - The transaction context
     * @param {String} recordId - Unique identifier for the record
     * @param {String} recordType - Type of financial record
     * @param {String} creditorId - ID of the creditor organization
     * @param {String} debtorId - ID of the debtor
     * @param {String} financialInstitutionData - JSON string of financial institution data
     * @param {String} borrowerData - JSON string of borrower data
     * @param {String} loanData - JSON string of loan details
     * @returns {String} Created financial record
     */
    async CreateFinancialRecord(ctx, recordId, recordType, creditorId, debtorId, financialInstitutionData, borrowerData, loanData) {
        try {
            const clientMSPID = ctx.clientIdentity.getMSPID();
            if (clientMSPID !== 'CreditorMSP' && clientMSPID !== 'AdminMSP') {
                throw new Error(`Organization ${clientMSPID} is not authorized to create financial records`);
            }
            const exists = await this.FinancialRecordExists(ctx, recordId);
            if (exists) {
                throw new Error(`Financial record ${recordId} already exists`);
            }
            const deterministicTime = this._txTimestampISO(ctx);
            const financialInstitution = JSON.parse(financialInstitutionData);
            const borrower = JSON.parse(borrowerData);
            const loanDetails = JSON.parse(loanData);

            const financialRecord = {
                docType: 'FinancialRecord',
                recordId: recordId,
                recordType: recordType,
                creditorId: creditorId,
                debtorId: debtorId,
                financialInstitution: financialInstitution,
                borrower: borrower,
                loanDetails: loanDetails,
                financialData: {
                    outstandingAmount: loanDetails.loanAmount,
                    installmentsPaid: 0,
                    nextDueDate: loanDetails.sanctionDate,
                    monthlyEMI: this.calculateEMI(loanDetails.loanAmount, loanDetails.interestRate, loanDetails.tenureMonths)
                },
                status: 'Active',
                verificationStatus: 'Pending',
                accessPermissions: {
                    'CreditorMSP': true,
                    'DebtorMSP': true,
                    'AdminMSP': true
                },
                metadata: {
                    createdAt: deterministicTime,
                    lastModified: deterministicTime,
                    version: '1.0',
                    createdBy: clientMSPID
                },
                history: [{
                    action: 'CREATED',
                    timestamp: deterministicTime,
                    performedBy: clientMSPID,
                    details: 'Financial record created'
                }]
            };

            await ctx.stub.putState(recordId, Buffer.from(JSON.stringify(financialRecord)));
            
            // Create audit entry
            await this.createAuditEntry(ctx, recordId, 'FINANCIAL_RECORD_CREATED', clientMSPID, 'Financial record created successfully');
            
            // Emit an event
            ctx.stub.setEvent('FinancialRecordCreated', Buffer.from(JSON.stringify({
                recordId: recordId,
                creditorId: creditorId,
                debtorId: debtorId,
                amount: loanDetails.loanAmount
            })));
            
            return JSON.stringify(financialRecord);
        } catch (error) {
            throw new Error(`Failed to create financial record: ${error.message}`);
        }
    }

    /**
     * Read a financial record
     * @param {Context} ctx - The transaction context
     * @param {String} recordId - ID of the record to read
     * @returns {String} Financial record data
     */
    async ReadFinancialRecord(ctx, recordId) {
        try {
            const financialRecordJSON = await ctx.stub.getState(recordId);
            if (!financialRecordJSON || financialRecordJSON.length === 0) {
                throw new Error(`Financial record ${recordId} does not exist`);
            }
            
            const financialRecord = JSON.parse(financialRecordJSON.toString());
            
            // Check access permissions
            const clientMSPID = ctx.clientIdentity.getMSPID();
            if (!financialRecord.accessPermissions[clientMSPID]) {
                throw new Error(`Organization ${clientMSPID} does not have permission to read this record`);
            }
            
            return financialRecordJSON.toString();
        } catch (error) {
            throw new Error(`Failed to read financial record ${recordId}: ${error.message}`);
        }
    }

    /**
     * Update financial record status or payment information
     * @param {Context} ctx - The transaction context
     * @param {String} recordId - ID of the record to update
     * @param {String} updateData - JSON string of update data
     * @returns {String} Updated financial record
     */
    async UpdateFinancialRecord(ctx, recordId, updateData) {
        try {
            const clientMSPID = ctx.clientIdentity.getMSPID();
            
            const exists = await this.FinancialRecordExists(ctx, recordId);
            if (!exists) {
                throw new Error(`Financial record ${recordId} does not exist`);
            }

            const financialRecordJSON = await ctx.stub.getState(recordId);
            const financialRecord = JSON.parse(financialRecordJSON.toString());
            
            // Check access permissions
            if (!financialRecord.accessPermissions[clientMSPID]) {
                throw new Error(`Organization ${clientMSPID} does not have permission to update this record`);
            }

            const updates = JSON.parse(updateData);
            
            // Track changes in history
            const historyEntry = {
                action: 'UPDATED',
                timestamp: deterministicTime,
                performedBy: clientMSPID,
                details: `Updated fields: ${Object.keys(updates).join(', ')}`,
                previousValues: {}
            };

            // Apply updates
            for (const [key, value] of Object.entries(updates)) {
                if (key === 'financialData') {
                    historyEntry.previousValues.financialData = { ...financialRecord.financialData };
                    financialRecord.financialData = { ...financialRecord.financialData, ...value };
                } else if (key === 'status') {
                    historyEntry.previousValues.status = financialRecord.status;
                    financialRecord.status = value;
                } else if (key === 'verificationStatus') {
                    historyEntry.previousValues.verificationStatus = financialRecord.verificationStatus;
                    financialRecord.verificationStatus = value;
                }
            }

            financialRecord.metadata.lastModified = deterministicTime;
            financialRecord.metadata.version = (parseFloat(financialRecord.metadata.version) + 0.1).toFixed(1);
            financialRecord.history.push(historyEntry);

            await ctx.stub.putState(recordId, Buffer.from(JSON.stringify(financialRecord)));
            
            // Create audit entry
            await this.createAuditEntry(ctx, recordId, 'FINANCIAL_RECORD_UPDATED', clientMSPID, `Record updated: ${Object.keys(updates).join(', ')}`);
            
            // Emit an event
            ctx.stub.setEvent('FinancialRecordUpdated', Buffer.from(JSON.stringify({
                recordId: recordId,
                updatedBy: clientMSPID,
                updateType: Object.keys(updates).join(', ')
            })));
            
            return JSON.stringify(financialRecord);
        } catch (error) {
            throw new Error(`Failed to update financial record ${recordId}: ${error.message}`);
        }
    }

    /**
     * Query financial records by creditor
     * @param {Context} ctx - The transaction context
     * @param {String} creditorId - ID of the creditor
     * @returns {String} Array of financial records
     */
    async QueryFinancialRecordsByCreditor(ctx, creditorId) {
        try {
            const clientMSPID = ctx.clientIdentity.getMSPID();
            
            // Build query selector
            const queryString = {
                selector: {
                    docType: 'FinancialRecord',
                    creditorId: creditorId
                }
            };

            const allResults = [];
            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            let result = await iterator.next();
            
            while (!result.done) {
                const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
                const record = JSON.parse(strValue);
                
                // Check access permissions
                if (record.accessPermissions[clientMSPID]) {
                    allResults.push(record);
                }
                
                result = await iterator.next();
            }
            
            await iterator.close();
            return JSON.stringify(allResults);
        } catch (error) {
            throw new Error(`Failed to query financial records by creditor: ${error.message}`);
        }
    }

    /**
     * Query financial records by debtor
     * @param {Context} ctx - The transaction context
     * @param {String} debtorId - ID of the debtor
     * @returns {String} Array of financial records
     */
    async QueryFinancialRecordsByDebtor(ctx, debtorId) {
        try {
            const clientMSPID = ctx.clientIdentity.getMSPID();
            
            const queryString = {
                selector: {
                    docType: 'FinancialRecord',
                    debtorId: debtorId
                }
            };

            const allResults = [];
            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            let result = await iterator.next();
            
            while (!result.done) {
                const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
                const record = JSON.parse(strValue);
                
                // Check access permissions
                if (record.accessPermissions[clientMSPID]) {
                    allResults.push(record);
                }
                
                result = await iterator.next();
            }
            
            await iterator.close();
            return JSON.stringify(allResults);
        } catch (error) {
            throw new Error(`Failed to query financial records by debtor: ${error.message}`);
        }
    }

    /**
     * Check if a financial record exists
     * @param {Context} ctx - The transaction context
     * @param {String} recordId - ID of the record
     * @returns {Boolean} True if exists, false otherwise
     */
    async FinancialRecordExists(ctx, recordId) {
        const financialRecordJSON = await ctx.stub.getState(recordId);
        return financialRecordJSON && financialRecordJSON.length > 0;
    }

    /**
     * Get all financial records (Admin only)
     * @param {Context} ctx - The transaction context
     * @returns {String} Array of all financial records
     */
    async GetAllFinancialRecords(ctx) {
        try {
            const clientMSPID = ctx.clientIdentity.getMSPID();
            
            // Only AdminMSP can access all records
            if (clientMSPID !== 'AdminMSP') {
                throw new Error(`Organization ${clientMSPID} is not authorized to access all financial records`);
            }

            const allResults = [];
            const iterator = await ctx.stub.getStateByRange('', '');
            let result = await iterator.next();
            
            while (!result.done) {
                const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                    if (record.docType === 'FinancialRecord') {
                        allResults.push(record);
                    }
                } catch (err) {
                    console.log(err);
                }
                result = await iterator.next();
            }
            
            await iterator.close();
            return JSON.stringify(allResults);
        } catch (error) {
            throw new Error(`Failed to get all financial records: ${error.message}`);
        }
    }

    /**
     * Calculate EMI based on loan amount, interest rate, and tenure
     * @param {Number} loanAmount - Principal loan amount
     * @param {Number} interestRate - Annual interest rate (percentage)
     * @param {Number} tenureMonths - Loan tenure in months
     * @returns {Number} Monthly EMI amount
     */
    calculateEMI(loanAmount, interestRate, tenureMonths) {
        const monthlyRate = (interestRate / 100) / 12;
        const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
        return Math.round(emi * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Create audit entry for compliance channel
     * @param {Context} ctx - The transaction context
     * @param {String} recordId - ID of the financial record
     * @param {String} action - Action performed
     * @param {String} performedBy - Organization that performed the action
     * @param {String} details - Additional details
     */
    async createAuditEntry(ctx, recordId, action, performedBy, details) {
        const deterministicTime = this._txTimestampISO(ctx);
        const auditId = `AUDIT_${recordId}_${deterministicTime.replace(/[^0-9A-Za-z]/g,'')}`;
        const auditEntry = {
            docType: 'AuditEntry',
            auditId: auditId,
            recordId: recordId,
            action: action,
            performedBy: performedBy,
            details: details,
            timestamp: deterministicTime
        };
        await ctx.stub.putState(auditId, Buffer.from(JSON.stringify(auditEntry)));
    }

    /**
     * Record payment for a financial record
     * @param {Context} ctx - The transaction context
     * @param {String} recordId - ID of the financial record
     * @param {String} paymentData - JSON string containing payment details
     * @returns {String} Updated financial record
     */
    async RecordPayment(ctx, recordId, paymentData) {
        try {
            const clientMSPID = ctx.clientIdentity.getMSPID();
            const deterministicTime = this._txTimestampISO(ctx);
            
            // Only CreditorMSP can record payments
            if (clientMSPID !== 'CreditorMSP') {
                throw new Error(`Organization ${clientMSPID} is not authorized to record payments`);
            }

            const exists = await this.FinancialRecordExists(ctx, recordId);
            if (!exists) {
                throw new Error(`Financial record ${recordId} does not exist`);
            }

            const financialRecordJSON = await ctx.stub.getState(recordId);
            const financialRecord = JSON.parse(financialRecordJSON.toString());
            
            const payment = JSON.parse(paymentData);
            
            // Update financial data
            financialRecord.financialData.outstandingAmount -= payment.amount;
            financialRecord.financialData.installmentsPaid += 1;
            
            // Calculate next due date (assuming monthly payments)
            const nextDueDate = new Date(financialRecord.financialData.nextDueDate);
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            financialRecord.financialData.nextDueDate = nextDueDate.toISOString().split('T')[0];

            // Add to history
            financialRecord.history.push({
                action: 'PAYMENT_RECORDED',
                timestamp: deterministicTime,
                performedBy: clientMSPID,
                details: `Payment of ${payment.amount} recorded`,
                paymentDetails: payment
            });

            financialRecord.metadata.lastModified = deterministicTime;
            financialRecord.metadata.version = (parseFloat(financialRecord.metadata.version) + 0.1).toFixed(1);

            await ctx.stub.putState(recordId, Buffer.from(JSON.stringify(financialRecord)));
            
            // Create audit entry
            await this.createAuditEntry(ctx, recordId, 'PAYMENT_RECORDED', clientMSPID, `Payment of ${payment.amount} recorded`);
            
            // Emit an event
            ctx.stub.setEvent('PaymentRecorded', Buffer.from(JSON.stringify({
                recordId: recordId,
                amount: payment.amount,
                outstandingAmount: financialRecord.financialData.outstandingAmount
            })));
            
            return JSON.stringify(financialRecord);
        } catch (error) {
            throw new Error(`Failed to record payment: ${error.message}`);
        }
    }

    /**
     * Verify financial record by authorized organization
     * @param {Context} ctx - The transaction context
     * @param {String} recordId - ID of the record to verify
     * @param {String} verifierOrg - Organization performing verification
     * @returns {String} Updated financial record
     */
    async VerifyFinancialRecord(ctx, recordId, verifierOrg) {
        try {
            const clientMSPID = ctx.clientIdentity.getMSPID();
            const deterministicTime = this._txTimestampISO(ctx);
            
            // Only AdminMSP and CreditorMSP can verify records
            if (clientMSPID !== 'AdminMSP' && clientMSPID !== 'CreditorMSP') {
                throw new Error(`Organization ${clientMSPID} is not authorized to verify financial records`);
            }

            const exists = await this.FinancialRecordExists(ctx, recordId);
            if (!exists) {
                throw new Error(`Financial record ${recordId} does not exist`);
            }

            const financialRecordJSON = await ctx.stub.getState(recordId);
            const financialRecord = JSON.parse(financialRecordJSON.toString());

            financialRecord.verificationStatus = 'Verified';
            financialRecord.verifiedBy = verifierOrg;
            financialRecord.verificationTimestamp = deterministicTime;

            // Add to history
            financialRecord.history.push({
                action: 'VERIFIED',
                timestamp: deterministicTime,
                performedBy: clientMSPID,
                details: `Record verified by ${verifierOrg}`
            });

            financialRecord.metadata.lastModified = deterministicTime;
            financialRecord.metadata.version = (parseFloat(financialRecord.metadata.version) + 0.1).toFixed(1);

            await ctx.stub.putState(recordId, Buffer.from(JSON.stringify(financialRecord)));
            
            // Create audit entry
            await this.createAuditEntry(ctx, recordId, 'RECORD_VERIFIED', clientMSPID, `Record verified by ${verifierOrg}`);
            
            // Emit an event
            ctx.stub.setEvent('FinancialRecordVerified', Buffer.from(JSON.stringify({
                recordId: recordId,
                verifierOrg: verifierOrg,
                timestamp: financialRecord.verificationTimestamp
            })));
            
            return JSON.stringify(financialRecord);
        } catch (error) {
            throw new Error(`Failed to verify financial record ${recordId}: ${error.message}`);
        }
    }

    /**
     * Grant access to an organization for a specific financial record
     * @param {Context} ctx - The transaction context
     * @param {String} recordId - ID of the financial record
     * @param {String} organization - Organization to grant access to
     * @returns {String} Updated financial record
     */
    async GrantAccess(ctx, recordId, organization) {
        try {
            const clientMSPID = ctx.clientIdentity.getMSPID();
            
            // Only AdminMSP can grant access
            if (clientMSPID !== 'AdminMSP') {
                throw new Error(`Organization ${clientMSPID} is not authorized to grant access`);
            }

            const exists = await this.FinancialRecordExists(ctx, recordId);
            if (!exists) {
                throw new Error(`Financial record ${recordId} does not exist`);
            }

            const financialRecordJSON = await ctx.stub.getState(recordId);
            const financialRecord = JSON.parse(financialRecordJSON.toString());

            financialRecord.accessPermissions[organization] = true;

            // Add to history
            financialRecord.history.push({
                action: 'ACCESS_GRANTED',
                timestamp: deterministicTime,
                performedBy: clientMSPID,
                details: `Access granted to ${organization}`
            });

            financialRecord.metadata.lastModified = deterministicTime;
            financialRecord.metadata.version = (parseFloat(financialRecord.metadata.version) + 0.1).toFixed(1);

            await ctx.stub.putState(recordId, Buffer.from(JSON.stringify(financialRecord)));
            
            // Create audit entry
            await this.createAuditEntry(ctx, recordId, 'ACCESS_GRANTED', clientMSPID, `Access granted to ${organization}`);
            
            return JSON.stringify(financialRecord);
        } catch (error) {
            throw new Error(`Failed to grant access for record ${recordId}: ${error.message}`);
        }
    }

    /**
     * Revoke access from an organization for a specific financial record
     * @param {Context} ctx - The transaction context
     * @param {String} recordId - ID of the financial record
     * @param {String} organization - Organization to revoke access from
     * @returns {String} Updated financial record
     */
    async RevokeAccess(ctx, recordId, organization) {
        try {
            const clientMSPID = ctx.clientIdentity.getMSPID();
            
            // Only AdminMSP can revoke access
            if (clientMSPID !== 'AdminMSP') {
                throw new Error(`Organization ${clientMSPID} is not authorized to revoke access`);
            }

            const exists = await this.FinancialRecordExists(ctx, recordId);
            if (!exists) {
                throw new Error(`Financial record ${recordId} does not exist`);
            }

            const financialRecordJSON = await ctx.stub.getState(recordId);
            const financialRecord = JSON.parse(financialRecordJSON.toString());

            financialRecord.accessPermissions[organization] = false;

            // Add to history
            financialRecord.history.push({
                action: 'ACCESS_REVOKED',
                timestamp: deterministicTime,
                performedBy: clientMSPID,
                details: `Access revoked from ${organization}`
            });

            financialRecord.metadata.lastModified = deterministicTime;
            financialRecord.metadata.version = (parseFloat(financialRecord.metadata.version) + 0.1).toFixed(1);

            await ctx.stub.putState(recordId, Buffer.from(JSON.stringify(financialRecord)));
            
            // Create audit entry
            await this.createAuditEntry(ctx, recordId, 'ACCESS_REVOKED', clientMSPID, `Access revoked from ${organization}`);
            
            return JSON.stringify(financialRecord);
        } catch (error) {
            throw new Error(`Failed to revoke access for record ${recordId}: ${error.message}`);
        }
    }

    /**
     * Get financial record history
     * @param {Context} ctx - The transaction context
     * @param {String} recordId - ID of the financial record
     * @returns {String} History of the financial record
     */
    async GetFinancialRecordHistory(ctx, recordId) {
        try {
            const clientMSPID = ctx.clientIdentity.getMSPID();
            
            const exists = await this.FinancialRecordExists(ctx, recordId);
            if (!exists) {
                throw new Error(`Financial record ${recordId} does not exist`);
            }

            const financialRecordJSON = await ctx.stub.getState(recordId);
            const financialRecord = JSON.parse(financialRecordJSON.toString());
            
            // Check access permissions
            if (!financialRecord.accessPermissions[clientMSPID]) {
                throw new Error(`Organization ${clientMSPID} does not have permission to read this record`);
            }
            
            return JSON.stringify(financialRecord.history);
        } catch (error) {
            throw new Error(`Failed to get financial record history ${recordId}: ${error.message}`);
        }
    }

}

module.exports = FinancialInformationUtilityContract;
