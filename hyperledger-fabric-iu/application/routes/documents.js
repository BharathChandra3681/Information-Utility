const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const { getContract } = require('../fabric/gateway');
const db = require('../db');
const router = express.Router();

const upload = multer({ limits: { fileSize: (parseInt(process.env.MAX_UPLOAD_MB || '5') * 1024 * 1024) } });

router.post('/loans/:loanId/documents', upload.single('file'), async (req, res) => {
  const client = await db.getClient();
  try {
    const { loanId } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'file is required' });

    if (file.size > (parseInt(process.env.MAX_UPLOAD_MB || '5') * 1024 * 1024)) {
      return res.status(413).json({ error: 'File too large' });
    }

    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO documents (doc_id, loan_id, filename, mime_type, size_bytes, sha256_hash, content, metadata_json, committed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [
        crypto.randomUUID(),
        loanId,
        file.originalname,
        file.mimetype,
        file.size,
        hash,
        file.buffer,
        JSON.stringify({ filename: file.originalname }),
        false
      ]
    );

    const dbId = rows[0].id;

    const { gateway, contract } = await getContract('admin', process.env.FABRIC_CHANNEL_PRIMARY, process.env.FABRIC_CHAINCODE);
    const docId = crypto.randomUUID();
    const metadata = JSON.stringify({ filename: file.originalname });
    const result = await contract.submitTransaction('SubmitLoanDocument', loanId, docId, hash, 'GENERIC', file.mimetype, String(file.size), metadata);
    await gateway.disconnect();

    await client.query('COMMIT');
    res.json({ ok: true, id: dbId, docId, hash, chaincodeResult: result.toString() });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
