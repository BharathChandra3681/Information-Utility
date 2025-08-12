import express from 'express';
import {
  submitSimpleLoan,
  approveLoanByAdmin,
  rejectLoanByAdmin,
  approveLoanByBorrower,
  rejectLoanByBorrower,
  getSimpleLoans,
} from '../services/fabric.js';

const router = express.Router();

// Submit loan (creditor)
router.post('/', async (req, res) => {
  try {
    const { loanId, borrowerName, loanAmount, loanStartDate, maturityDate, org = 'creditor' } = req.body;
    if (!loanId || !borrowerName || !loanAmount || !loanStartDate) {
      return res.status(400).json({ error: 'loanId, borrowerName, loanAmount, loanStartDate are required' });
    }
    const rec = await submitSimpleLoan(loanId, borrowerName, loanAmount, loanStartDate, maturityDate, org);
    res.json(rec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin approve
router.post('/:loanId/admin/approve', async (req, res) => {
  try {
    const { loanId } = req.params;
    const { org = 'admin' } = req.body;
    const rec = await approveLoanByAdmin(loanId, org);
    res.json(rec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin reject
router.post('/:loanId/admin/reject', async (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason, org = 'admin' } = req.body;
    const rec = await rejectLoanByAdmin(loanId, reason, org);
    res.json(rec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Borrower approve
router.post('/:loanId/borrower/approve', async (req, res) => {
  try {
    const { loanId } = req.params;
    const { org = 'debtor' } = req.body;
    const rec = await approveLoanByBorrower(loanId, org);
    res.json(rec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Borrower reject
router.post('/:loanId/borrower/reject', async (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason, org = 'debtor' } = req.body;
    const rec = await rejectLoanByBorrower(loanId, reason, org);
    res.json(rec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List loans (based on Fabric access control)
router.get('/', async (req, res) => {
  try {
    const { org = 'admin' } = req.query;
    const list = await getSimpleLoans(org);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
