# Loan Document Upload Feature

## Overview

This feature enables creditors to upload supporting documents when creating a new loan record in the Information Utility blockchain network. Documents are stored on the backend server with metadata recorded on the blockchain for integrity verification.

## Architecture

### Components

1. **SimpleLoan Model** (`blockchain/chaincode/iu-unified/models/SimpleLoan.js`)
   - Extended to include `documents` array field
   - Stores document metadata on blockchain

2. **File Upload Middleware** (`backend/middleware/secureFileUpload.js`)
   - Handles multipart/form-data file uploads
   - Validates file types and sizes
   - Generates unique filenames and SHA256 hashes

3. **Loan API Routes** (`backend/routes/loans.js`)
   - POST `/api/loans` - Create loan with documents
   - GET `/api/loans/:loanId/documents` - List all documents
   - GET `/api/loans/:loanId/documents/:documentId` - Download specific document

### Document Storage

- **Location**: `/backend/uploads/loan-documents/`
- **Naming**: `{timestamp}-{randomhash}-{sanitizedfilename}`
- **Max Size**: 10MB per file
- **Max Files**: 10 files per loan
- **Allowed Types**: 
  - PDF (`.pdf`)
  - Images (`.jpg`, `.jpeg`, `.png`)
  - Word (`.doc`, `.docx`)
  - Excel (`.xls`, `.xlsx`)

### Document Metadata Structure

```json
{
  "documentId": "DOC-1730217600000-a1b2c3d4",
  "fileName": "loan_agreement.pdf",
  "fileType": "application/pdf",
  "fileSize": 2048576,
  "storedFileName": "1730217600000-a1b2c3-loan_agreement.pdf",
  "filePath": "/path/to/uploads/loan-documents/1730217600000-a1b2c3-loan_agreement.pdf",
  "uploadedAt": "2025-10-29T10:30:00.000Z",
  "hash": "sha256hash..."
}
```

## API Usage

### 1. Create Loan with Documents

**Endpoint**: `POST /api/loans`

**Content-Type**: `multipart/form-data`

**Form Fields**:
- `loanData` (string - JSON): Loan information
- `documents` (file array): Supporting documents (max 10 files)

**Example using cURL**:

```bash
curl -X POST http://localhost:4000/api/loans \
  -H "Content-Type: multipart/form-data" \
  -F 'loanData={
    "loanId": "LOAN2025001",
    "creditorId": "CRED001",
    "borrowerId": "BORR001",
    "borrowerName": "ABC Corporation",
    "amount": "1000000",
    "interestRate": "7.5",
    "term": "60",
    "purpose": "Business expansion"
  }' \
  -F "documents=@/path/to/loan_agreement.pdf" \
  -F "documents=@/path/to/income_statement.pdf" \
  -F "documents=@/path/to/collateral_deed.pdf"
```

**Response**:

```json
{
  "success": true,
  "message": "Loan created successfully",
  "data": {
    "loanId": "LOAN2025001",
    "borrowerName": "ABC Corporation",
    "loanAmount": "1000000",
    "status": "awaiting-admin",
    "documents": [
      {
        "documentId": "DOC-1730217600000-a1b2c3d4",
        "fileName": "loan_agreement.pdf",
        "fileType": "application/pdf",
        "fileSize": 2048576,
        "uploadedAt": "2025-10-29T10:30:00.000Z",
        "hash": "abc123..."
      }
    ]
  },
  "documentsUploaded": 3
}
```

### 2. List Loan Documents

**Endpoint**: `GET /api/loans/:loanId/documents`

**Query Parameters**:
- `org` (optional): Organization context (creditor, debtor, government)

**Example**:

```bash
curl http://localhost:4000/api/loans/LOAN2025001/documents?org=creditor
```

**Response**:

```json
{
  "success": true,
  "loanId": "LOAN2025001",
  "count": 3,
  "documents": [
    {
      "documentId": "DOC-1730217600000-a1b2c3d4",
      "fileName": "loan_agreement.pdf",
      "fileType": "application/pdf",
      "fileSize": 2048576,
      "uploadedAt": "2025-10-29T10:30:00.000Z",
      "hash": "abc123..."
    }
  ]
}
```

### 3. Download Document

**Endpoint**: `GET /api/loans/:loanId/documents/:documentId`

**Query Parameters**:
- `org` (optional): Organization context

**Example**:

```bash
curl -O http://localhost:4000/api/loans/LOAN2025001/documents/DOC-1730217600000-a1b2c3d4?org=creditor
```

## JavaScript/React Example

