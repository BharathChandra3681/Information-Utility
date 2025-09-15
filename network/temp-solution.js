#!/usr/bin/env node

/**
 * TEMPORARY SOLUTION - Mock Fabric Backend
 * This bypasses the orderer issues and provides a working loan submission system
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4002; // Different port to avoid conflicts

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Mock data storage with full loan workflow support - 5 sample records
let loanRecords = [
  {
    loanId: 'LOAN001',
    borrowerName: 'TechCorp Solutions Ltd',
    loanAmount: '500000',
    loanStartDate: '2025-09-01',
    maturityDate: '2026-09-01',
    org: 'creditor',
    docType: 'SimpleLoan',
    status: 'confirmed',
    adminApproval: 'approved',
    borrowerDecision: 'approved',
    creditorName: 'First National Bank',
    submittedBy: 'creditor',
    createdAt: '2025-09-10T10:00:00.000Z',
    history: [
      { action: 'LOAN_SUBMITTED', timestamp: '2025-09-10T10:00:00.000Z', performedBy: 'creditor', details: 'Loan submitted by creditor' },
      { action: 'BORROWER_APPROVED', timestamp: '2025-09-10T14:30:00.000Z', performedBy: 'debtor', details: 'Borrower approved loan' },
      { action: 'ADMIN_APPROVED', timestamp: '2025-09-11T09:15:00.000Z', performedBy: 'admin', details: 'Admin approved loan' }
    ]
  },
  {
    loanId: 'LOAN002',
    borrowerName: 'Green Energy Corp',
    loanAmount: '750000',
    loanStartDate: '2025-09-05',
    maturityDate: '2027-09-05',
    org: 'creditor',
    docType: 'SimpleLoan',
    status: 'awaiting-borrower',
    adminApproval: 'pending',
    borrowerDecision: 'pending',
    creditorName: 'Metro Commercial Bank',
    submittedBy: 'creditor',
    createdAt: '2025-09-12T11:30:00.000Z',
    history: [
      { action: 'LOAN_SUBMITTED', timestamp: '2025-09-12T11:30:00.000Z', performedBy: 'creditor', details: 'Loan submitted by creditor' }
    ]
  },
  {
    loanId: 'LOAN003',
    borrowerName: 'Manufacturing Plus Inc',
    loanAmount: '1200000',
    loanStartDate: '2025-09-08',
    maturityDate: '2026-12-08',
    org: 'creditor',
    docType: 'SimpleLoan',
    status: 'awaiting-admin',
    adminApproval: 'pending',
    borrowerDecision: 'approved',
    creditorName: 'Industrial Credit Union',
    submittedBy: 'creditor',
    createdAt: '2025-09-13T08:45:00.000Z',
    history: [
      { action: 'LOAN_SUBMITTED', timestamp: '2025-09-13T08:45:00.000Z', performedBy: 'creditor', details: 'Loan submitted by creditor' },
      { action: 'BORROWER_APPROVED', timestamp: '2025-09-13T16:20:00.000Z', performedBy: 'debtor', details: 'Borrower approved loan' }
    ]
  },
  {
    loanId: 'LOAN004',
    borrowerName: 'Retail Chain Stores',
    loanAmount: '300000',
    loanStartDate: '2025-09-10',
    maturityDate: '2026-03-10',
    org: 'creditor',
    docType: 'SimpleLoan',
    status: 'rejected-by-borrower',
    adminApproval: 'pending',
    borrowerDecision: 'rejected',
    creditorName: 'Community Savings Bank',
    submittedBy: 'creditor',
    createdAt: '2025-09-14T13:15:00.000Z',
    history: [
      { action: 'LOAN_SUBMITTED', timestamp: '2025-09-14T13:15:00.000Z', performedBy: 'creditor', details: 'Loan submitted by creditor' },
      { action: 'BORROWER_REJECTED', timestamp: '2025-09-14T15:45:00.000Z', performedBy: 'debtor', details: 'Borrower rejected loan: Interest rate too high' }
    ]
  },
  {
    loanId: 'LOAN005',
    borrowerName: 'Healthcare Services Group',
    loanAmount: '900000',
    loanStartDate: '2025-09-12',
    maturityDate: '2027-06-12',
    org: 'creditor',
    docType: 'SimpleLoan',
    status: 'rejected-by-admin',
    adminApproval: 'rejected',
    borrowerDecision: 'approved',
    creditorName: 'Regional Development Bank',
    submittedBy: 'creditor',
    createdAt: '2025-09-14T09:00:00.000Z',
    history: [
      { action: 'LOAN_SUBMITTED', timestamp: '2025-09-14T09:00:00.000Z', performedBy: 'creditor', details: 'Loan submitted by creditor' },
      { action: 'BORROWER_APPROVED', timestamp: '2025-09-14T11:30:00.000Z', performedBy: 'debtor', details: 'Borrower approved loan' },
      { action: 'ADMIN_REJECTED', timestamp: '2025-09-14T14:20:00.000Z', performedBy: 'admin', details: 'Admin rejected loan: Insufficient collateral documentation' }
    ]
  }
];

// Mock loan submission endpoint - Compatible with creditor dashboard
app.post('/api/loans', (req, res) => {
  try {
    // Support both old format (creditorId, debtorId, amount, etc.) and new format (loanId, borrowerName, etc.)
    const { 
      loanId, borrowerName, loanAmount, loanStartDate, maturityDate, org,
      creditorId, debtorId, amount, interestRate, term, description 
    } = req.body;
    
    let newLoan;
    
    // Check if it's the new format (from creditor dashboard)
    if (loanId && borrowerName && loanAmount && loanStartDate) {
      newLoan = {
        loanId: loanId,
        borrowerName: String(borrowerName).trim(),
        loanAmount: String(loanAmount).trim(),
        loanStartDate: loanStartDate,
        maturityDate: maturityDate || '',
        org: org || 'creditor',
        docType: 'SimpleLoan',
        status: 'awaiting-borrower', // Initial state: waiting for borrower approval
        adminApproval: 'pending',
        borrowerDecision: 'pending',
        creditorName: 'Creditor Organization',
        submittedBy: 'creditor',
        createdAt: new Date().toISOString(),
        history: [
          { 
            action: 'LOAN_SUBMITTED', 
            timestamp: new Date().toISOString(), 
            performedBy: 'creditor', 
            details: 'Loan submitted by creditor' 
          }
        ]
      };
    } 
    // Check if it's the old format (direct API calls)
    else if (creditorId && debtorId && amount && interestRate && term) {
      newLoan = {
        id: `LOAN${String(loanRecords.length + 1).padStart(3, '0')}`,
        creditorId,
        debtorId,
        amount: parseFloat(amount),
        interestRate: parseFloat(interestRate),
        term: parseInt(term),
        status: 'pending',
        createdAt: new Date().toISOString(),
        description: description || 'No description provided'
      };
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields. Expected: loanId, borrowerName, loanAmount, loanStartDate OR creditorId, debtorId, amount, interestRate, term'
      });
    }

    loanRecords.push(newLoan);

    console.log('✅ Loan submitted successfully:', newLoan);

    // Return format compatible with creditor dashboard
    res.json(newLoan);

  } catch (error) {
    console.error('❌ Error submitting loan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all loans - Compatible with all dashboards
app.get('/api/loans', (req, res) => {
  const { org } = req.query;
  
  console.log(`📋 GET /api/loans requested with org=${org}`);
  
  // Filter loans based on organization if specified
  let filteredLoans = loanRecords;
  if (org === 'creditor') {
    // Creditors see all loans they submitted
    filteredLoans = loanRecords.filter(loan => 
      loan.org === 'creditor' || loan.submittedBy === 'creditor' || loan.docType === 'SimpleLoan'
    );
  } else if (org === 'debtor') {
    // Debtors see loans awaiting their approval or that they've already acted on
    filteredLoans = loanRecords.filter(loan => 
      loan.docType === 'SimpleLoan' && (
        loan.status === 'awaiting-borrower' || 
        loan.status === 'awaiting-admin' || 
        loan.status === 'confirmed' ||
        loan.status === 'rejected-by-borrower' ||
        loan.status === 'rejected-by-admin'
      )
    );
  } else if (org === 'admin') {
    // Admins see all loans for review
    filteredLoans = loanRecords.filter(loan => 
      loan.docType === 'SimpleLoan'
    );
  }
  
  console.log(`📋 Returning ${filteredLoans.length} loans for org=${org}`);
  
  // Return format compatible with all dashboards
  res.json(filteredLoans);
});

// Get loan by ID
app.get('/api/loans/:id', (req, res) => {
  const loan = loanRecords.find(l => l.id === req.params.id || l.loanId === req.params.id);
  if (!loan) {
    return res.status(404).json({
      success: false,
      error: 'Loan not found'
    });
  }
  res.json({
    success: true,
    data: loan
  });
});

// Admin approve loan
app.post('/api/loans/:loanId/admin/approve', (req, res) => {
  try {
    const { loanId } = req.params;
    const { org = 'admin' } = req.body;
    
    const loan = loanRecords.find(l => l.loanId === loanId);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }
    
    if (loan.status === 'confirmed') {
      return res.status(400).json({ success: false, error: 'Loan already confirmed' });
    }
    
    if (loan.status === 'rejected-by-admin') {
      return res.status(400).json({ success: false, error: 'Cannot approve a loan that has been rejected by admin' });
    }
    
    // Update loan status
    loan.adminApproval = 'approved';
    loan.status = (loan.borrowerDecision === 'approved') ? 'confirmed' : 'awaiting-borrower';
    loan.history.push({
      action: 'ADMIN_APPROVED',
      timestamp: new Date().toISOString(),
      performedBy: 'admin',
      details: 'Admin approved loan'
    });
    
    console.log(`✅ Admin approved loan ${loanId}:`, loan);
    res.json(loan);
    
  } catch (error) {
    console.error('❌ Error approving loan:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Admin reject loan
app.post('/api/loans/:loanId/admin/reject', (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason, org = 'admin' } = req.body;
    
    const loan = loanRecords.find(l => l.loanId === loanId);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }
    
    if (loan.status === 'confirmed') {
      return res.status(400).json({ success: false, error: 'Loan already confirmed' });
    }
    
    // Update loan status
    loan.adminApproval = 'rejected';
    loan.status = 'rejected-by-admin';
    loan.history.push({
      action: 'ADMIN_REJECTED',
      timestamp: new Date().toISOString(),
      performedBy: 'admin',
      details: `Admin rejected loan: ${reason || 'No reason provided'}`
    });
    
    console.log(`❌ Admin rejected loan ${loanId}:`, loan);
    res.json(loan);
    
  } catch (error) {
    console.error('❌ Error rejecting loan:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Borrower approve loan
app.post('/api/loans/:loanId/borrower/approve', (req, res) => {
  try {
    const { loanId } = req.params;
    const { org = 'debtor' } = req.body;
    
    const loan = loanRecords.find(l => l.loanId === loanId);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }
    
    if (loan.status === 'confirmed') {
      return res.status(400).json({ success: false, error: 'Loan already confirmed' });
    }
    
    if (loan.status === 'rejected-by-admin') {
      return res.status(400).json({ success: false, error: 'Cannot approve a loan that has been rejected by admin' });
    }
    
    // Update loan status
    loan.borrowerDecision = 'approved';
    loan.status = (loan.adminApproval === 'approved') ? 'confirmed' : 'awaiting-admin';
    loan.history.push({
      action: 'BORROWER_APPROVED',
      timestamp: new Date().toISOString(),
      performedBy: 'debtor',
      details: 'Borrower approved loan'
    });
    
    console.log(`✅ Borrower approved loan ${loanId}:`, loan);
    res.json(loan);
    
  } catch (error) {
    console.error('❌ Error approving loan:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Borrower reject loan
app.post('/api/loans/:loanId/borrower/reject', (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason, org = 'debtor' } = req.body;
    
    const loan = loanRecords.find(l => l.loanId === loanId);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }
    
    if (loan.status === 'confirmed') {
      return res.status(400).json({ success: false, error: 'Loan already confirmed' });
    }
    
    // Update loan status
    loan.borrowerDecision = 'rejected';
    loan.status = 'rejected-by-borrower';
    loan.history.push({
      action: 'BORROWER_REJECTED',
      timestamp: new Date().toISOString(),
      performedBy: 'debtor',
      details: `Borrower rejected loan: ${reason || 'No reason provided'}`
    });
    
    console.log(`❌ Borrower rejected loan ${loanId}:`, loan);
    res.json(loan);
    
  } catch (error) {
    console.error('❌ Error rejecting loan:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    loans: loanRecords.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Temporary Fabric Backend running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST /api/loans - Submit new loan`);
  console.log(`   GET  /api/loans - Get all loans (supports ?org=creditor|debtor|admin)`);
  console.log(`   GET  /api/loans/:id - Get specific loan`);
  console.log(`   POST /api/loans/:loanId/admin/approve - Admin approve loan`);
  console.log(`   POST /api/loans/:loanId/admin/reject - Admin reject loan`);
  console.log(`   POST /api/loans/:loanId/borrower/approve - Borrower approve loan`);
  console.log(`   POST /api/loans/:loanId/borrower/reject - Borrower reject loan`);
  console.log(`   GET  /health - Health check`);
  console.log(`\n✅ Ready to accept loan submissions and approvals!`);
});

module.exports = app;
