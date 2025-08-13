const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL connection
const pool = new Pool({
  user: 'creditor_user',
  host: 'localhost',
  database: 'creditor_dashboard',
  password: 'creditor_pass',
  port: 5432,
});

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to generate SHA256 hash
function generateHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', timestamp: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Loan Management Endpoints

// Get all loans
app.get('/api/loans', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, u.username as borrower_name 
      FROM loans l 
      JOIN users u ON l.applicant_user_id = u.id 
      ORDER BY l.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get loan by ID
app.get('/api/loans/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, u.username as borrower_name 
      FROM loans l 
      JOIN users u ON l.applicant_user_id = u.id 
      WHERE l.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new loan
app.post('/api/loans', async (req, res) => {
  try {
    const { applicant_user_id, status = 'PENDING', on_chain_tx_id } = req.body;
    
    const result = await pool.query(
      'INSERT INTO loans (applicant_user_id, status, on_chain_tx_id) VALUES ($1, $2, $3) RETURNING *',
      [applicant_user_id, status, on_chain_tx_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update loan status
app.put('/api/loans/:id', async (req, res) => {
  try {
    const { status, on_chain_tx_id } = req.body;
    
    const result = await pool.query(
      'UPDATE loans SET status = $1, on_chain_tx_id = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [status, on_chain_tx_id, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Document Management Endpoints

// Upload document
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    const { loan_id, filename, mime_type } = req.body;
    const fileBuffer = req.file.buffer;
    const sha256_hash = generateHash(fileBuffer);
    
    const result = await pool.query(
      `INSERT INTO documents (doc_id, loan_id, filename, mime_type, size_bytes, sha256_hash, content) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [generateHash(Date.now().toString()), loan_id, filename, mime_type, fileBuffer.length, sha256_hash, fileBuffer]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get documents for a loan
app.get('/api/documents/loan/:loan_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, doc_id, filename, mime_type, size_bytes, sha256_hash, created_at FROM documents WHERE loan_id = $1',
      [req.params.loan_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get document by ID
app.get('/api/documents/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, doc_id, filename, mime_type, size_bytes, sha256_hash, created_at FROM documents WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Management Endpoints

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, org, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { username, password_hash, org, fabric_id } = req.body;
    
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, org, fabric_id) VALUES ($1, $2, $3, $4) RETURNING id, username, org, created_at',
      [username, password_hash, org, fabric_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Creditor Dashboard API server running on port ${port}`);
});
