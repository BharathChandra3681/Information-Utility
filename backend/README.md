# IU Unified Backend API

REST API service for the IU Blockchain Network, providing access to financial operations and governance monitoring.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ and npm 6+
- Running IU Blockchain Network (see `../blockchain/README.md`)

### Installation

```bash
# Install dependencies
npm install

# Start the server
npm start

# Development mode with auto-reload
npm run dev
```

The server will start at `http://localhost:4000`

## 📋 API Endpoints

### Health Check

#### `GET /health`
Basic health check
```bash
curl http://localhost:4000/health
```

#### `GET /health/blockchain`
Check blockchain connectivity status
```bash
curl http://localhost:4000/health/blockchain
```

---

### Loan Operations (Financial Channel)

#### `POST /api/loans`
Create a new loan application (Creditor only)

**Request:**
```bash
curl -X POST http://localhost:4000/api/loans \
  -H "Content-Type: application/json" \
  -d '{
    "loanData": {
      "loanId": "LOAN_001",
      "creditorId": "CREDITOR_001",
      "borrowerId": "BORROWER_001",
      "amount": "50000",
      "interestRate": "5.5",
      "term": "36",
      "purpose": "Business Expansion"
    }
  }'
```

#### `GET /api/loans?org=creditor`
Query loans (filtered by organization)

**Query Parameters:**
- `org` (optional): Organization name (`government`, `creditor`, `debtor`) - default: `creditor`

```bash
curl http://localhost:4000/api/loans?org=government
```

#### `GET /api/loans/:loanId?org=creditor`
Get specific loan by ID

```bash
curl http://localhost:4000/api/loans/LOAN_001?org=government
```

#### `POST /api/loans/:loanId/approve`
Approve loan by admin (Government only)

```bash
curl -X POST http://localhost:4000/api/loans/LOAN_001/approve \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Approved after review" }'
```

#### `POST /api/loans/:loanId/reject`
Reject loan by admin (Government only)

```bash
curl -X POST http://localhost:4000/api/loans/LOAN_001/reject \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Insufficient documentation" }'
```

#### `POST /api/loans/:loanId/accept`
Accept loan by borrower (Debtor only)

```bash
curl -X POST http://localhost:4000/api/loans/LOAN_001/accept
```

#### `POST /api/loans/:loanId/decline`
Decline loan by borrower (Debtor only)

```bash
curl -X POST http://localhost:4000/api/loans/LOAN_001/decline \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Terms not acceptable" }'
```

---

### Governance Operations (Governance Channel)

#### `GET /api/governance/transactions`
Query all transactions within date range (Government only)

**Query Parameters:**
- `startDate` (optional): ISO date string - default: 30 days ago
- `endDate` (optional): ISO date string - default: now

```bash
curl "http://localhost:4000/api/governance/transactions?startDate=2024-10-01T00:00:00Z&endDate=2024-10-14T23:59:59Z"
```

#### `GET /api/governance/audit-report`
Generate audit report for specific month (Government only)

**Query Parameters:**
- `month` (optional): 1-12 - default: current month
- `year` (optional): YYYY - default: current year

```bash
curl "http://localhost:4000/api/governance/audit-report?month=10&year=2024"
```

#### `GET /api/governance/compliance-metrics`
Get real-time compliance metrics for last 30 days (Government only)

```bash
curl http://localhost:4000/api/governance/compliance-metrics
```

#### `GET /api/governance/loans/:loanId/history`
Get transaction history for specific loan (Government only)

```bash
curl http://localhost:4000/api/governance/loans/LOAN_001/history
```

#### `GET /api/governance/loans/by-status/:status`
Query loans by status (Government only)

**Valid statuses:**
- `awaiting-admin`
- `approved`
- `rejected`
- `awaiting-borrower`
- `confirmed`
- `declined`
- `unconfirmed`

```bash
curl http://localhost:4000/api/governance/loans/by-status/approved
```

#### `GET /api/governance/loans/by-date-range`
Query loans created within date range (Government only)

**Query Parameters:**
- `startDate` (required): ISO date string
- `endDate` (required): ISO date string

```bash
curl "http://localhost:4000/api/governance/loans/by-date-range?startDate=2024-10-01T00:00:00Z&endDate=2024-10-14T23:59:59Z"
```

