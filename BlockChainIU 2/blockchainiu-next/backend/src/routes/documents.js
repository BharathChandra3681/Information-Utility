import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { pool, migrate } from '../services/db.js';
import { storeDocumentHash } from '../services/fabric.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Ensure DB ready
router.use(async (req, res, next) => {
  try {
    await migrate();
    next();
  } catch (err) {
    next(err);
  }
});

// Upload a document: stores in Postgres and writes hash to Fabric
// Creditor uploads a document tied to an optional loanId; stored pending verification
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }
    const owner = req.body.owner || 'unknown-owner';
    const loanId = req.body.loanId || null;
    const documentId = req.body.documentId || `DOC_${Date.now()}`;
    const sha256 = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // Save to Postgres
    await pool.query(
      `INSERT INTO documents (id, filename, mimetype, size_bytes, owner_id, loan_id, sha256, storage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        documentId,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        owner,
        loanId,
        sha256,
        req.file.buffer,
      ],
    );

    res.json({
      id: documentId,
      sha256,
      status: 'PENDING_VERIFICATION',
    });
  } catch (err) {
    next(err);
  }
});

// Fetch document metadata
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, filename, mimetype, size_bytes, owner_id, sha256, created_at FROM documents WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Download document
router.get('/:id/download', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT filename, mimetype, storage FROM documents WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    const row = rows[0];
    res.setHeader('Content-Type', row.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${row.filename}"`);
    res.send(row.storage);
  } catch (err) {
    next(err);
  }
});

// List documents by owner
router.get('/', async (req, res, next) => {
  try {
    const { owner, loanId } = req.query;
    if (owner) {
      const { rows } = await pool.query('SELECT id, filename, mimetype, size_bytes, owner_id, loan_id, sha256, verified, created_at FROM documents WHERE owner_id = $1 ORDER BY created_at DESC', [owner]);
      return res.json(rows);
    }
    if (loanId) {
      const { rows } = await pool.query('SELECT id, filename, mimetype, size_bytes, owner_id, loan_id, sha256, verified, created_at FROM documents WHERE loan_id = $1 ORDER BY created_at DESC', [loanId]);
      return res.json(rows);
    }
    res.status(400).json({ error: 'owner or loanId is required' });
  } catch (err) {
    next(err);
  }
});

// List pending documents for admin review
router.get('/pending/list', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, filename, mimetype, size_bytes, owner_id, loan_id, sha256, created_at FROM documents WHERE verified = FALSE ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Admin verifies a document; once verified, anchor hash on Fabric
router.post('/:id/verify', async (req, res, next) => {
  try {
    const documentId = req.params.id;
    const adminId = req.body.adminId || 'admin';
    const { rows } = await pool.query('SELECT id, owner_id, filename, mimetype, size_bytes, sha256 FROM documents WHERE id = $1', [documentId]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    const row = rows[0];

    // Write hash to Fabric now
    const fabricRecord = await storeDocumentHash(row.id, row.sha256, row.owner_id, {
      filename: row.filename,
      mimetype: row.mimetype,
      sizeBytes: row.size_bytes,
      verified: true,
    });

    await pool.query('UPDATE documents SET verified = TRUE, verified_at = NOW(), verified_by = $2 WHERE id = $1', [documentId, adminId]);

    res.json({ id: documentId, status: 'VERIFIED_AND_ANCHORED', fabric: JSON.parse(fabricRecord) });
  } catch (err) {
    next(err);
  }
});

export default router;

