const express = require('express');
const { getContract } = require('../fabric/gateway');
const router = express.Router();

// Submit KYC Form-C (Admin only). Body: { loanId, kycId, partyId, formc: {...minimal fields...} }
router.post('/formc', async (req, res) => {
  try {
    const { loanId, kycId, partyId, formc } = req.body;
    if (!loanId || !kycId || !partyId || !formc) {
      return res.status(400).json({ error: 'loanId, kycId, partyId, formc required' });
    }

    const { gateway, contract } = await getContract('admin', process.env.FABRIC_CHANNEL_PRIMARY, process.env.FABRIC_CHAINCODE);
    const tx = contract.createTransaction('SubmitKYCFormC');
    tx.setTransient({ formc: Buffer.from(JSON.stringify(formc)) });
    const result = await tx.submit(loanId, kycId, partyId);
    await gateway.disconnect();

    res.json({ ok: true, kycId, result: result.toString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Approve/Reject KYC (Admin only). Body: { approved: boolean, remarks?: string }
router.post('/:kycId/approve', async (req, res) => {
  try {
    const { kycId } = req.params;
    const { approved, remarks = '' } = req.body;
    if (typeof approved === 'undefined') {
      return res.status(400).json({ error: 'approved required' });
    }

    const { gateway, contract } = await getContract('admin', process.env.FABRIC_CHANNEL_PRIMARY, process.env.FABRIC_CHAINCODE);
    const result = await contract.submitTransaction('ApproveKYC', kycId, approved ? 'true' : 'false', remarks);
    await gateway.disconnect();

    res.json({ ok: true, kycId, result: result.toString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
