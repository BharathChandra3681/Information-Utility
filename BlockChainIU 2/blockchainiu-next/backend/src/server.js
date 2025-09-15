import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initLedger, storeDocumentHash } from './services/fabric.js';
import documentsRouter from './routes/documents.js';
import loansRouter from './routes/loans.js';

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT || '4001', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', ts: new Date().toISOString() });
});

// Initialize ledger with sample data from chaincode
app.post('/api/init-ledger', async (req, res) => {
  try {
    const message = await initLedger();
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed a sample document hash on Fabric (no file stored)
app.post('/api/sample/document-hash', async (req, res) => {
  try {
    const documentId = req.body.documentId || `DOC_${Date.now()}`;
    const owner = req.body.owner || 'sample-owner';
    const sha256 = req.body.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // sha256("")
    const metadata = req.body.metadata || { seeded: true };
    const record = await storeDocumentHash(documentId, sha256, owner, metadata);
    res.json({ record: JSON.parse(record) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Documents router (upload + DB + Fabric hash)
app.use('/api/documents', documentsRouter);

// Loans router (simple loan approval workflow on Fabric)
app.use('/api/loans', loansRouter);

const server = app.listen(DEFAULT_PORT, () => {
  console.log(`Backend listening on :${DEFAULT_PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${DEFAULT_PORT} already in use. Stop the other process or set PORT in .env`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

['SIGINT','SIGTERM'].forEach(sig => {
  process.on(sig, () => {
    console.log('Shutting down...');
    server.close(() => process.exit(0));
  });
});

