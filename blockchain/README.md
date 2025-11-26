# IU Unified Blockchain Network

A comprehensive Hyperledger Fabric 2.2 network implementing a unified architecture for the Indian Information Utility (IU) system with dual-channel governance and financial operations.

## Architecture Overview

### Network Structure
- **Platform**: Hyperledger Fabric 2.2
- **Organizations**: 3 (Government, Creditor, Debtor)
- **Channels**: 2 (Governance Channel, Financial Operations Channel)
- **Chaincode**: Unified channel-aware implementation
- **Database**: CouchDB for rich queries and governance reporting

### Organizations

1. **GovernmentMSP** (`government.iu.com`)
   - **Role**: Admin + Regulator (dual role)
   - **Financial Operations**: Approves/rejects loans (admin function)
   - **Governance**: Monitors all transactions (read-only)
   - **Peer**: `peer0.government.iu.com:7051`
   - **CouchDB**: Port 5984

2. **CreditorMSP** (`creditor.iu.com`)
   - **Role**: Lender/Financial Institution
   - **Operations**: Creates loan applications, queries loans
   - **Peer**: `peer0.creditor.iu.com:8051`
   - **CouchDB**: Port 6984

3. **DebtorMSP** (`debtor.iu.com`)
   - **Role**: Borrower
   - **Operations**: Accepts/rejects approved loans, queries own loans
   - **Peer**: `peer0.debtor.iu.com:9051`
   - **CouchDB**: Port 7984

### Channels

#### 1. Governance Channel (`governance-channel`)
- **Purpose**: Regulatory monitoring and audit trail
- **Members**: GovernmentMSP only
- **Chaincode**: GovernanceContract
- **Functions**:
  - Query all transactions
  - Generate audit reports
  - Get compliance metrics
  - Track transaction history

#### 2. Financial Operations Channel (`financial-operations-channel`)
- **Purpose**: Loan processing and financial transactions
- **Members**: GovernmentMSP, CreditorMSP, DebtorMSP
- **Chaincode**: LoanContract
- **Functions**:
  - Create loans (Creditor only)
  - Approve/reject by admin (Government only)
  - Accept/reject by borrower (Debtor only)
  - Query loans (all orgs with MSP-based filtering)

### Chaincode Architecture

**Unified Chaincode: `iu-unified`**
- **Version**: 1.0
- **Language**: Node.js
- **Contracts**: LoanContract, GovernanceContract
- **Features**:
  - Channel-aware logic (validates channelID)
  - MSP-based access control
  - Automatic audit trail creation
  - Rich query support (CouchDB)

## Project Structure

```
blockchain/
├── network/                      # Network configuration and management
│   ├── config/
│   │   ├── crypto-config.yaml   # Certificate generation config
│   │   └── configtx.yaml        # Channel and organization definitions
│   ├── docker/
│   │   └── docker-compose.yaml  # Container orchestration
│   └── scripts/
│       ├── 1-generate-crypto.sh       # Generate certificates
│       ├── 2-generate-genesis.sh      # Create genesis block
│       ├── 3-start-network.sh         # Start Docker containers
│       ├── 4-create-channels.sh       # Create both channels
│       ├── 5-join-peers.sh            # Join peers to channels
│       ├── 6-deploy-chaincode.sh      # Deploy unified chaincode
│       ├── 7-test-network.sh          # Comprehensive tests
│       ├── stop-network.sh            # Graceful shutdown
│       └── cleanup.sh                 # Complete cleanup
│
└── chaincode/                   # Unified chaincode implementation
    └── iu-unified/
        ├── package.json         # Dependencies
        ├── index.js             # Entry point
        ├── models/
        │   ├── SimpleLoan.js    # Loan data model
        │   └── AuditRecord.js   # Audit trail model
        └── lib/
            ├── loan-contract.js       # Financial operations
            └── governance-contract.js # Monitoring functions
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 14+
- Hyperledger Fabric binaries 2.2

### Automated Deployment (Recommended)

**One-command deployment with automatic error handling:**

```bash
cd blockchain/network

# Full deployment with tests
./deploy-network.sh

# Clean deployment (removes existing network first)
./deploy-network.sh --clean

# Deploy without running tests
./deploy-network.sh --skip-tests

# Quick start (interactive)
./quick-start.sh
```

### Step-by-Step Manual Deployment

```bash
cd blockchain/network/scripts

# 1. Generate cryptographic materials
./1-generate-crypto.sh

