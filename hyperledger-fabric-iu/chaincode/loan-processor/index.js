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
    async proposeLoan(ctx, loanId, loanAmount, interestRate, debtorId, documentHashes) {
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
        const loan = {
            loanId: loanId,
            amount: parseFloat(loanAmount),
            interestRate: parseFloat(interestRate),
            creditorId: creditorId,
            creditorMSP: mspId,
            debtorId: debtorId,
            status: 'PROPOSED',
            documentHashes: JSON.parse(documentHashes),
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

    // ==========================================
    // DEBTOR FUNCTIONS - Loan Response
    // ==========================================

    /**
     * Debtor accepts a loan proposal
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Loan identifier
     * @param {string} additionalDocumentHashes - Additional document hashes from debtor
     */
    async acceptLoan(ctx, loanId, additionalDocumentHashes) {
        console.info('=== DEBTOR: Accepting Loan ===');
        
        // Get debtor identity
        const debtorId = ctx.clientIdentity.getID();
        const mspId = ctx.clientIdentity.getMSPID();
        
        // Validate debtor authorization
        if (mspId !== 'DebtorMSP') {
            throw new Error('Only Debtor organization can accept loans');
        }

        // Get loan
        const loan = await this.getLoan(ctx, loanId);
        
        // Validate loan status
        if (loan.status !== 'PROPOSED') {
            throw new Error(`Loan ${loanId} is not in PROPOSED status. Current status: ${loan.status}`);
        }

        // Validate debtor is the intended recipient
        if (loan.debtorId !== debtorId) {
            throw new Error(`Loan ${loanId} is not intended for this debtor`);
        }

        // Update loan
        loan.status = 'ACCEPTED';
        loan.acceptedAt = new Date().toISOString();
        
        // Add debtor document hashes
        if (additionalDocumentHashes) {
            const debtorDocs = JSON.parse(additionalDocumentHashes);
            loan.documentHashes.debtorDocuments = debtorDocs;
        }

        // Update transaction history
        loan.transactionHistory.push({
            action: 'LOAN_ACCEPTED',
            actor: debtorId,
            timestamp: new Date().toISOString(),
            details: `Loan accepted by debtor`
        });

        // Store updated loan
        await ctx.stub.putState(loanId, Buffer.from(JSON.stringify(loan)));
        
        // Emit event
        ctx.stub.setEvent('LoanAccepted', Buffer.from(JSON.stringify({
            loanId: loanId,
            creditorId: loan.creditorId,
            debtorId: debtorId,
            amount: loan.amount,
            status: 'ACCEPTED'
        })));

        console.info(`✅ Loan ${loanId} accepted successfully by debtor`);
        return JSON.stringify(loan);
    }

    /**
     * Debtor rejects a loan proposal
     * @param {Context} ctx - Transaction context
     * @param {string} loanId - Loan identifier
     * @param {string} rejectionReason - Reason for rejection
     */
    async rejectLoan(ctx, loanId, rejectionReason) {
        console.info('=== DEBTOR: Rejecting Loan ===');
        
        // Get debtor identity
        const debtorId = ctx.clientIdentity.getID();
        const mspId = ctx.clientIdentity.getMSPID();
        
        // Validate debtor authorization
        if (mspId !== 'DebtorMSP') {
            throw new Error('Only Debtor organization can reject loans');
        }

        // Get loan
        const loan = await this.getLoan(ctx, loanId);
        
        // Validate loan status
        if (loan.status !== 'PROPOSED') {
            throw new Error(`Loan ${loanId} is not in PROPOSED status. Current status: ${loan.status}`);
        }

        // Update loan
        loan.status = 'REJECTED';
        loan.rejectedAt = new Date().toISOString();
        loan.rejectionReason = rejectionReason;

        // Update transaction history
        loan.transactionHistory.push({
            action: 'LOAN_REJECTED',
            actor: debtorId,
            timestamp: new Date().toISOString(),
            details: `Loan rejected: ${rejectionReason}`
        });

        // Store updated loan
        await ctx.stub.putState(loanId, Buffer.from(JSON.stringify(loan)));
        
        // Emit event
        ctx.stub.setEvent('LoanRejected', Buffer.from(JSON.stringify({
            loanId: loanId,
            creditorId: loan.creditorId,
            debtorId: debtorId,
            amount: loan.amount,
            status: 'REJECTED',
            reason: rejectionReason
        })));

        console.info(`✅ Loan ${loanId} rejected by debtor`);
        return JSON.stringify(loan);
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
     * @param {string} documentType - Type of document
     * @param {string} providedHash - Hash to verify
     */
    async verifyDocumentHash(ctx, loanId, documentType, providedHash) {
        const loan = await this.getLoan(ctx, loanId);
        
        let storedHash = null;
        if (loan.documentHashes[documentType]) {
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
