const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const { getContract } = require('../fabric/gateway');
const router = express.Router();

const upload = multer({ limits: { fileSize: (parseInt(process.env.MAX_UPLOAD_MB || '5') * 1024 * 1024) } });

router.post('/loans/:loanId/documents', upload.single('file'), async (req, res) => {
  try {
    const { loanId } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'file is required' });

    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // TODO: persist to Postgres (BYTEA) here - placeholder OK for now

    const { gateway, contract } = await getContract('admin', process.env.FABRIC_CHANNEL_PRIMARY, process.env.FABRIC_CHAINCODE);
    const docId = crypto.randomUUID();
    const metadata = JSON.stringify({ filename: file.originalname });
    const result = await contract.submitTransaction('SubmitLoanDocument', loanId, docId, hash, 'GENERIC', file.mimetype, String(file.size), metadata);
    await gateway.disconnect();

    res.json({ ok: true, docId, hash, chaincodeResult: result.toString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