# 2. Generate genesis block and channel configurations
./2-generate-genesis.sh

# 3. Start the network
./3-start-network.sh

# 4. Create both channels
./4-create-channels.sh

# 5. Join peers to their respective channels
./5-join-peers.sh

# 6. Deploy unified chaincode to both channels
./6-deploy-chaincode.sh

# 7. Run comprehensive tests
./7-test-network.sh
```

### Network Management

**Stop Network:**
```bash
./stop-network.sh
```

**Complete Cleanup:**
```bash
./cleanup.sh
```

**Restart Network:**
```bash
./stop-network.sh
./cleanup.sh
./1-generate-crypto.sh
./2-generate-genesis.sh
./3-start-network.sh
./4-create-channels.sh
./5-join-peers.sh
./6-deploy-chaincode.sh
```

## Chaincode Functions

### LoanContract (Financial Operations Channel)

#### createLoan
- **Access**: CreditorMSP only
- **Purpose**: Create a new loan application
- **Parameters**: `loanData` (JSON object)
```json
{
  "loanId": "LOAN_001",
  "creditorId": "CREDITOR_001",
  "borrowerId": "BORROWER_001",
  "amount": "50000",
  "interestRate": "5.5",
  "term": "36",
  "purpose": "Business Expansion"
}
```

#### approveLoanByAdmin
- **Access**: GovernmentMSP only
- **Purpose**: Approve loan application
- **Parameters**: `loanId`, `notes`

#### rejectLoanByAdmin
- **Access**: GovernmentMSP only
- **Purpose**: Reject loan application
- **Parameters**: `loanId`, `reason`

#### approveLoanByBorrower
- **Access**: DebtorMSP only
- **Purpose**: Accept approved loan
- **Parameters**: `loanId`

#### rejectLoanByBorrower
- **Access**: DebtorMSP only
- **Purpose**: Decline approved loan
- **Parameters**: `loanId`, `reason`

#### queryLoans
- **Access**: All organizations (filtered by MSP)
- **Purpose**: Query loans accessible to caller
- **Returns**: Array of loans

#### getLoan
- **Access**: All organizations
- **Purpose**: Get specific loan by ID
- **Parameters**: `loanId`

### GovernanceContract (Governance Channel)

#### queryAllTransactions
- **Access**: GovernmentMSP only
- **Purpose**: Retrieve all audit records in date range
- **Parameters**: `startDate`, `endDate` (ISO format)

#### generateAuditReport
- **Access**: GovernmentMSP only
- **Purpose**: Create compliance report for specific period
- **Parameters**: `month`, `year`

#### getComplianceMetrics
- **Access**: GovernmentMSP only
- **Purpose**: Real-time dashboard metrics (last 30 days)

#### getTransactionHistory
- **Access**: GovernmentMSP only
- **Purpose**: Get all transactions for specific loan
- **Parameters**: `loanId`

#### queryLoansByStatus
- **Access**: GovernmentMSP only
- **Purpose**: Query loans by status
- **Parameters**: `status` (awaiting-admin, approved, rejected, etc.)

#### queryLoansByDateRange
- **Access**: GovernmentMSP only
- **Purpose**: Query loans created within date range
- **Parameters**: `startDate`, `endDate`

## Testing

The `7-test-network.sh` script performs comprehensive validation:

1. **Network Components Status** - Verifies all containers running
2. **Channel Membership - Governance** - Confirms Government on governance-channel
3. **Channel Membership - Financial** - Confirms all orgs on financial-operations-channel
4. **Chaincode Deployment - Governance** - Validates chaincode on governance-channel
5. **Chaincode Deployment - Financial** - Validates chaincode on financial-operations-channel
6. **Loan Creation** - Tests Creditor creating loan
7. **Admin Approval** - Tests Government approving loan
8. **Loan Query** - Tests querying loan data
9. **Governance Monitoring** - Tests Government querying audit records
10. **Access Control** - Validates MSP-based permissions

## Network Ports

| Service | Port | Purpose |
|---------|------|---------|
| Orderer | 7050 | Consensus ordering |
| Government Peer | 7051 | Peer operations |
| Government CouchDB | 5984 | State database |
| Creditor Peer | 8051 | Peer operations |
| Creditor CouchDB | 6984 | State database |
| Debtor Peer | 9051 | Peer operations |
| Debtor CouchDB | 7984 | State database |

## Security Features

### TLS Encryption
- All peer-to-peer communication encrypted
- Certificate-based authentication
- Mutual TLS enabled

### Access Control
- **MSP-based validation**: Each function validates caller's MSP ID
- **Channel isolation**: Chaincode verifies correct channel
- **Function-level permissions**: Role-based access control

### Audit Trail
- **Automatic logging**: All state changes create audit records
- **Immutable history**: Blockchain guarantees tamper-proof records
- **Composite keys**: Efficient querying by loan, action, or org
- **Governance visibility**: Complete transparency for regulators

## Data Models

### SimpleLoan
```javascript
{
  docType: "SimpleLoan",
  loanId: string,
  creditorId: string,
  borrowerId: string,
  amount: string,
  interestRate: string,
  term: string,
  purpose: string,
  status: string, // awaiting-admin, approved, rejected, awaiting-borrower, confirmed, declined
  submittedAt: ISO date,
  reviewedAt: ISO date,
  reviewedBy: string,
  adminNotes: string,
  borrowerConfirmedAt: ISO date,
  borrowerNotes: string
}
```

### AuditRecord
```javascript
{
  docType: "AuditRecord",
  auditId: string,
  loanId: string,
  action: string, // LOAN_CREATED, ADMIN_APPROVED, ADMIN_REJECTED, etc.
  performedBy: string, // User ID
  msp: string, // Organization MSP ID
  timestamp: ISO date,
  loanSnapshot: SimpleLoan // State at time of action
}
```

## Troubleshooting

### Network Won't Start
```bash
# Check Docker
docker ps -a