---

## 🔧 Configuration

### Environment Variables

See `.env` file for configuration options:

```bash
# Server
PORT=4000                    # API server port
HOST=localhost               # API server host

# Blockchain
CHANNEL_GOVERNANCE=governance-channel
CHANNEL_FINANCIAL=financial-operations-channel
CHAINCODE_NAME=iu-unified

# Organizations
GOVERNMENT_MSP=GovernmentMSP
CREDITOR_MSP=CreditorMSP
DEBTOR_MSP=DebtorMSP

# Paths
CRYPTO_PATH=../blockchain/network/crypto-config

# Logging
LOG_LEVEL=info
```

## 🏗️ Architecture

### Organization Mapping

The backend connects to the blockchain network as different organizations:

1. **Government** - Admin role for loan approval/rejection + governance monitoring
2. **Creditor** - Creates loan applications
3. **Debtor** - Accepts/declines approved loans

### Channel Routing

- **Financial Operations** → `financial-operations-channel`
  - Loan CRUD operations
  - Admin approval/rejection
  - Borrower acceptance/decline

- **Governance Monitoring** → `governance-channel`
  - Transaction queries
  - Audit reports
  - Compliance metrics

### Fabric Gateway SDK

The backend uses `@hyperledger/fabric-gateway` for blockchain connectivity:
- Maintains persistent connections for each organization
- Automatic identity management
- Transaction submission and evaluation
- Error handling and retry logic

## 📁 Project Structure

```
backend/
├── server.js                 # Express server entry point
├── package.json              # Dependencies
├── .env                      # Environment configuration
├── fabric/
│   └── gateway.js            # Fabric Gateway connection manager
├── routes/
│   ├── health.js             # Health check endpoints
│   ├── loans.js              # Financial operations API
│   └── governance.js         # Governance monitoring API
├── middleware/
│   └── errorHandler.js       # Centralized error handling
├── utils/
│   └── logger.js             # Winston logging
└── logs/                     # Log files
```

## 🔐 Security

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevents API abuse
- **TLS**: Encrypted communication with blockchain
- **MSP-based Access Control**: Organization identity validation

## 📊 Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console (development mode)

Log levels: `error`, `warn`, `info`, `debug`

## 🧪 Testing

```bash
# Run tests (when available)
npm test
```

## 🐛 Troubleshooting

### Connection Errors

**Error:** `Failed to connect to Fabric network`

**Solution:**
1. Ensure blockchain network is running: `docker ps`
2. Check crypto materials exist: `ls ../blockchain/network/crypto-config`
3. Verify peer endpoints in `.env`

### Transaction Errors

**Error:** `ENDORSEMENT_POLICY_FAILURE`

**Solution:** Check that chaincode is properly deployed on both channels

**Error:** `MVCC_READ_CONFLICT`

**Solution:** Concurrent modification detected, retry the transaction

### Permission Errors

**Error:** `Only Creditor can create loans`

**Solution:** Check that the correct organization is being used for the operation

## 📚 Related Documentation

- [Blockchain Network](../blockchain/README.md) - Network setup and management
- [Chaincode Documentation](../blockchain/chaincode/iu-unified/README.md) - Smart contract API
- [Frontend Application](../BlockChainIU%202/blockchainiu-next/README.md) - Web interface

## 🔄 Development Workflow

1. **Start Blockchain Network**
   ```bash
   cd ../blockchain/network
   ./deploy-network.sh
   ```

2. **Start Backend API**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Test Endpoints**
   ```bash
   # Health check
   curl http://localhost:4000/health

   # Create loan
   curl -X POST http://localhost:4000/api/loans -H "Content-Type: application/json" -d '{"loanData": {...}}'
   ```

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up reverse proxy (nginx)
- [ ] Enable HTTPS/TLS
- [ ] Configure log rotation
- [ ] Set up monitoring (PM2, Prometheus)
- [ ] Configure rate limits appropriately

### PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name iu-backend

# Monitor
pm2 status
pm2 logs iu-backend

# Auto-restart on reboot
pm2 startup
pm2 save
```

## 📝 License

Apache-2.0

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: October 2024
