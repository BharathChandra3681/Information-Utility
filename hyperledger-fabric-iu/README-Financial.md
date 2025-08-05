# Financial Information Utility - Hyperledger Fabric Network

A comprehensive blockchain-based Financial Information Utility system built on Hyperledger Fabric, designed for managing financial records, loans, and credit information across multiple organizations.

## Network Architecture

### Organizations
- **CreditorMSP** - Banks and Financial Institutions (creditor.iu-network.com:7051)
- **DebtorMSP** - Borrowers and Debtors (debtor.iu-network.com:8051) 
- **AdminMSP** - Regulatory and Administrative body (admin.iu-network.com:9051)

### Channels
- **financial-operations-channel** - Primary channel for financial transactions and operations
- **audit-compliance-channel** - Compliance and audit monitoring channel

### Chaincode
- **iu-basic** - Financial Information Utility smart contract with comprehensive financial record management

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 16+ 
- Hyperledger Fabric binaries (2.5.12)
- cryptogen and configtxgen tools

### 1. Start the Network
```bash
# Start the complete network
./start-network.sh up

# Stop the network
./start-network.sh down

# Restart the network
./start-network.sh restart
```

### 2. API Access
Once the network is running, the API will be available at:
- **Health Check**: http://localhost:3000/api/health
- **API Documentation**: http://localhost:3000/api/docs
- **Base URL**: http://localhost:3000/api

## API Endpoints

### Financial Records Management

#### Create Financial Record
```bash
POST /api/financial-records
Content-Type: application/json

{
  "recordId": "LOAN003",
  "recordType": "HomeLoan", 
  "creditorId": "CREDITOR001",
  "debtorId": "DEBTOR001",
  "financialInstitution": {
    "institutionId": "FI12345",
    "name": "ABC Bank Ltd",
    "registrationNumber": "REG98765",
    "type": "Bank",
    "contact": {
      "address": "123 Finance Street, Mumbai, India",
      "phone": "+91-9876543210",
      "email": "contact@abcbank.com"
    }
  },
  "borrower": {
    "borrowerId": "BORR1001", 
    "name": "John Doe",
    "dateOfBirth": "1985-08-20",
    "PAN": "ABCDE1234F",
    "aadhaar": "123456789012",
    "contact": {
      "address": "456 Residential Lane, Delhi, India",
      "phone": "+91-9123456789",
      "email": "john.doe@example.com"
    },
    "creditProfile": {
      "creditScore": 750,
      "creditRating": "A"
    }
  },
  "loanDetails": {
    "loanAmount": 5000000,
    "interestRate": 7.5,
    "sanctionDate": "2023-05-01",
    "tenureMonths": 240,
    "loanType": "Home Loan",
    "collateral": {
      "type": "Real Estate",
      "value": 8000000,
      "description": "Residential apartment in Mumbai"
    }
  }
}
```

#### Query Records
```bash
# Get all records (Admin only)
GET /api/financial-records

# Get specific record
GET /api/financial-records/LOAN001?orgType=creditor

# Get records by creditor
GET /api/financial-records/creditor/CREDITOR001?orgType=creditor

# Get records by debtor  
GET /api/financial-records/debtor/DEBTOR001?orgType=debtor

# Get record history
GET /api/financial-records/LOAN001/history?orgType=admin
```

#### Update Record
```bash
PUT /api/financial-records/LOAN001
Content-Type: application/json

{
  "updateData": {
    "status": "Closed",
    "financialData": {
      "outstandingAmount": 0,
      "installmentsPaid": 240
    }  
  },
  "orgType": "creditor"
}
```

#### Record Payment
```bash
POST /api/financial-records/LOAN001/payment
Content-Type: application/json

{
  "paymentData": {
    "amount": 38742.13,
    "paymentDate": "2024-06-01",
    "paymentMethod": "Online Transfer",
    "transactionId": "TXN123456789"
  }
}
```

#### Verify Record
```bash
POST /api/financial-records/LOAN001/verify
Content-Type: application/json

{
  "verifierOrg": "AdminMSP",
  "orgType": "admin"
}
```

#### Access Management
```bash
# Grant access
POST /api/financial-records/LOAN001/grant-access
Content-Type: application/json
{
  "organization": "NewOrgMSP"
}

# Revoke access
POST /api/financial-records/LOAN001/revoke-access
Content-Type: application/json
{
  "organization": "OldOrgMSP"
}
```

## Data Schema

