/**
 * Governance Routes
 * Handles monitoring and audit operations on governance-channel
 */

const express = require('express');
const router = express.Router();
const fabricGateway = require('../fabric/gateway');
const logger = require('../utils/logger');

const CHANNEL_NAME = process.env.CHANNEL_GOVERNANCE || 'governance-channel';
const CHAINCODE_NAME = process.env.CHAINCODE_NAME || 'iu-unified';
const CONTRACT_NAME = 'GovernanceContract';

/**
 * GET /api/governance/transactions
 * Query all transactions within date range (Government only)
 */
router.get('/transactions', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 30 days if not provided
    const end = endDate || new Date().toISOString();
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    logger.info(`Querying transactions from ${start} to ${end}`);

    const result = await fabricGateway.evaluateTransaction(
      'government',
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'queryAllTransactions',
      start,
      end
    );

    const transactions = JSON.parse(result);

    res.json({
      success: true,
      count: transactions.length,
      period: { startDate: start, endDate: end },
      data: transactions
    });
  } catch (error) {
    logger.error('Error querying transactions:', error);
    next(error);
  }
});

/**
 * GET /api/governance/audit-report
 * Generate audit report for specific month (Government only)
 */
router.get('/audit-report', async (req, res, next) => {
  try {
    const { month, year } = req.query;

    // Default to current month if not provided
    const now = new Date();
    const reportMonth = month || (now.getMonth() + 1);
    const reportYear = year || now.getFullYear();

    logger.info(`Generating audit report for ${reportYear}-${reportMonth}`);

    const result = await fabricGateway.evaluateTransaction(
      'government',
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'generateAuditReport',
      reportMonth.toString(),
      reportYear.toString()
    );

    const report = JSON.parse(result);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error generating audit report:', error);
    next(error);
  }
});

/**
 * GET /api/governance/compliance-metrics
 * Get real-time compliance metrics (Government only)
 */
router.get('/compliance-metrics', async (req, res, next) => {
  try {
    logger.info('Fetching compliance metrics');

    const result = await fabricGateway.evaluateTransaction(
      'government',
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'getComplianceMetrics'
    );

    const metrics = JSON.parse(result);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error fetching compliance metrics:', error);
    next(error);
  }
});

/**
 * GET /api/governance/loans/:loanId/history
 * Get transaction history for specific loan (Government only)
 */
router.get('/loans/:loanId/history', async (req, res, next) => {
  try {
    const { loanId } = req.params;

    logger.info(`Fetching transaction history for loan ${loanId}`);

    const result = await fabricGateway.evaluateTransaction(
      'government',
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'getTransactionHistory',
      loanId
    );

    const history = JSON.parse(result);

    res.json({
      success: true,
      loanId: loanId,
      count: history.length,
      data: history
    });
  } catch (error) {
    logger.error('Error fetching transaction history:', error);
    next(error);
  }
});

/**
 * GET /api/governance/loans/by-status/:status
 * Query loans by status (Government only)
 */
router.get('/loans/by-status/:status', async (req, res, next) => {
  try {
    const { status } = req.params;

    // Validate status
    const validStatuses = ['awaiting-admin', 'approved', 'rejected', 'awaiting-borrower', 'confirmed', 'declined', 'unconfirmed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    logger.info(`Querying loans with status: ${status}`);

    const result = await fabricGateway.evaluateTransaction(
      'government',
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'queryLoansByStatus',
      status
    );

    const loans = JSON.parse(result);

    res.json({
      success: true,
      status: status,
      count: loans.length,
      data: loans
    });
  } catch (error) {
    logger.error('Error querying loans by status:', error);
    next(error);
  }
});

/**
 * GET /api/governance/loans/by-date-range
 * Query loans created within date range (Government only)
 */
router.get('/loans/by-date-range', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Both startDate and endDate are required'
      });
    }

    logger.info(`Querying loans from ${startDate} to ${endDate}`);

    const result = await fabricGateway.evaluateTransaction(
      'government',
      CHANNEL_NAME,
      CHAINCODE_NAME,
      CONTRACT_NAME,
      'queryLoansByDateRange',
      startDate,
      endDate
    );

    const loans = JSON.parse(result);

    res.json({
      success: true,
      period: { startDate, endDate },
      count: loans.length,
      data: loans
    });
  } catch (error) {
    logger.error('Error querying loans by date range:', error);
    next(error);
  }
});

module.exports = router;
