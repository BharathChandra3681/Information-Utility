const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Gateway, Wallets } = require('fabric-network');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only document files are allowed'));
    }
  }
});

// Helper function to calculate file hash
const calculateFileHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
};

// Upload document endpoint
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    const { loanId, documentType, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { documentId } = req.params;
    
    if (!loanId || !documentType) {
      return res.status(400).json({ error: 'loanId and documentType are required' });
    }

    // Calculate file hash for integrity
    const fileHash = calculateFileHash(req.file.path);
    
    // Store document metadata in blockchain
    const result = await storeDocumentInBlockchain(documentMetadata);
    
    res.json({
      success: true,
      document: {
        ...documentMetadata,
        downloadUrl: `/api/documents/download/${documentId}`,
        viewUrl: `/api/documents/view/${documentId}`
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Store document metadata in blockchain
async function storeDocumentInBlockchain(documentMetadata) {
  try {
    const { Gateway, Wallets } = require('fabric-network');
    const path = require('path');
    
    // Load connection profile
    const ccpPath = path.resolve(__dirname, '../organizations/peerOrganizations/creditor.iu-network.com/connection-creditor.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    
    // Create wallet
    const walletPath = path.join(process.cwd(), 'wallet-creditor');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    // Check if identity exists
    const identity = await wallet.get('appUser');
    if (!identity) {
      throw new Error('Identity not found in wallet');
    }
    
    // Create gateway connection
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'appUser',
      discovery: { enabled: true, asLocalhost: true }
    });
    
    // Get network and contract
    const network = await gateway.getNetwork('financial-operations-channel');
    const contract = network.getContract('iu-basic');
    
    // Store document metadata
    const result = await contract.submitTransaction(
      'CreateDocument',
      documentMetadata.documentId,
      documentMetadata.loanId,
      documentMetadata.documentType,
      JSON.stringify(documentMetadata)
    );
    
    await gateway.disconnect();
    
    return JSON.parse(result.toString());
  } catch (error) {
    console.error('Blockchain storage error:', error);
    throw error;
  }
});

// Get document by ID
router.get('/download/:documentId', async (req, res) => {
  try {
    const { documentId }The network startup is encountering a connection issue with the peer container `peer0.creditor.iu-network.com` on port `7051`. This could be due to several reasons, such as the container not starting properly or misconfiguration in the Docker Compose file.

### Next Steps to Diagnose and Fix the Issue

1. **Check Container Logs**: I will check the logs for the `peer0.creditor.iu-network.com` container to see if there are any errors during startup.
2. **Verify Configuration**: Ensure that the configuration for the peer is correct in the Docker Compose file.
3. **Restart the Network**: If necessary, I may need to restart the network after making any changes.

Let me start by checking the logs for the `peer0.creditor.iu-network.com` container.

<execute_command>
<command>docker logs peer0.creditor.iu-network.com</command>
</execute_command>
