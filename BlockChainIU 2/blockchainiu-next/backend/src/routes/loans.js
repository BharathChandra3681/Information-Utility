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
    // prevent stale responses
    res.set('Cache-Control', 'no-store');

    const primary = (req.query.org || 'admin').toLowerCase();
    const borrowerId = (req.query.borrowerId || '').toString().trim();
    const orgs = Array.from(new Set([primary, 'creditor', 'debtor']));

    const byId = new Map();
    let lastErr = null;

    const statusOrder = (s) => {
      const order = ['unconfirmed', 'awaiting-admin', 'awaiting-borrower', 'confirmed', 'rejected'];
      const i = order.indexOf((s || '').toLowerCase());
      return i < 0 ? -1 : i;
    };
    const ts = (r) =>
      Date.parse(r?.updatedAt || r?.lastUpdated || r?.submittedAt || r?.loanStartDate || '') || 0;

    for (const org of orgs) {
      try {
        const list = await getSimpleLoans(org);
        if (!Array.isArray(list)) continue;

        for (const r of list) {
          const id = r?.loanId || r?.recordId || r?.id; // fixed: no bitwise ops
          if (!id) continue;
          if (borrowerId && r?.borrowerId && r.borrowerId !== borrowerId) continue;

          const current = byId.get(id);
          if (!current) {
            byId.set(id, r);
          } else {
            const a = current, b = r;
            const newer =
              ts(b) > ts(a) ||
              (ts(b) === ts(a) && statusOrder(b?.status) > statusOrder(a?.status));
            if (newer) byId.set(id, r);
          }
        }
      } catch (e) {
        lastErr = e;
      }
    }

    const merged = Array.from(byId.values()).sort((a, b) => ts(b) - ts(a));
    if (!merged.length && lastErr) {
      return res.status(500).json({ error: fabricError(lastErr) });
    }
    return res.json(merged);
  } catch (err) {
    return res.status(500).json({ error: fabricError(err) });
  }
});

export default router;
