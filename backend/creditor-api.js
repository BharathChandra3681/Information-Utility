const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

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

// Helper function to format loan data for frontend
function formatLoanData(loan, user) {
  return {
    id: loan.id,
    loanId: loan.id,
    borrowerName: user.username,
    loanAmount: loan.amount || '₹0',
    loanStartDate: loan.created_at.toISOString().split('T')[0],
    maturityDate: loan.maturity_date || '',
    status: loan.status.toLowerCase(),
    transactionId: loan.on_chain_tx_id,
    submittedAt: loan.created_at.toISOString(),
    docType: 'SimpleLoan'
  };
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

// Creditor Dashboard Specific Endpoints

// Get loans by organization
app.get('/api/loans', async (req, res) => {
  try {
    const { org } = req.query;
    
    let query = `
      SELECT l.*, u.username as borrower_name, u.org
      FROM loans l 
      JOIN users u ON l.applicant_user_id = u.id 
    `;
    
    const params = [];
    
    if (org) {
      query += ' WHERE u.org = $1';
      params.push(org);
    }
    
    query += ' ORDER BY l.created_at DESC';
    
    const result = await pool.query(query, params);
    
    // Format data for frontend
    const formattedLoans = result.rows.map(loan => ({
      id: loan.id,
      loanId: loan.id,
      borrowerName: loan.borrower_name,
      loanAmount: '₹1000000', // Default amount for demo
      loanStartDate: loan.created_at.toISOString().split('T')[0],
      maturityDate: '',
      status: loan.status.toLowerCase(),
      transactionId: loan.on_chain_tx_id,
      submittedAt: loan.created_at.toISOString(),
      docType: 'SimpleLoan'
    }));
    
    res.json(formattedLoans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new loan record
app.post('/api/loans', async (req, res) => {
  try {
    const { loanId, borrowerName, loanAmount, loanStartDate, maturityDate, org } = req.body;
    
    // First, get or create user
    let userResult = await pool.query('SELECT id FROM users WHERE username = $1', [borrowerName]);
    
    let userId;
    if (userResult.rows.length === 0) {
      // Create new user
      const newUser = await pool.query(
        'INSERT INTO users (username, password_hash, org) VALUES ($1, $2, $3) RETURNING id',
        [borrowerName, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', org || 'creditor']
      );
      userId = newUser.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }
    
    // Create loan
    const result = await pool.query(
      'INSERT INTO loans (applicant_user_id, status, on_chain_tx_id) VALUES ($1, $2, $3) RETURNING *',
      [userId, 'PENDING', loanId]
    );
    
    res.status(201).json({
      id: result.rows[0].id,
      loanId: result.rows[0].id,
      borrowerName: borrowerName,
      loanAmount: loanAmount,
      loanStartDate: loanStartDate,
      maturityDate: maturityDate,
      status: 'pending',
      transactionId: result.rows[0].on_chain_tx_id,
      submittedAt: result.rows[0].created_at.toISOString(),
      docType: 'SimpleLoan'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Document upload endpoint
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    const { loanId, owner } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const sha256_hash = generateHash(file.buffer);
    const docId = generateHash(Date.now().toString() + file.originalname);
    
    // Get loan ID if provided, otherwise create a new one
    let actualLoanId = loanId;
    if (!actualLoanId) {
      // Create a new loan record for the document
      const userResult = await pool.query('SELECT id FROM users WHERE username = $1', [owner]);
      let userId;
      
      if (userResult.rows.length === 0) {
        const newUser = await pool.query(
          'INSERT INTO users (username, password_hash, org) VALUES ($1, $2, $3) RETURNING id',
          [owner, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'creditor']
        );
        userId = newUser.rows[0].id;
      } else {
        userId = userResult.rows[0].id;
      }
      
      const loanResult = await pool.query(
        'INSERT INTO loans (applicant_user_id, status) VALUES ($1, $2) RETURNING id',
        [userId, 'PENDING']
      );
      actualLoanId = loanResult.rows[0].id;
    }
    
    const result = await pool.query(
      `INSERT INTO documents (doc_id, loan_id, filename, mime_type, size_bytes, sha256_hash, content) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [docId, actualLoanId, file.originalname, file.mimetype, file.size, sha256_hash, file.buffer]
    );
    
    res.status(201).json({
      id: result.rows[0].id,
      filename: result.rows[0].filename,
      loan_id: result.rows[0].loan_id,
      size_bytes: result.rows[0].size_bytes,
      verified: result.rows[0].committed,
      created_at: result.rows[0].created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get documents by owner
app.get('/api/documents', async (req, res) => {
  try {
    const { owner } = req.query;
    
    let query = `
      SELECT d.id, d.filename, d.loan_id, d.size_bytes, d.committed as verified, d.created_at
      FROM documents d
      JOIN loans l ON d.loan_id = l.id
      JOIN users u ON l.applicant_user_id = u.id
    `;
    
    const params = [];
    
    if (owner) {
      query += ' WHERE u.username = $1';
      params.push(owner);
    }
    
    query += ' ORDER BY d.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download document
app.get('/api/documents/:id/download', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT filename, mime_type, content FROM documents WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const document = result.rows[0];
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    res.setHeader('Content-Type', document.mime_type);
    res.send(document.content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // In a real application, verify password hash
    const result = await pool.query(
      'SELECT id, username, org FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({
      id: result.rows[0].id,
      username: result.rows[0].username,
      role: result.rows[0].org,
      email: result.rows[0].username
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const { org } = req.query;
    
    let baseQuery = `
      FROM loans l
      JOIN users u ON l.applicant_user_id = u.id
    `;
    
    const params = [];
    if (org) {
      baseQuery += ' WHERE u.org = $1';
      params.push(org);
    }
    
    const [totalLoans, pendingLoans, confirmedLoans, totalExposure] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count ${baseQuery}`, params),
      pool.query(`SELECT COUNT(*) as count ${baseQuery} AND l.status = 'PENDING'`, params),
      pool.query(`SELECT COUNT(*) as count ${baseQuery} AND l.status = 'CONFIRMED'`, params),
      pool.query(`SELECT COUNT(*) as count ${baseQuery}`, params)
    ]);
    
    res.json({
      totalSubmissions: parseInt(totalLoans.rows[0].count),
      pendingConfirmation: parseInt(pendingLoans.rows[0].count),
      confirmedRecords: parseInt(confirmedLoans.rows[0].count),
      totalExposure: parseInt(totalExposure.rows[0].count) * 1000000 // Demo value
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Creditor Dashboard API server running on port ${port}`);
});
