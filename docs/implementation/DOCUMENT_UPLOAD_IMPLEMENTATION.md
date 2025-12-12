# Document Upload Feature Implementation Summary

## Overview
Added comprehensive document upload functionality to the Information Utility blockchain network, allowing creditors to attach supporting documents when creating loan records.

## Changes Made

### 1. Blockchain Chaincode Updates

#### File: `blockchain/chaincode/iu-unified/models/SimpleLoan.js`
**Changes:**
- Added `documents` array field to store document metadata
- Updated `toJSON()` method to include documents in serialization

**Impact:**
- Loan records now support multiple document attachments
- Document metadata stored on blockchain for integrity verification

### 2. Backend API Updates

#### File: `backend/middleware/secureFileUpload.js` (NEW)
**Features:**
- Multer-based file upload handling
- File type validation (PDF, images, Word, Excel)
- File size limits (10MB per file, max 10 files)
- SHA256 hash generation for integrity verification
- Unique filename generation to prevent collisions
- Automatic directory creation

**Security:**
- Sanitized filenames prevent path traversal attacks
- File type whitelist prevents malicious uploads
- Size limits prevent DoS attacks

#### File: `backend/routes/loans.js`
**New Endpoints:**
1. **POST /api/loans** (Updated)
   - Now accepts `multipart/form-data`
   - Handles file uploads alongside loan data
   - Returns document upload count in response

2. **GET /api/loans/:loanId/documents** (NEW)
   - Lists all documents for a loan
   - Returns metadata only (no file content)
   - Supports org parameter for access control

3. **GET /api/loans/:loanId/documents/:documentId** (NEW)
   - Downloads specific document file
   - Streams file to client
   - Sets appropriate headers for file download

#### File: `backend/package.json`
**Dependencies Added:**
- `multer@1.4.5-lts.1` - File upload middleware

### 3. Documentation

#### File: `Resources/DOCUMENT_UPLOAD_FEATURE.md` (NEW)
**Contents:**
- Complete feature documentation
- API usage examples (cURL, JavaScript, React)
- Security considerations
- Installation instructions
- Testing guide
- Troubleshooting tips

### 4. Testing Tools

#### File: `backend/test-upload.html` (NEW)
**Features:**
- Interactive HTML test client
- Loan submission form with file upload
- Document listing interface
- Document download functionality
- Visual feedback for uploads
- File validation

### 5. Configuration

#### File: `.gitignore` (NEW/Updated)
**Additions:**
- Ignore `backend/uploads/` directory
- Ignore `uploads/` directory
- Standard Node.js ignores

## Document Metadata Structure

Each uploaded document is stored with the following metadata on the blockchain:

```json
{
  "documentId": "DOC-{timestamp}-{randomhash}",
  "fileName": "original_filename.pdf",
  "fileType": "application/pdf",
  "fileSize": 2048576,
  "storedFileName": "unique_generated_name.pdf",
  "filePath": "/path/to/file",
  "uploadedAt": "2025-10-29T10:30:00.000Z",
  "hash": "sha256_hash_of_file"
}
```

## Storage Architecture

```
backend/
├── uploads/
│   └── loan-documents/
│       ├── {timestamp}-{hash}-document1.pdf
│       ├── {timestamp}-{hash}-document2.jpg
│       └── ...
└── middleware/
    └── secureFileUpload.js
```

## API Usage Examples

### Create Loan with Documents (cURL)

```bash
curl -X POST http://localhost:4000/api/loans \
  -F 'loanData={"loanId":"LOAN001","creditorId":"C001","borrowerId":"B001","borrowerName":"Test Corp","amount":"50000","interestRate":"5.5","term":"36","purpose":"Testing"}' \
  -F "documents=@agreement.pdf" \
  -F "documents=@collateral.jpg"
```

### Create Loan with Documents (JavaScript)

```javascript
const formData = new FormData();
formData.append('loanData', JSON.stringify(loanData));
files.forEach(file => formData.append('documents', file));

const response = await fetch('http://localhost:4000/api/loans', {
  method: 'POST',
  body: formData
});
```

### List Documents

```bash
curl http://localhost:4000/api/loans/LOAN001/documents?org=creditor
```

### Download Document

