'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * GovernanceContract - Monitoring and Audit Contract
 * Handles read-only governance operations on governance-channel
 */
class GovernanceContract extends Contract {
  
  constructor() {
    super('GovernanceContract');
  }

  /**
   * QUERY ALL TRANSACTIONS - Only on governance-channel
   * Returns all audit records within a date range
   */
  async queryAllTransactions(ctx, startDate, endDate) {
    console.info('============= START : Query All Transactions ===========');

    // Verify channel
    const channelID = ctx.stub.getChannelID();
    if (channelID !== 'governance-channel') {
      throw new Error(`This function is only available on governance-channel. Current channel: ${channelID}`);
    }
    
    // Verify caller is GovernmentMSP
    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'GovernmentMSP') {
      throw new Error('Only Government can access audit records');
    }
    
    // Query all audit records in date range
    const query = {
      selector: {
        docType: 'AuditRecord',
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      },
      sort: [{ timestamp: 'desc' }]
    };
    
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const results = await this.getAllResults(iterator);
    
    console.info('============= END : Query All Transactions ===========');
    return JSON.stringify(results);
  }

  /**
   * QUERY LOANS BY STATUS - Governance monitoring
   */
  async queryLoansByStatus(ctx, status) {
    console.info('============= START : Query Loans By Status ===========');

    // Verify permissions
    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'GovernmentMSP') {
      throw new Error('Only Government can query loans by status');
    }
    
    const query = {
      selector: {
        docType: 'SimpleLoan',
        status: status
      }
    };
    
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const results = await this.getAllResults(iterator);
    
    console.info('============= END : Query Loans By Status ===========');
    return JSON.stringify(results);
  }

  /**
   * GENERATE AUDIT REPORT
   * Creates a compliance report for a specific period
   */
  async generateAuditReport(ctx, month, year) {
    console.info('============= START : Generate Audit Report ===========');

    // Verify permissions
    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'GovernmentMSP') {
      throw new Error('Only Government can generate reports');
    }
    
    // Calculate date range
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    
    // Get all transactions for the period
    const transactionsJSON = await this.queryAllTransactions(ctx, startDate, endDate);
    const transactions = JSON.parse(transactionsJSON);
    
    // Generate report statistics
    const report = {
      period: `${year}-${String(month).padStart(2, '0')}`,
      startDate: startDate,
      endDate: endDate,
      totalTransactions: transactions.length,
      transactionsByAction: this.groupByAction(transactions),
      loansByStatus: this.groupByStatus(transactions),
      activityByOrg: this.groupByOrg(transactions),
      generatedAt: new Date().toISOString(),
      generatedBy: ctx.clientIdentity.getID()
    };
    
    console.info('============= END : Generate Audit Report ===========');
    return JSON.stringify(report);
  }

  /**
   * GET COMPLIANCE METRICS
   * Returns real-time compliance dashboard metrics
   */
  async getComplianceMetrics(ctx) {
    console.info('============= START : Get Compliance Metrics ===========');

    // Verify permissions
    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'GovernmentMSP') {
      throw new Error('Access denied');
    }
    
    // Query recent activity (last 30 days)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentTransactionsJSON = await this.queryAllTransactions(
      ctx,
      last30Days.toISOString(),
      new Date().toISOString()
    );
    const recentTransactions = JSON.parse(recentTransactionsJSON);
    
    // Calculate metrics
    const metrics = {
      period: 'Last 30 Days',
      totalLoans: this.countByAction(recentTransactions, 'LOAN_CREATED'),
      approvedLoans: this.countByAction(recentTransactions, 'ADMIN_APPROVED'),
      rejectedLoans: this.countByAction(recentTransactions, 'ADMIN_REJECTED'),
      confirmedLoans: this.countByAction(recentTransactions, 'BORROWER_ACCEPTED'),
      pendingLoans: this.countPendingLoans(recentTransactions),
      averageApprovalTime: this.calculateAverageApprovalTime(recentTransactions),
      orgActivity: this.groupByOrg(recentTransactions),
      timestamp: new Date().toISOString()
    };
    
    console.info('============= END : Get Compliance Metrics ===========');
    return JSON.stringify(metrics);
  }

  /**
   * GET TRANSACTION HISTORY FOR SPECIFIC LOAN
   */
  async getTransactionHistory(ctx, loanId) {
    console.info('============= START : Get Transaction History ===========');

    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'GovernmentMSP') {
      throw new Error('Only Government can access transaction history');
    }
    
    const query = {
      selector: {
        docType: 'AuditRecord',
        loanId: loanId
      },
      sort: [{ timestamp: 'asc' }]
    };
    
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const results = await this.getAllResults(iterator);
    
    console.info('============= END : Get Transaction History ===========');
    return JSON.stringify(results);
  }

  /**
   * QUERY LOANS BY DATE RANGE
   */
  async queryLoansByDateRange(ctx, startDate, endDate) {
    console.info('============= START : Query Loans By Date Range ===========');

    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'GovernmentMSP') {
      throw new Error('Access denied');
    }
    
    const query = {
      selector: {
        docType: 'SimpleLoan',
        submittedAt: {
          $gte: startDate,
          $lte: endDate
        }
      },
      sort: [{ submittedAt: 'desc' }]
    };
    
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const results = await this.getAllResults(iterator);
    
    console.info('============= END : Query Loans By Date Range ===========');
    return JSON.stringify(results);
  }

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================

  /**
   * Group transactions by action type
   */
  groupByAction(transactions) {
    const grouped = {};
    transactions.forEach(tx => {
      const action = tx.action || 'unknown';
      grouped[action] = (grouped[action] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Group transactions by loan status
   */
  groupByStatus(transactions) {
    const grouped = {};
    transactions.forEach(tx => {
      const status = tx.loanSnapshot?.status || 'unknown';
      grouped[status] = (grouped[status] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Group transactions by organization
   */
  groupByOrg(transactions) {
    const grouped = {};
    transactions.forEach(tx => {
      const org = tx.msp || 'unknown';
      grouped[org] = (grouped[org] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Count transactions by specific action
   */
  countByAction(transactions, actionType) {
    return transactions.filter(tx => tx.action === actionType).length;
  }

  /**
   * Count pending loans
   */
  countPendingLoans(transactions) {
    const pendingStatuses = ['awaiting-admin', 'awaiting-borrower', 'unconfirmed'];
    return transactions.filter(tx => 
      pendingStatuses.includes(tx.loanSnapshot?.status)
    ).length;
  }

  /**
   * Calculate average approval time
   */
  calculateAverageApprovalTime(transactions) {
    const approvedLoans = transactions.filter(tx => tx.action === 'ADMIN_APPROVED');
    
    if (approvedLoans.length === 0) {
      return 0;
    }
    
    let totalTime = 0;
    let count = 0;
    
    approvedLoans.forEach(approval => {
      // Find corresponding creation
      const creation = transactions.find(tx => 
        tx.action === 'LOAN_CREATED' && 
        tx.loanId === approval.loanId
      );
      
      if (creation) {
        const createdTime = new Date(creation.timestamp).getTime();
        const approvedTime = new Date(approval.timestamp).getTime();
        totalTime += (approvedTime - createdTime);
        count++;
      }
    });
    
    if (count === 0) return 0;
    
    // Return average time in hours
    return Math.round((totalTime / count) / (1000 * 60 * 60) * 100) / 100;
  }

  /**
   * Get all results from iterator
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

module.exports = GovernanceContract;