# View logs
docker logs peer0.government.iu.com
docker logs orderer.iu.com

# Complete reset
./cleanup.sh
rm -rf crypto-config channel-artifacts system-genesis-block
./1-generate-crypto.sh
```

### Chaincode Deployment Failed
```bash
# Check chaincode logs
docker logs peer0.government.iu.com

# Verify package
docker exec cli peer lifecycle chaincode queryinstalled

# Reinstall
./6-deploy-chaincode.sh
```

### Test Failures
```bash
# Check individual components
docker exec cli peer channel list
docker exec cli peer lifecycle chaincode querycommitted --channelID governance-channel
docker exec cli peer lifecycle chaincode querycommitted --channelID financial-operations-channel

# View container logs
docker logs -f peer0.government.iu.com
```

## Monitoring

### CouchDB Admin Interfaces
- Government: http://localhost:5984/_utils
- Creditor: http://localhost:6984/_utils
- Debtor: http://localhost:7984/_utils

### Query Peer Logs
```bash
docker logs -f peer0.government.iu.com
docker logs -f peer0.creditor.iu.com
docker logs -f peer0.debtor.iu.com
```

### Check Network Status
```bash
docker exec cli peer channel list
docker exec cli peer chaincode list --installed
docker exec cli peer chaincode list --instantiated -C financial-operations-channel
```

## Development Workflow

### Updating Chaincode
1. Modify code in `blockchain/chaincode/iu-unified/`
2. Increment version in `6-deploy-chaincode.sh`
3. Update sequence number
4. Run deployment script

### Adding Organizations
1. Update `crypto-config.yaml`
2. Update `configtx.yaml`
3. Update `docker-compose.yaml`
4. Regenerate crypto materials
5. Update chaincode access control

### Adding Functions
1. Add function to appropriate contract
2. Update access control logic
3. Add tests to `7-test-network.sh`
4. Redeploy chaincode

## Best Practices

### Operations
- Always run tests after deployment
- Monitor CouchDB for state consistency
- Keep backups of crypto materials
- Document all configuration changes

### Security
- Rotate certificates regularly
- Use environment-specific credentials
- Enable audit logging
- Review access control regularly

### Performance
- Use rich queries judiciously (CouchDB overhead)
- Index frequently queried fields
- Monitor chaincode execution times
- Optimize endorsement policies

## Next Steps

1. **Backend API**: Create unified Node.js service with Fabric Gateway
2. **Frontend**: Develop governance dashboard in Next.js
3. **Connection Profiles**: Generate org-specific connection.json files
4. **Cleanup**: Remove old duplicate network files
5. **CI/CD**: Set up automated testing and deployment

## License

This project is part of the Indian Information Utility system.

## Support

For issues or questions:
1. Check troubleshooting section
2. Review container logs
3. Run diagnostic scripts
4. Consult Hyperledger Fabric documentation

---

**Status**: ✅ Network infrastructure complete and tested
**Version**: 1.0
**Last Updated**: 2024