### Financial Record Structure
```javascript
{
  docType: 'FinancialRecord',
  recordId: 'LOAN001',
  recordType: 'LoanRecord',
  creditorId: 'CREDITOR001', 
  debtorId: 'DEBTOR001',
  financialInstitution: {
    institutionId: 'FI12345',
    name: 'ABC Bank Ltd',
    registrationNumber: 'REG98765',
    type: 'Bank',
    contact: { address, phone, email }
  },
  borrower: {
    borrowerId: 'BORR1001',
    name: 'John Doe',
    dateOfBirth: '1985-08-20',
    PAN: 'ABCDE1234F',
    aadhaar: '123456789012',
    contact: { address, phone, email },
    creditProfile: { creditScore: 750, creditRating: 'A' }
  },
  loanDetails: {
    loanAmount: 5000000,
    interestRate: 7.5,
    sanctionDate: '2023-05-01',
    tenureMonths: 240,
    loanType: 'Home Loan',
    collateral: { type, value, description }
  },
  financialData: {
    outstandingAmount: 4800000,
    installmentsPaid: 12,
    nextDueDate: '2024-06-01',
    monthlyEMI: 38742.13
  },
  status: 'Active',
  verificationStatus: 'Verified',
  accessPermissions: {
    'CreditorMSP': true,
    'DebtorMSP': true,
    'AdminMSP': true
  },
  metadata: {
    createdAt: '2023-05-01T10:30:00.000Z',
    lastModified: '2024-05-01T10:30:00.000Z',
    version: '1.2',
    createdBy: 'CreditorMSP'
  },
  history: [...]
}
```

## Chaincode Functions

### Core Functions
- `InitLedger()` - Initialize with sample financial data
- `CreateFinancialRecord()` - Create new financial record
- `ReadFinancialRecord()` - Read specific record
- `UpdateFinancialRecord()` - Update record information
- `GetAllFinancialRecords()` - Get all records (Admin only)

### Query Functions  
- `QueryFinancialRecordsByCreditor()` - Query by creditor ID
- `QueryFinancialRecordsByDebtor()` - Query by debtor ID
- `FinancialRecordExists()` - Check record existence
- `GetFinancialRecordHistory()` - Get record history

### Financial Operations
- `RecordPayment()` - Record loan payments
- `VerifyFinancialRecord()` - Verify record authenticity

### Access Control
- `GrantAccess()` - Grant organization access
- `RevokeAccess()` - Revoke organization access

### Utility Functions
- `calculateEMI()` - Calculate monthly EMI
- `createAuditEntry()` - Create audit trail entries

## Network Configuration

### Channel Configuration
- **Financial Operations Channel**: All three organizations
- **Audit Compliance Channel**: Admin and Creditor organizations only

### Endorsement Policies
- **Financial Records**: Requires endorsement from majority of organizations
- **Administrative Actions**: Requires Admin organization endorsement

### Access Control
- **CreditorMSP**: Create, read, update financial records; record payments
- **DebtorMSP**: Read own financial records; view payment history  
- **AdminMSP**: Full access; verification; access management; audit functions

## Development

### Project Structure
```
hyperledger-fabric-iu/
├── application/           # Node.js API application
│   ├── app-financial.js  # Updated financial API
│   ├── app.js            # Original API (legacy)
│   ├── msp-management/   # MSP management utilities
│   └── package.json      # Dependencies
├── chaincode/
│   └── iu-basic/         # Financial chaincode
│       ├── index.js      # Smart contract implementation
│       └── package.json  # Chaincode dependencies
├── network/
│   ├── configtx.yaml     # Channel configuration
│   ├── crypto-config.yaml # Crypto material configuration
│   └── docker-compose.yaml # Container orchestration
├── scripts/
│   ├── createChannel.sh  # Channel creation script
│   └── deployChaincode.sh # Chaincode deployment script
└── start-network.sh      # Network startup script
```

### Adding New Organizations
1. Update `crypto-config.yaml` with new organization details
2. Modify `configtx.yaml` to include new MSP definition
3. Update channel profiles to include new organization
4. Regenerate crypto material and restart network

### Custom Chaincode Development
1. Modify `chaincode/iu-basic/index.js`
2. Update chaincode version in deployment scripts
3. Redeploy using `./scripts/deployChaincode.sh`

## Troubleshooting

### Common Issues

**Network won't start:**
```bash
# Clean and restart
./start-network.sh down
docker system prune -f
./start-network.sh up
```

**Chaincode deployment fails:**
```bash
# Check container logs
docker logs cli
docker logs peer0.creditor.iu-network.com
```

**API connection issues:**
```bash
# Check API server logs
cd application
npm run logs
```

### Logs and Debugging
```bash
# View all container logs
docker-compose -f network/docker-compose.yaml logs

# View specific container logs  
docker logs peer0.creditor.iu-network.com
docker logs orderer.iu-network.com
docker logs cli

# Check network status
docker ps
./start-network.sh status
```

## Security Considerations

### Access Control
- MSP-based identity management
- Channel-level access restrictions
- Function-level permission checks
- Audit trail for all operations

### Data Privacy
- Private data collections for sensitive information
- Channel-based data segregation
- Organization-specific data access

### Compliance
- Comprehensive audit logging
- Regulatory reporting capabilities
- Data retention policies
- Compliance monitoring channel

## Performance Tuning

### Network Optimization
- Adjust block size and timeout values
- Configure peer gossip settings
- Optimize chaincode execution timeout
- Use appropriate endorsement policies

### Database Configuration
- Configure CouchDB for rich queries
- Set up proper indexing for query performance
- Monitor chaincode execution times

## Support

For issues, questions, or contributions:
1. Check the troubleshooting section above
2. Review Hyperledger Fabric documentation
3. Check container logs for specific error messages
4. Ensure all prerequisites are properly installed

## License

This project is part of the Financial Information Utility system and follows standard blockchain development practices for financial services.
