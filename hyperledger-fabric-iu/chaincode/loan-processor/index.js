'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class LoanProcessorContract extends Contract {

    async initLedger(ctx) {
        console.info('========================================');
        console.info('Financial Information Utility Initialized');
        console.info('Loan Processing Chaincode Ready');
        console.info('========================================');
        return 'Loan Processor Contract initialized successfully';
    }

    // ==========================================
    // CREDITOR FUNCTIONS - Loan Initiation
    // ==========================================

    /**
     * Creditor logs a loan proposal
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Unique loan identifier
     * @param {string} loanAmount - Loan amount
     * @param {string} interestRate - Interest rate
     * @param {string} debtorId - Debtor identifier
     * @param {string} documentHashes - JSON string of document hashes
     */
    async proposeLoan(ctx, loanId, loanAmount, interestRate, debtorId, maturityDate, currentLoanStatus, assetRecords, balanceSheetSummary, existingLiabilities, documentHashesJson) {
        console.info('=== CREDITOR: Proposing Loan ===');
        
        // Get creditor identity
        const creditorId = ctx.clientIdentity.getID();
        const mspId = ctx.clientIdentity.getMSPID();
        
        // Validate creditor authorization
        if (mspId !== 'CreditorMSP') {
            throw new Error('Only Creditor organization can propose loans');
        }

        // Check if loan already exists
        const exists = await this.loanExists(ctx, loanId);
        if (exists) {
            throw new Error(`Loan ${loanId} already exists`);
        }

        // Create loan proposal
        const documentHashes = JSON.parse(documentHashesJson);

        const loan = {
            loanId: loanId,
            amount: parseFloat(loanAmount),
            interestRate: parseFloat(interestRate),
            creditorId: creditorId,
            creditorMSP: mspId,
            debtorId: debtorId,
            status: currentLoanStatus, // Initial status from form
            maturityDate: maturityDate,
            currentLoanStatus: currentLoanStatus,
            assetRecords: assetRecords,
            balanceSheetSummary: balanceSheetSummary,
            existingLiabilities: existingLiabilities,
            documentHashes: documentHashes, // Now an object of documentType -> CID
            proposedAt: new Date().toISOString(),
            acceptedAt: null,
            rejectedAt: null,
            transactionHistory: [{
                action: 'LOAN_PROPOSED',
                actor: creditorId,
                timestamp: new Date().toISOString(),
                details: `Loan of ${loanAmount} proposed to debtor ${debtorId}`
            }]
        };

        // Store loan on ledger
        await ctx.stub.putState(loanId, Buffer.from(JSON.stringify(loan)));
        
        // Emit event
        ctx.stub.setEvent('LoanProposed', Buffer.from(JSON.stringify({
            loanId: loanId,
            creditorId: creditorId,
            debtorId: debtorId,
            amount: loanAmount,
            status: 'PROPOSED'
        })));

        console.info(`✅ Loan ${loanId} proposed successfully by creditor`);
        return JSON.stringify(loan);
    }

    /**
     * Creditor submits a new loan record with comprehensive details and document hashes.
     * This function replaces/extends the proposeLoan functionality.
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Unique loan identifier
     * @param {string} loanAmount - Loan amount
     * @param {string} interestRate - Interest rate
     * @param {string} debtorId - Debtor identifier
     * @param {string} maturityDate - Loan maturity date (YYYY-MM-DD)
     * @param {string} currentLoanStatus - Initial status of the loan (e.g., 'PROPOSED', 'ACTIVE')
     * @param {string} assetRecords - Description of assets/collateral
     * @param {string} balanceSheetSummary - Summary of balance sheet
     * @param {string} existingLiabilities - Other outstanding liabilities
     * @param {string} documentHashesJson - JSON string of document hashes (IPFS CIDs)
     */
    async submitLoanRecord(ctx, loanId, loanAmount, interestRate, debtorId, maturityDate, currentLoanStatus, assetRecords, balanceSheetSummary, existingLiabilities, documentHashesJson) {
        console.info('=== CREDITOR: Submitting New Loan Record ===');

        const creditorId = ctx.clientIdentity.getID();
        const mspId = ctx.clientIdentity.getMSPID();

        if (mspId !== 'CreditorMSP') {
            throw new Error('Only Creditor organization can submit new loan records');
        }

        const exists = await this.loanExists(ctx, loanId);
        if (exists) {
            throw new Error(`Loan ${loanId} already exists`);
        }

        const documentHashes = JSON.parse(documentHashesJson);

        const loan = {
            loanId: loanId,
            amount: parseFloat(loanAmount),
            interestRate: parseFloat(interestRate),
            creditorId: creditorId,
            creditorMSP: mspId,
            debtorId: debtorId,
            status: currentLoanStatus,
            maturityDate: maturityDate,
            currentLoanStatus: currentLoanStatus,
            assetRecords: assetRecords,
            balanceSheetSummary: balanceSheetSummary,
            existingLiabilities: existingLiabilities,
            documentHashes: documentHashes, // Object: { "documentType": "ipfsCid" }
            proposedAt: new Date().toISOString(),
            acceptedAt: null,
            rejectedAt: null,
            transactionHistory: [{
                action: 'LOAN_SUBMITTED',
                actor: creditorId,
                timestamp: new Date().toISOString(),
                details: `Loan of ${loanAmount} submitted to debtor ${debtorId} with initial status ${currentLoanStatus}`
            }]
        };

        await ctx.stub.putState(loanId, Buffer.from(JSON.stringify(loan)));

        ctx.stub.setEvent('LoanSubmitted', Buffer.from(JSON.stringify({
            loanId: loanId,
            creditorId: creditorId,
            debtorId: debtorId,
            amount: loanAmount,
            status: currentLoanStatus
        })));

        console.info(`✅ Loan ${loanId} submitted successfully by creditor`);
        return JSON.stringify(loan);
    }
    // ==========================================
    // DEBTOR FUNCTIONS - Loan Response
    // ==========================================

    /**
    /**
     * Updates the status of a loan record.
     * Accessible by Debtor (for ACCEPTED/REJECTED) and Creditor (for DEFAULT/NPA).
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Loan identifier
     * @param {string} newStatus - The new status for the loan (e.g., 'ACCEPTED', 'REJECTED', 'DEFAULT', 'NPA')
     * @param {string} reason - Reason for the status update (optional)
     */
    async updateLoanStatus(ctx, loanId, newStatus, reason) {
        console.info(`=== Updating Loan ${loanId} Status to ${newStatus} ===`);

        const clientIdentity = ctx.clientIdentity;
        const actorId = clientIdentity.getID();
        const mspId = clientIdentity.getMSPID();

        const loan = await this.getLoan(ctx, loanId);

        // Access control for status updates
        if (newStatus === 'ACCEPTED' || newStatus === 'REJECTED') {
            if (mspId !== 'DebtorMSP' || loan.debtorId !== actorId) {
                throw new Error('Only the intended Debtor can accept or reject this loan');
            }
            if (loan.status !== 'PROPOSED') {
                throw new Error(`Loan ${loanId} is not in PROPOSED status. Current status: ${loan.status}`);
            }
        } else if (newStatus === 'DEFAULT' || newStatus === 'NPA') {
            if (mspId !== 'CreditorMSP' || loan.creditorId !== actorId) {
                throw new Error('Only the Creditor who proposed the loan can set its status to DEFAULT or NPA');
            }
            if (loan.status === 'REJECTED') {
                throw new Error(`Cannot change status of a REJECTED loan to ${newStatus}`);
            }
        } else {
            throw new Error(`Invalid new status: ${newStatus}`);
        }

        loan.status = newStatus;
        loan.currentLoanStatus = newStatus; // Update current status field as well

        const timestamp = new Date().toISOString();
        let actionDetails = `Loan status updated to ${newStatus}`;

        if (newStatus === 'ACCEPTED') {
            loan.acceptedAt = timestamp;
            actionDetails = `Loan accepted by debtor`;
        } else if (newStatus === 'REJECTED') {
            loan.rejectedAt = timestamp;
            loan.rejectionReason = reason;
            actionDetails = `Loan rejected: ${reason}`;
        } else if (newStatus === 'DEFAULT') {
            loan.defaultedAt = timestamp;
            actionDetails = `Loan marked as DEFAULT: ${reason}`;
        } else if (newStatus === 'NPA') {
            loan.npaAt = timestamp;
            actionDetails = `Loan marked as NPA: ${reason}`;
        }

        loan.transactionHistory.push({
            action: `LOAN_${newStatus.toUpperCase()}`,
            actor: actorId,
            timestamp: timestamp,
            details: actionDetails
        });

        await ctx.stub.putState(loanId, Buffer.from(JSON.stringify(loan)));

        ctx.stub.setEvent(`LoanStatusUpdated`, Buffer.from(JSON.stringify({
            loanId: loanId,
            actor: actorId,
            newStatus: newStatus,
            reason: reason || ''
        })));

        console.info(`✅ Loan ${loanId} status updated to ${newStatus} successfully`);
        return JSON.stringify(loan);
    }
    /**
     * Updates the status of a loan record.
     * Accessible by Debtor (for ACCEPTED/REJECTED) and Creditor (for DEFAULT/NPA).
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Loan identifier
     * @param {string} newStatus - The new status for the loan (e.g., 'ACCEPTED', 'REJECTED', 'DEFAULT', 'NPA')
     * @param {string} reason - Reason for the status update (optional)
     */
    async updateLoanStatus(ctx, loanId, newStatus, reason) {
        console.info(`=== Updating Loan ${loanId} Status to ${newStatus} ===`);

        const clientIdentity = ctx.clientIdentity;
        const actorId = clientIdentity.getID();
        const mspId = clientIdentity.getMSPID();

        const loan = await this.getLoan(ctx, loanId);

        // Access control for status updates
        if (newStatus === 'ACCEPTED' || newStatus === 'REJECTED') {
            if (mspId !== 'DebtorMSP' || loan.debtorId !== actorId) {
                throw new Error('Only the intended Debtor can accept or reject this loan');
            }
            if (loan.status !== 'PROPOSED') {
                throw new Error(`Loan ${loanId} is not in PROPOSED status. Current status: ${loan.status}`);
            }
        } else if (newStatus === 'DEFAULT' || newStatus === 'NPA') {
            if (mspId !== 'CreditorMSP' || loan.creditorId !== actorId) {
                throw new Error('Only the Creditor who proposed the loan can set its status to DEFAULT or NPA');
            }
            if (loan.status === 'REJECTED') {
                throw new Error(`Cannot change status of a REJECTED loan to ${newStatus}`);
            }
        } else {
            throw new Error(`Invalid new status: ${newStatus}`);
        }

        loan.status = newStatus;
        loan.currentLoanStatus = newStatus; // Update current status field as well

        const timestamp = new Date().toISOString();
        let actionDetails = `Loan status updated to ${newStatus}`;

        if (newStatus === 'ACCEPTED') {
            loan.acceptedAt = timestamp;
            actionDetails = `Loan accepted by debtor`;
        } else if (newStatus === 'REJECTED') {
            loan.rejectedAt = timestamp;
            loan.rejectionReason = reason;
            actionDetails = `Loan rejected: ${reason}`;
        } else if (newStatus === 'DEFAULT') {
            loan.defaultedAt = timestamp;
            actionDetails = `Loan marked as DEFAULT: ${reason}`;
        } else if (newStatus === 'NPA') {
            loan.npaAt = timestamp;
            actionDetails = `Loan marked as NPA: ${reason}`;
        }

        loan.transactionHistory.push({
            action: `LOAN_${newStatus.toUpperCase()}`,
            actor: actorId,
            timestamp: timestamp,
            details: actionDetails
        });

        await ctx.stub.putState(loanId, Buffer.from(JSON.stringify(loan)));

        ctx.stub.setEvent(`LoanStatusUpdated`, Buffer.from(JSON.stringify({
            loanId: loanId,
            actor: actorId,
            newStatus: newStatus,
            reason: reason || ''
        })));

        console.info(`✅ Loan ${loanId} status updated to ${newStatus} successfully`);
        return JSON.stringify(loan);
    }
    //  * Updates the status of a loan record.
    //  * Accessible by Debtor (for ACCEPTED/REJECTED) and Creditor (for DEFAULT/NPA).
    //  * @param {Context} ctx - Transaction context
    //  * @param {string} loanId - Loan identifier
    //  * @param {string} newStatus - The new status for the loan (e.g., 'ACCEPTED', 'REJECTED', 'DEFAULT', 'NPA')
    //  * @param {string} reason - Reason for the status update (optional)
    //  */
    async updateLoanStatus(ctx, loanId, newStatus, reason) {
        console.info(`=== Updating Loan ${loanId} Status to ${newStatus} ===`);

        const clientIdentity = ctx.clientIdentity;
        const actorId = clientIdentity.getID();
        const mspId = clientIdentity.getMSPID();

        const loan = await this.getLoan(ctx, loanId);

        // Access control for status updates
        if (newStatus === 'ACCEPTED' || newStatus === 'REJECTED') {
            if (mspId !== 'DebtorMSP' || loan.debtorId !== actorId) {
                throw new Error('Only the intended Debtor can accept or reject this loan');
            }
            if (loan.status !== 'PROPOSED') {
                throw new Error(`Loan ${loanId} is not in PROPOSED status. Current status: ${loan.status}`);
            }
        } else if (newStatus === 'DEFAULT' || newStatus === 'NPA') {
            if (mspId !== 'CreditorMSP' || loan.creditorId !== actorId) {
                throw new Error('Only the Creditor who proposed the loan can set its status to DEFAULT or NPA');
            }
            if (loan.status === 'REJECTED') {
                throw new Error(`Cannot change status of a REJECTED loan to ${newStatus}`);
            }
        } else {
            throw new Error(`Invalid new status: ${newStatus}`);
        }

        loan.status = newStatus;
        loan.currentLoanStatus = newStatus; // Update current status field as well

        const timestamp = new Date().toISOString();
        let actionDetails = `Loan status updated to ${newStatus}`;

        if (newStatus === 'ACCEPTED') {
            loan.acceptedAt = timestamp;
            actionDetails = `Loan accepted by debtor`;
        } else if (newStatus === 'REJECTED') {
            loan.rejectedAt = timestamp;
            loan.rejectionReason = reason;
            actionDetails = `Loan rejected: ${reason}`;
        } else if (newStatus === 'DEFAULT') {
            loan.defaultedAt = timestamp;
            actionDetails = `Loan marked as DEFAULT: ${reason}`;
        } else if (newStatus === 'NPA') {
            loan.npaAt = timestamp;
            actionDetails = `Loan marked as NPA: ${reason}`;
        }

        loan.transactionHistory.push({
            action: `LOAN_${newStatus.toUpperCase()}`,
            actor: actorId,
            timestamp: timestamp,
            details: actionDetails
        });

        await ctx.stub.putState(loanId, Buffer.from(JSON.stringify(loan)));

        ctx.stub.setEvent(`LoanStatusUpdated`, Buffer.from(JSON.stringify({
            loanId: loanId,
            actor: actorId,
            newStatus: newStatus,
            reason: reason || ''
        })));

        console.info(`✅ Loan ${loanId} status updated to ${newStatus} successfully`);
        return JSON.stringify(loan);
    }
    /**
     * Creditor submits a new loan record with comprehensive details and document hashes.
     * This function replaces/extends the proposeLoan functionality.
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Unique loan identifier
     * @param {string} loanAmount - Loan amount
     * @param {string} interestRate - Interest rate
     * @param {string} debtorId - Debtor identifier
     * @param {string} maturityDate - Loan maturity date (YYYY-MM-DD)
     * @param {string} currentLoanStatus - Initial status of the loan (e.g., 'PROPOSED', 'ACTIVE')
     * @param {string} assetRecords - Description of assets/collateral
     * @param {string} balanceSheetSummary - Summary of balance sheet
     * @param {string} existingLiabilities - Other outstanding liabilities
     * @param {string} documentHashesJson - JSON string of document hashes (IPFS CIDs)
     */
    async submitLoanRecord(ctx, loanId, loanAmount, interestRate, debtorId, maturityDate, currentLoanStatus, assetRecords, balanceSheetSummary, existingLiabilities, documentHashesJson) {
        console.info('=== CREDITOR: Submitting New Loan Record ===');

        const creditorId = ctx.clientIdentity.getID();
        const mspId = ctx.clientIdentity.getMSPID();

        if (mspId !== 'CreditorMSP') {
            throw new Error('Only Creditor organization can submit new loan records');
        }

        const exists = await this.loanExists(ctx, loanId);
        if (exists) {
            throw new Error(`Loan ${loanId} already exists`);
        }

        const documentHashes = JSON.parse(documentHashesJson);

        const loan = {
            loanId: loanId,
            amount: parseFloat(loanAmount),
            interestRate: parseFloat(interestRate),
            creditorId: creditorId,
            creditorMSP: mspId,
            debtorId: debtorId,
            status: currentLoanStatus,
            maturityDate: maturityDate,
            currentLoanStatus: currentLoanStatus,
            assetRecords: assetRecords,
            balanceSheetSummary: balanceSheetSummary,
            existingLiabilities: existingLiabilities,
            documentHashes: documentHashes, // Object: { "documentType": "ipfsCid" }
            proposedAt: new Date().toISOString(),
            acceptedAt: null,
            rejectedAt: null,
            transactionHistory: [{
                action: 'LOAN_SUBMITTED',
                actor: creditorId,
                timestamp: new Date().toISOString(),
                details: `Loan of ${loanAmount} submitted to debtor ${debtorId} with initial status ${currentLoanStatus}`
            }]
        };

        await ctx.stub.putState(loanId, Buffer.from(JSON.stringify(loan)));

        ctx.stub.setEvent('LoanSubmitted', Buffer.from(JSON.stringify({
            loanId: loanId,
            creditorId: creditorId,
            debtorId: debtorId,
            amount: loanAmount,
            status: currentLoanStatus
        })));

        console.info(`✅ Loan ${loanId} submitted successfully by creditor`);
        return JSON.stringify(loan);
    }

    /**
     * Updates the status of a loan record.
     * Accessible by Debtor (for ACCEPTED/REJECTED) and Creditor (for DEFAULT/NPA).
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Loan identifier
     * @param {string} newStatus - The new status for the loan (e.g., 'ACCEPTED', 'REJECTED', 'DEFAULT', 'NPA')
     * @param {string} reason - Reason for the status update (optional)
     */
    async updateLoanStatus(ctx, loanId, newStatus, reason) {
        console.info(`=== Updating Loan ${loanId} Status to ${newStatus} ===`);

        const clientIdentity = ctx.clientIdentity;
        const actorId = clientIdentity.getID();
        const mspId = clientIdentity.getMSPID();

        const loan = await this.getLoan(ctx, loanId);

        // Access control for status updates
        if (newStatus === 'ACCEPTED' || newStatus === 'REJECTED') {
            if (mspId !== 'DebtorMSP' || loan.debtorId !== actorId) {
                throw new Error('Only the intended Debtor can accept or reject this loan');
            }
            if (loan.status !== 'PROPOSED') {
                throw new Error(`Loan ${loanId} is not in PROPOSED status. Current status: ${loan.status}`);
            }
        } else if (newStatus === 'DEFAULT' || newStatus === 'NPA') {
            if (mspId !== 'CreditorMSP' || loan.creditorId !== actorId) {
                throw new Error('Only the Creditor who proposed the loan can set its status to DEFAULT or NPA');
            }
            if (loan.status === 'REJECTED') {
                throw new Error(`Cannot change status of a REJECTED loan to ${newStatus}`);
            }
        } else {
            throw new Error(`Invalid new status: ${newStatus}`);
        }

        loan.status = newStatus;
        loan.currentLoanStatus = newStatus; // Update current status field as well

        const timestamp = new Date().toISOString();
        let actionDetails = `Loan status updated to ${newStatus}`;

        if (newStatus === 'ACCEPTED') {
            loan.acceptedAt = timestamp;
            actionDetails = `Loan accepted by debtor`;
        } else if (newStatus === 'REJECTED') {
            loan.rejectedAt = timestamp;
            loan.rejectionReason = reason;
            actionDetails = `Loan rejected: ${reason}`;
        } else if (newStatus === 'DEFAULT') {
            loan.defaultedAt = timestamp;
            actionDetails = `Loan marked as DEFAULT: ${reason}`;
        } else if (newStatus === 'NPA') {
            loan.npaAt = timestamp;
            actionDetails = `Loan marked as NPA: ${reason}`;
        }

        loan.transactionHistory.push({
            action: `LOAN_${newStatus.toUpperCase()}`,
            actor: actorId,
            timestamp: timestamp,
            details: actionDetails
        });

        await ctx.stub.putState(loanId, Buffer.from(JSON.stringify(loan)));

        ctx.stub.setEvent(`LoanStatusUpdated`, Buffer.from(JSON.stringify({
            loanId: loanId,
            actor: actorId,
            newStatus: newStatus,
            reason: reason || ''
        })));

        console.info(`✅ Loan ${loanId} status updated to ${newStatus} successfully`);
        return JSON.stringify(loan);
    }

    /**
     * Debtor accepts a loan proposal.
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Loan identifier
     * @param {string} additionalDocumentHashesJson - Additional document hashes from debtor (JSON string)
     */
    async acceptLoan(ctx, loanId, additionalDocumentHashesJson) {
        console.info('=== DEBTOR: Accepting Loan ===');
        const loan = await this.getLoan(ctx, loanId);
        const debtorId = ctx.clientIdentity.getID();

        if (loan.debtorId !== debtorId) {
            throw new Error(`Loan ${loanId} is not intended for this debtor`);
        }

        // Add debtor document hashes
        if (additionalDocumentHashesJson) {
            const debtorDocs = JSON.parse(additionalDocumentHashesJson);
            if (!loan.documentHashes) {
                loan.documentHashes = {};
            }
            Object.assign(loan.documentHashes, debtorDocs); // Merge new docs
            await ctx.stub.putState(loanId, Buffer.from(JSON.stringify(loan))); // Update ledger with new docs
        }

        return this.updateLoanStatus(ctx, loanId, 'ACCEPTED', 'Debtor accepted the loan proposal');
    }

    /**
     * Debtor rejects a loan proposal.
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Loan identifier
     * @param {string} rejectionReason - Reason for rejection
     */
    async rejectLoan(ctx, loanId, rejectionReason) {
        console.info('=== DEBTOR: Rejecting Loan ===');
        const loan = await this.getLoan(ctx, loanId);
        const debtorId = ctx.clientIdentity.getID();

        if (loan.debtorId !== debtorId) {
            throw new Error(`Loan ${loanId} is not intended for this debtor`);
        }

        return this.updateLoanStatus(ctx, loanId, 'REJECTED', rejectionReason);
    }

    // ==========================================
    // ADMIN FUNCTIONS - Monitoring
    // ==========================================

    /**
     * Get all loans for admin monitoring
     * @param {Context} ctx - Transaction context
     */
    async getAllLoans(ctx) {
        // Validate admin authorization
        const mspId = ctx.clientIdentity.getMSPID();
        if (mspId !== 'AdminMSP') {
            throw new Error('Only Admin organization can view all loans');
        }

        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                allResults.push(record);
            } catch (err) {
                console.log(err);
            }
            result = await iterator.next();
        }
        
        return JSON.stringify(allResults);
    }

    /**
     * Get loan statistics for admin dashboard
     * @param {Context} ctx - Transaction context
     */
    async getLoanStatistics(ctx) {
        // Validate admin authorization
        const mspId = ctx.clientIdentity.getMSPID();
        if (mspId !== 'AdminMSP') {
            throw new Error('Only Admin organization can view statistics');
        }

        const allLoansJson = await this.getAllLoans(ctx);
        const allLoans = JSON.parse(allLoansJson);
        
        const stats = {
            totalLoans: allLoans.length,
            proposedLoans: allLoans.filter(loan => loan.status === 'PROPOSED').length,
            acceptedLoans: allLoans.filter(loan => loan.status === 'ACCEPTED').length,
            rejectedLoans: allLoans.filter(loan => loan.status === 'REJECTED').length,
            totalAmount: allLoans.reduce((sum, loan) => sum + loan.amount, 0),
            acceptedAmount: allLoans.filter(loan => loan.status === 'ACCEPTED').reduce((sum, loan) => sum + loan.amount, 0),
            generatedAt: new Date().toISOString()
        };

        return JSON.stringify(stats);
    }

    // ==========================================
    // QUERY FUNCTIONS
    // ==========================================

    /**
     * Get a specific loan
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Loan identifier
     */
    async getLoan(ctx, loanId) {
        const loanJSON = await ctx.stub.getState(loanId);
        if (!loanJSON || loanJSON.length === 0) {
            throw new Error(`Loan ${loanId} does not exist`);
        }
        return JSON.parse(loanJSON.toString());
    }

    /**
     * Check if loan exists
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Loan identifier
     */
    async loanExists(ctx, loanId) {
        const loanJSON = await ctx.stub.getState(loanId);
        return loanJSON && loanJSON.length > 0;
    }

    /**
     * Get loan history for a specific loan
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Loan identifier
     */
    async getLoanHistory(ctx, loanId) {
        const resultsIterator = await ctx.stub.getHistoryForKey(loanId);
        const results = [];
        let res = await resultsIterator.next();
        
        while (!res.done) {
            if (res.value) {
                const jsonRes = {};
                jsonRes.TxId = res.value.txId;
                jsonRes.Timestamp = res.value.timestamp;
                jsonRes.IsDelete = res.value.isDelete;
                
                try {
                    jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    jsonRes.Value = res.value.value.toString('utf8');
                }
                
                results.push(jsonRes);
            }
            res = await resultsIterator.next();
        }
        
        await resultsIterator.close();
        return JSON.stringify(results);
    }

    // ==========================================
    // DOCUMENT HASH VERIFICATION
    // ==========================================

    /**
     * Verify document hash integrity
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Loan identifier
    /**
     * Verify document hash integrity
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Loan identifier
     * @param {string} documentType - Type of document (e.g., 'debtRecords', 'balanceSheet')
     * @param {string} providedHash - Hash (IPFS CID) to verify
     */
    async verifyDocumentHash(ctx, loanId, documentType, providedHash) {
        const loan = await this.getLoan(ctx, loanId);
        
        // Ensure documentHashes is an object and contains the documentType
        let storedHash = null;
        if (loan.documentHashes && typeof loan.documentHashes === 'object' && loan.documentHashes[documentType]) {
            storedHash = loan.documentHashes[documentType];
        }
        
        const isValid = storedHash === providedHash;
        
        return JSON.stringify({
            loanId: loanId,
            documentType: documentType,
            isValid: isValid,
            storedHash: storedHash,
            providedHash: providedHash,
            verifiedAt: new Date().toISOString()
        });
    }
}

module.exports = LoanProcessorContract;

