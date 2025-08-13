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

// Helper to extract rich Fabric errors
function fabricError(err) {
  const resp = err?.responses?.map(r => r?.response?.message || r?.message).filter(Boolean) || [];
  const endorsements = resp.length ? ` | peer errors: ${resp.join(' | ')}` : '';
  return `${err?.message || 'Operation failed'}${endorsements}`;
}

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
    res.status(500).json({ error: fabricError(err) });
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
    res.status(500).json({ error: fabricError(err) });
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
    res.status(500).json({ error: fabricError(err) });
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
    res.status(500).json({ error: fabricError(err) });
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
    res.status(500).json({ error: fabricError(err) });
  }
});

// List loans (aggregate across orgs; de-duplicate by id; prefer freshest record)
router.get('/', async (req, res) => {
  try {
    const primary = (req.query.org || 'admin').toLowerCase();
    const orgs = Array.from(new Set([primary, 'creditor', 'debtor']));

    const byId = new Map();
    let lastErr = null;

    for (const org of orgs) {
      try {
        const list = await getSimpleLoans(org);
        if (!Array.isArray(list)) continue;
        for (const r of list) {
          const id = r?.loanId || r?.recordId || r?.id;
          if (!id) continue;
          const existing = byId.get(id);
          const timeOf = (o) => new Date(o?.metadata?.lastModified || o?.submittedAt || o?.loanStartDate || 0).getTime();
          if (!existing || timeOf(r) >= timeOf(existing)) {
            byId.set(id, r);
          }
        }
      } catch (e) {
        lastErr = e; // keep for debugging, but continue trying other orgs
        continue;
      }
    }

    const combined = Array.from(byId.values())
      .filter(r => r?.docType === 'SimpleLoan')
      .sort((a, b) => new Date(b?.submittedAt || b?.loanStartDate || 0) - new Date(a?.submittedAt || a?.loanStartDate || 0));

    // If everything failed and nothing combined, surface the last error to help debug
    if (!combined.length && lastErr) {
      return res.json([]); // keep response shape, UI handles empty array; logs carry errors
    }

    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: fabricError(err) });
  }
});

export default router;