```javascript
// Create loan with documents
async function createLoanWithDocuments(loanData, files) {
  const formData = new FormData();
  
  // Add loan data as JSON string
  formData.append('loanData', JSON.stringify(loanData));
  
  // Add files
  files.forEach(file => {
    formData.append('documents', file);
  });
  
  try {
    const response = await fetch('http://localhost:4000/api/loans', {
      method: 'POST',
      body: formData
      // Note: Don't set Content-Type header, browser will set it with boundary
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Loan created:', result.data);
      console.log('Documents uploaded:', result.documentsUploaded);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// List documents
async function listDocuments(loanId) {
  try {
    const response = await fetch(
      `http://localhost:4000/api/loans/${loanId}/documents?org=creditor`
    );
    const result = await response.json();
    
    if (result.success) {
      console.log('Documents:', result.documents);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Download document
function downloadDocument(loanId, documentId, fileName) {
  const url = `http://localhost:4000/api/loans/${loanId}/documents/${documentId}?org=creditor`;
  
  // Create download link
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
}
```

## React Component Example

```jsx
import React, { useState } from 'react';

function LoanSubmissionForm() {
  const [loanData, setLoanData] = useState({
    loanId: '',
    creditorId: '',
    borrowerId: '',
    borrowerName: '',
    amount: '',
    interestRate: '',
    term: '',
    purpose: ''
  });
  
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file count
    if (selectedFiles.length > 10) {
      alert('Maximum 10 files allowed');
      return;
    }
    
    // Validate file sizes
    const invalidFiles = selectedFiles.filter(f => f.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      alert('Some files exceed 10MB limit');
      return;
    }
    
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('loanData', JSON.stringify(loanData));
      
      files.forEach(file => {
        formData.append('documents', file);
      });

      const response = await fetch('http://localhost:4000/api/loans', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        alert(`Loan created successfully! ${result.documentsUploaded} documents uploaded.`);
        // Reset form
        setLoanData({});
        setFiles([]);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Failed to create loan: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Submit New Loan</h2>
      
      <input
        type="text"
        placeholder="Loan ID"
        value={loanData.loanId}
        onChange={(e) => setLoanData({...loanData, loanId: e.target.value})}
        required
      />
      
      <input
        type="text"
        placeholder="Borrower Name"
        value={loanData.borrowerName}
        onChange={(e) => setLoanData({...loanData, borrowerName: e.target.value})}
        required
      />
      
      <input
        type="number"
        placeholder="Loan Amount"
        value={loanData.amount}
        onChange={(e) => setLoanData({...loanData, amount: e.target.value})}
        required
      />
      
      <div>
        <label>Supporting Documents (Max 10 files, 10MB each)</label>
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          onChange={handleFileChange}
        />
        {files.length > 0 && (
          <div>
            <p>Selected files:</p>
            <ul>
              {files.map((file, idx) => (
                <li key={idx}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Submit Loan'}
      </button>
    </form>
  );
}

export default LoanSubmissionForm;
```

## Security Considerations

1. **File Type Validation**: Only specific document types are allowed
2. **File Size Limits**: 10MB per file, 10 files maximum
3. **File Integrity**: SHA256 hash stored on blockchain for verification
4. **Access Control**: MSP-based access control enforced by chaincode
5. **Sanitization**: Filenames are sanitized to prevent path traversal
6. **Unique Naming**: Random hash prevents filename collisions

## Installation

1. Install the multer dependency:

```bash
cd backend
npm install multer@1.4.5-lts.1
```

2. Ensure the uploads directory will be created automatically (handled by middleware)

3. Update the chaincode on the blockchain network:

```bash
cd blockchain/network
./scripts/deploy-chaincode.sh
```

## Testing

### Test File Upload

```bash
# Create test files
echo "Test PDF content" > test.pdf
echo "Test image" > test.jpg

# Submit loan with documents
curl -X POST http://localhost:4000/api/loans \
  -F 'loanData={"loanId":"TEST001","creditorId":"C001","borrowerId":"B001","borrowerName":"Test Corp","amount":"50000","interestRate":"5.5","term":"36","purpose":"Testing"}' \
  -F "documents=@test.pdf" \
  -F "documents=@test.jpg"
```

### Verify Upload

```bash
# List documents
curl http://localhost:4000/api/loans/TEST001/documents

# Download document
curl -O http://localhost:4000/api/loans/TEST001/documents/DOC-xxx
```

## Troubleshooting

### Issue: "Invalid file type" error
- **Solution**: Ensure files are in allowed formats (PDF, images, Word, Excel)

### Issue: "File too large" error
- **Solution**: Reduce file size to under 10MB

### Issue: "Maximum files exceeded"
- **Solution**: Upload maximum 10 files per loan

### Issue: Document not found when downloading
- **Solution**: Check that the file exists in `backend/uploads/loan-documents/`

## Future Enhancements

1. **IPFS Integration**: Store documents on IPFS for decentralized storage
2. **Encryption**: Encrypt documents at rest
3. **Document Versioning**: Support multiple versions of documents
4. **Batch Download**: Download all loan documents as ZIP
5. **OCR Processing**: Extract text from images/PDFs for searchability
6. **Document Expiry**: Auto-delete documents after retention period