```bash
curl -O http://localhost:4000/api/loans/LOAN001/documents/DOC-xxx?org=creditor
```

## Installation Steps

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install multer@1.4.5-lts.1
   ```

2. **Upload Directory:**
   - Created automatically by middleware
   - Location: `backend/uploads/loan-documents/`

3. **Update Chaincode:**
   ```bash
   cd blockchain/network
   ./scripts/deploy-chaincode.sh
   ```

## Security Features

1. **File Type Validation**
   - Whitelist of allowed MIME types
   - Prevents executable file uploads

2. **File Size Limits**
   - 10MB maximum per file
   - 10 files maximum per loan

3. **Filename Sanitization**
   - Removes dangerous characters
   - Prevents path traversal

4. **Hash Verification**
   - SHA256 hash stored on blockchain
   - Enables file integrity verification

5. **Access Control**
   - MSP-based permissions via chaincode
   - Organization-level access control

## Testing

### Manual Testing with HTML Client

1. Open `backend/test-upload.html` in browser
2. Fill in loan details
3. Select documents to upload
4. Submit and verify response
5. Query documents using loan ID
6. Download documents

### Command Line Testing

```bash
# Create test files
echo "Test content" > test.pdf

# Upload loan with documents
curl -X POST http://localhost:4000/api/loans \
  -F 'loanData={"loanId":"TEST001","creditorId":"C001","borrowerId":"B001","borrowerName":"Test","amount":"10000","interestRate":"5","term":"12","purpose":"Test"}' \
  -F "documents=@test.pdf"
```

## Future Enhancements

1. **IPFS Integration** - Decentralized storage
2. **Encryption** - Encrypt files at rest
3. **Document Versioning** - Multiple versions support
4. **OCR Processing** - Text extraction from documents
5. **Batch Download** - Download all documents as ZIP
6. **Document Expiry** - Auto-delete after retention period
7. **Preview Generation** - Generate thumbnails for images/PDFs
8. **Virus Scanning** - Integrate antivirus checking

## File Structure

```
Information Utility/
├── backend/
│   ├── middleware/
│   │   └── secureFileUpload.js          [NEW]
│   ├── routes/
│   │   └── loans.js               [UPDATED]
│   ├── package.json               [UPDATED]
│   ├── test-upload.html           [NEW]
│   └── uploads/                   [NEW - Created automatically]
│       └── loan-documents/
├── blockchain/
│   └── chaincode/
│       └── iu-unified/
│           └── models/
│               └── SimpleLoan.js  [UPDATED]
├── Resources/
│   └── DOCUMENT_UPLOAD_FEATURE.md [NEW]
└── .gitignore                     [NEW/UPDATED]
```

## Workflow

```
┌─────────────┐
│   Creditor  │
└──────┬──────┘
       │
       │ 1. Submit loan with documents
       │    (multipart/form-data)
       ▼
┌─────────────────────┐
│  Backend API        │
│  /api/loans (POST)  │
└──────┬──────────────┘
       │
       │ 2. Validate files
       │ 3. Generate hash
       │ 4. Save to disk
       ▼
┌─────────────────────┐
│  Fabric Gateway     │
└──────┬──────────────┘
       │
       │ 5. Submit transaction
       ▼
┌─────────────────────┐
│  Blockchain         │
│  (Store metadata)   │
└─────────────────────┘
```

## Error Handling

- Invalid file types → Rejected with error message
- Files too large → Rejected with size limit info
- Too many files → Rejected with file count limit
- Upload fails → Files cleaned up automatically
- Blockchain error → Files deleted, transaction rolled back

## Compliance Notes

- Document retention policies can be implemented
- Audit trail maintained on blockchain
- File integrity verifiable via SHA256 hash
- Access control enforced at multiple layers

## Support

For issues or questions:
1. Check troubleshooting section in DOCUMENT_UPLOAD_FEATURE.md
2. Review error messages in backend logs
3. Verify file types and sizes meet requirements
4. Ensure blockchain network is running

## Conclusion

This implementation provides a production-ready document upload feature with:
- ✅ Secure file handling
- ✅ Blockchain integration
- ✅ Comprehensive validation
- ✅ Easy-to-use API
- ✅ Complete documentation
- ✅ Testing tools
