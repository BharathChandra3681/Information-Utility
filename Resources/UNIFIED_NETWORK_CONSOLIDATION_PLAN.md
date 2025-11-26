# 🎯 UNIFIED NETWORK CONSOLIDATION PLAN
## Information Utility - Two-Channel Blockchain Architecture

**Date Created:** October 14, 2025  
**Project:** Information Utility Blockchain System  
**Architecture:** 3 Organizations, 2 Channels, Unified Chaincode

---

## 📊 EXECUTIVE SUMMARY

This document outlines the complete consolidation of two separate Hyperledger Fabric networks into a single unified network with two channels:

### **Key Requirements Met:**
- ✅ **3 Organizations:** Government (Admin + Regulator), Creditor, Debtor
- ✅ **2 Channels:** 
  - `governance-channel` - Government monitoring/oversight (read-only audit)
  - `financial-operations-channel` - Loan processing between all 3 orgs
- ✅ **Unified Chaincode:** Single `iu-unified` chaincode with channel-aware logic
- ✅ **Government Role:** Admin approval on financial channel + monitoring on governance channel
- ✅ **Single Backend:** Unified API service with org-based routing
- ✅ **Complete Frontend:** Including new government dashboard

---

## 🏗️ UNIFIED ARCHITECTURE OVERVIEW

```
┌────────────────────────────────────────────────────────────────────┐
│                    INFORMATION UTILITY NETWORK                      │
│                         (iu-network.com)                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🏛️  ORDERER SERVICE                                                │
│  └─ orderer.iu-network.com:7050                                    │
│     ├─ Manages both channels                                       │
│     └─ OrdererMSP                                                  │
│                                                                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📊 CHANNEL 1: governance-channel                                   │
│  ├─ Purpose: Regulatory Monitoring & Compliance                    │
│  ├─ Chaincode: iu-unified (governance functions only)              │
│  ├─ Organizations:                                                 │
│  │   └─ GovernmentMSP (Read-Only Access)                           │
│  │      └─ peer0.government.iu-network.com:7051                    │
│  └─ Functions:                                                     │
│      ├─ queryAllTransactions() (read-only)                         │
│      ├─ generateAuditReport()                                      │
│      ├─ getComplianceMetrics()                                     │
│      └─ queryLoansByStatus()                                       │
│                                                                      │
│  💰 CHANNEL 2: financial-operations-channel                         │
│  ├─ Purpose: Loan Processing & Financial Operations               │
│  ├─ Chaincode: iu-unified (financial functions)                    │
│  ├─ Organizations:                                                 │
│  │   ├─ GovernmentMSP (Admin - Approve/Reject)                     │
│  │   │   └─ peer0.government.iu-network.com:7051                   │
│  │   ├─ CreditorMSP (Lenders - Create/Manage Loans)               │
│  │   │   └─ peer0.creditor.iu-network.com:8051                     │
│  │   └─ DebtorMSP (Borrowers - Accept/Reject Loans)               │
│  │       └─ peer0.debtor.iu-network.com:9051                       │
│  └─ Functions:                                                     │
│      ├─ createLoan() (Creditor)                                    │
│      ├─ approveLoanByAdmin() (Government)                          │
│      ├─ approveLoanByBorrower() (Debtor)                           │
│      ├─ rejectLoan() (Government/Debtor)                           │
│      ├─ queryLoans() (All)                                         │
│      └─ updateLoanStatus() (Government)                            │
│                                                                      │
│  🔗 DATA FLOW:                                                      │
│  └─ Every financial transaction automatically creates audit        │
│      record visible on governance-channel                          │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📁 UNIFIED PROJECT STRUCTURE

```
information-utility/
├── 📁 frontend/                              # Next.js Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js                       # Landing page
│   │   │   ├── creditor-dashboard/
│   │   │   │   └── page.js                   # Lender interface
│   │   │   ├── borrower-dashboard/
│   │   │   │   └── page.js                   # Borrower interface
│   │   │   ├── admin-dashboard/              # RENAMED: government-dashboard
│   │   │   │   └── page.js                   # Government admin (financial approval)
│   │   │   └── governance-dashboard/         # NEW
│   │   │       └── page.js                   # Government monitoring (read-only)
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── forms/
│   │   │   └── charts/
│   │   └── lib/
│   │       └── api/
│   │           └── fabric.js                 # Unified API client
│   ├── public/
│   ├── package.json
│   └── next.config.js
│
├── 📁 backend/                               # Unified Node.js Backend
│   ├── src/
│   │   ├── server.js                         # Main entry (single port: 4000)
│   │   ├── config/
│   │   │   ├── fabric-config.js              # Network configuration
│   │   │   └── organizations.js              # Org-specific settings
│   │   ├── services/
│   │   │   ├── fabric-gateway.js             # Fabric connection manager
│   │   │   ├── loan-service.js               # Business logic
│   │   │   └── governance-service.js         # Audit/monitoring logic
│   │   ├── routes/
│   │   │   ├── loans.js                      # Financial operations
│   │   │   └── governance.js                 # Monitoring/audit endpoints
│   │   └── middleware/
│   │       ├── auth.js                       # Organization authentication
│   │       └── channel-router.js             # Route to correct channel
│   ├── wallets/                              # Identity wallets
│   │   ├── government/
│   │   ├── creditor/
│   │   └── debtor/
│   └── package.json
│
├── 📁 blockchain/                            # Hyperledger Fabric Network
│   ├── chaincode/
│   │   └── iu-unified/                       # UNIFIED CHAINCODE
│   │       ├── index.js                      # Main entry point
│   │       ├── package.json
│   │       ├── metadata.json
│   │       ├── lib/
│   │       │   ├── loan-contract.js          # Financial operations
│   │       │   ├── governance-contract.js    # Monitoring/audit
│   │       │   └── base-contract.js          # Shared utilities
│   │       ├── models/
│   │       │   ├── SimpleLoan.js             # Loan data structure
│   │       │   └── AuditRecord.js            # Audit trail structure
│   │       └── test/
│   │           ├── loan.test.js
│   │           └── governance.test.js
│   │
│   ├── network/
│   │   ├── config/
│   │   │   ├── configtx.yaml                 # Channel & org configuration
│   │   │   ├── crypto-config.yaml            # Crypto material generation
│   │   │   ├── core.yaml                     # Peer configuration
│   │   │   └── orderer.yaml                  # Orderer configuration
│   │   │
│   │   ├── connection-profiles/              # Org connection profiles
│   │   │   ├── government-connection.json
│   │   │   ├── creditor-connection.json
│   │   │   └── debtor-connection.json
│   │   │
│   │   ├── docker/
│   │   │   ├── docker-compose.yaml           # Main network setup
│   │   │   └── docker-compose.ca.yaml        # Certificate Authorities
│   │   │
│   │   └── scripts/
│   │       ├── 1-generate-crypto.sh          # Generate certificates
│   │       ├── 2-start-network.sh            # Start Docker containers
│   │       ├── 3-create-channels.sh          # Create both channels
│   │       ├── 4-join-peers.sh               # Join peers to channels
│   │       ├── 5-deploy-chaincode.sh         # Deploy iu-unified
│   │       ├── 6-test-network.sh             # Verify setup
│   │       ├── stop-network.sh               # Shutdown
│   │       └── cleanup.sh                    # Remove artifacts
│   │
│   └── organizations/                        # Generated MSP materials
│       ├── ordererOrganizations/
│       │   └── iu-network.com/
│       └── peerOrganizations/
│           ├── government.iu-network.com/
│           ├── creditor.iu-network.com/
│           └── debtor.iu-network.com/
│
├── 📁 scripts/                               # Automation Scripts
│   ├── consolidate-network.sh               # Main consolidation script
│   ├── migrate-data.sh                       # Data migration (if needed)
│   └── verify-setup.sh                       # Post-setup verification
│
├── 📁 docs/                                  # Documentation
│   ├── ARCHITECTURE.md                       # System architecture
│   ├── API.md                                # API documentation
│   ├── DEPLOYMENT.md                         # Deployment guide
│   └── TROUBLESHOOTING.md                    # Common issues
│
├── docker-compose.yml                        # Root Docker Compose
├── package.json                              # Root package.json (workspaces)
├── .env.example                              # Environment template
├── .gitignore                                # Git ignore rules
└── README.md                                 # Main project README
```

---

## 🏢 ORGANIZATION STRUCTURE

### **1. GovernmentMSP (Admin + Regulator)**

**Identity:** `government.iu-network.com`  
**Peer:** `peer0.government.iu-network.com:7051`  
**CA:** `ca.government.iu-network.com:7054`

**Roles:**
- **On financial-operations-channel:**
  - Admin approval authority
  - Can approve/reject loans
  - Full read/write access
  - Manages loan lifecycle

- **On governance-channel:**
  - Regulatory oversight
  - Read-only monitoring
  - Generate compliance reports
  - Audit trail access

**Users:**
- `admin@government.iu-network.com` - Admin identity
- `regulator@government.iu-network.com` - Monitoring identity

---

### **2. CreditorMSP (Lenders)**

**Identity:** `creditor.iu-network.com`  
**Peer:** `peer0.creditor.iu-network.com:8051`  
**CA:** `ca.creditor.iu-network.com:8054`

**Roles:**
- **On financial-operations-channel ONLY:**
  - Create loan records
  - Submit loans for approval
  - View own loan portfolio
  - Update loan details (before approval)

**Users:**
- `admin@creditor.iu-network.com` - Organization admin
- `lender@creditor.iu-network.com` - Loan officer identity

---

### **3. DebtorMSP (Borrowers)**

**Identity:** `debtor.iu-network.com`  
**Peer:** `peer0.debtor.iu-network.com:9051`  
**CA:** `ca.debtor.iu-network.com:9054`

**Roles:**
- **On financial-operations-channel ONLY:**
  - View loans addressed to them
  - Accept/reject loan offers
  - View loan status
  - Cannot create loans

**Users:**
- `admin@debtor.iu-network.com` - Organization admin
- `borrower@debtor.iu-network.com` - Borrower identity

---

## 📡 CHANNEL CONFIGURATION

### **Channel 1: governance-channel**

```yaml
Name: governance-channel
Organizations:
  - GovernmentMSP (Anchor Peer: peer0.government.iu-network.com:7051)

Access Policy:
  - Read: GovernmentMSP only
  - Write: System only (automatic audit records)
  - Admin: GovernmentMSP

Chaincode: iu-unified
Functions Available:
  - queryAllTransactions()
  - queryLoansByStatus(status)
  - getTransactionHistory(loanId)
  - generateAuditReport(startDate, endDate)
  - getComplianceMetrics()
  - queryLoansByDateRange(start, end)

Endorsement Policy:
  - Any read operation: GovernmentMSP signature required
```

---

### **Channel 2: financial-operations-channel**

```yaml
Name: financial-operations-channel
Organizations:
  - GovernmentMSP (Anchor Peer: peer0.government.iu-network.com:7051)
  - CreditorMSP (Anchor Peer: peer0.creditor.iu-network.com:8051)
  - DebtorMSP (Anchor Peer: peer0.debtor.iu-network.com:9051)

Access Policy:
  - Read: All members
  - Write: All members (function-specific restrictions)
  - Admin: GovernmentMSP

Chaincode: iu-unified
Functions Available:
  - createLoan() [CreditorMSP only]
  - approveLoanByAdmin() [GovernmentMSP only]
  - rejectLoanByAdmin() [GovernmentMSP only]
  - approveLoanByBorrower() [DebtorMSP only]
  - rejectLoanByBorrower() [DebtorMSP only]
  - queryLoans() [All - filtered by org]
  - getLoanDetails(loanId) [All - with permission check]
  - updateLoanStatus() [GovernmentMSP only]

Endorsement Policy:
  - createLoan: CreditorMSP signature
  - Admin actions: GovernmentMSP signature
  - Borrower actions: DebtorMSP signature
  - State changes: Majority (2 of 3 orgs)
```

---

## 🔗 UNIFIED CHAINCODE STRUCTURE

### **File Structure**

```
blockchain/chaincode/iu-unified/
├── index.js                                  # Main entry point
├── package.json
├── metadata.json
├── collections-config.json
│
├── lib/
│   ├── base-contract.js                      # Base class with utilities
│   ├── loan-contract.js                      # Financial operations
│   └── governance-contract.js                # Monitoring/audit
│
├── models/
│   ├── SimpleLoan.js                         # Loan data model
│   ├── AuditRecord.js                        # Audit record model
│   └── enums.js                              # Status enums
│
├── utils/
│   ├── validation.js                         # Input validation
│   ├── access-control.js                     # Permission checks
│   └── channel-detector.js                   # Detect current channel
│
└── test/
    ├── loan-contract.test.js
    └── governance-contract.test.js
```

### **Key Components**

#### **index.js - Main Entry**
```javascript
'use strict';

const LoanContract = require('./lib/loan-contract');
const GovernanceContract = require('./lib/governance-contract');

module.exports.LoanContract = LoanContract;
module.exports.GovernanceContract = GovernanceContract;

module.exports.contracts = [LoanContract, GovernanceContract];
```

#### **loan-contract.js - Financial Operations**
```javascript
'use strict';

const { Contract } = require('fabric-contract-api');
const SimpleLoan = require('../models/SimpleLoan');
const { createAuditRecord } = require('./governance-contract');

class LoanContract extends Contract {
  
  constructor() {
    super('LoanContract');
  }

  // Only accessible on financial-operations-channel
  async createLoan(ctx, loanData) {
    // Verify channel
    if (ctx.stub.getChannelID() !== 'financial-operations-channel') {
      throw new Error('This function is only available on financial-operations-channel');
    }
    
    // Verify caller is CreditorMSP
    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'CreditorMSP') {
      throw new Error('Only Creditor organization can create loans');
    }
    
    // Create loan
    const loan = SimpleLoan.fromJSON(loanData);
    loan.status = 'awaiting-admin';
    loan.submittedAt = new Date().toISOString();
    
    await ctx.stub.putState(loan.loanId, Buffer.from(JSON.stringify(loan)));
    
    // Create audit record (cross-channel)
    await this.createAuditRecord(ctx, 'LOAN_CREATED', loan);
    
    return loan;
  }

  async approveLoanByAdmin(ctx, loanId) {
    // Only GovernmentMSP can approve
    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'GovernmentMSP') {
      throw new Error('Only Government can approve loans');
    }
    
    // Get and update loan
    const loanBytes = await ctx.stub.getState(loanId);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`Loan ${loanId} not found`);
    }
    
    const loan = JSON.parse(loanBytes.toString());
    loan.adminApproval = 'approved';
    loan.status = 'awaiting-borrower';
    loan.adminApprovedAt = new Date().toISOString();
    
    await ctx.stub.putState(loanId, Buffer.from(JSON.stringify(loan)));
    
    // Audit trail
    await this.createAuditRecord(ctx, 'ADMIN_APPROVED', loan);
    
    return loan;
  }

  async queryLoans(ctx, filters) {
    // All orgs can query, but filter based on MSP
    const clientMSP = ctx.clientIdentity.getMSPID();
    
    const query = {
      selector: {
        docType: 'SimpleLoan'
      }
    };
    
    // Apply org-specific filters
    if (clientMSP === 'CreditorMSP') {
      query.selector.creditorMSP = 'CreditorMSP';
    } else if (clientMSP === 'DebtorMSP') {
      query.selector.debtorMSP = 'DebtorMSP';
    }
    // GovernmentMSP sees all
    
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    return await this.getAllResults(iterator);
  }

  async createAuditRecord(ctx, action, loan) {
    // This creates a record that will be visible on governance-channel
    const auditRecord = {
      docType: 'AuditRecord',
      recordId: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: action,
      loanId: loan.loanId,
      msp: ctx.clientIdentity.getMSPID(),
      timestamp: new Date().toISOString(),
      loanSnapshot: loan
    };
    
    // Store audit record
    const compositeKey = ctx.stub.createCompositeKey('audit', [
      auditRecord.timestamp,
      auditRecord.recordId
    ]);
    
    await ctx.stub.putState(compositeKey, Buffer.from(JSON.stringify(auditRecord)));
  }
}

module.exports = LoanContract;
```

#### **governance-contract.js - Monitoring**
```javascript
'use strict';

const { Contract } = require('fabric-contract-api');

class GovernanceContract extends Contract {
  
  constructor() {
    super('GovernanceContract');
  }

  // Only accessible on governance-channel
  async queryAllTransactions(ctx, startDate, endDate) {
    // Verify channel
    if (ctx.stub.getChannelID() !== 'governance-channel') {
      throw new Error('This function is only available on governance-channel');
    }
    
    // Verify caller is GovernmentMSP
    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'GovernmentMSP') {
      throw new Error('Only Government can access audit records');
    }
    
    // Query all audit records
    const query = {
      selector: {
        docType: 'AuditRecord',
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      },
      sort: [{ timestamp: 'desc' }]
    };
    
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    return await this.getAllResults(iterator);
  }

  async generateAuditReport(ctx, month, year) {
    // Verify permissions
    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'GovernmentMSP') {
      throw new Error('Only Government can generate reports');
    }
    
    // Get all transactions for the period
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0).toISOString();
    
    const transactions = await this.queryAllTransactions(ctx, startDate, endDate);
    
    // Generate report statistics
    const report = {
      period: `${year}-${month}`,
      totalTransactions: transactions.length,
      loansByStatus: this.groupByStatus(transactions),
      activityByOrg: this.groupByOrg(transactions),
      generatedAt: new Date().toISOString()
    };
    
    return report;
  }

  async getComplianceMetrics(ctx) {
    // Real-time compliance dashboard data
    const clientMSP = ctx.clientIdentity.getMSPID();
    if (clientMSP !== 'GovernmentMSP') {
      throw new Error('Access denied');
    }
    
    // Query recent activity
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentTransactions = await this.queryAllTransactions(
      ctx,
      last30Days.toISOString(),
      new Date().toISOString()
    );
    
    return {
      totalLoans: recentTransactions.filter(t => t.action === 'LOAN_CREATED').length,
      approvedLoans: recentTransactions.filter(t => t.action === 'ADMIN_APPROVED').length,
      rejectedLoans: recentTransactions.filter(t => t.action === 'LOAN_REJECTED').length,
      pendingLoans: recentTransactions.filter(t => t.loanSnapshot.status === 'awaiting-admin').length,
      averageApprovalTime: this.calculateAverageApprovalTime(recentTransactions)
    };
  }

  groupByStatus(transactions) {
    const grouped = {};
    transactions.forEach(tx => {
      const status = tx.loanSnapshot?.status || 'unknown';
      grouped[status] = (grouped[status] || 0) + 1;
    });
    return grouped;
  }

  groupByOrg(transactions) {
    const grouped = {};
    transactions.forEach(tx => {
      const org = tx.msp || 'unknown';
      grouped[org] = (grouped[org] || 0) + 1;
    });
    return grouped;
  }

  async getAllResults(iterator) {
    const allResults = [];
    let res = await iterator.next();
    while (!res.done) {
      if (res.value && res.value.value.toString()) {
        const record = JSON.parse(res.value.value.toString('utf8'));
        allResults.push(record);
      }
      res = await iterator.next();
    }
    await iterator.close();
    return allResults;
  }
}

module.exports = GovernanceContract;
```

---

## 🔧 BACKEND UNIFIED API ARCHITECTURE

### **Single Backend Service (Port 4000)**

```javascript
// backend/src/server.js
const express = require('express');
const cors = require('cors');
const loanRoutes = require('./routes/loans');
const governanceRoutes = require('./routes/governance');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Organization-based routing
app.use('/api/loans', authMiddleware, loanRoutes);
app.use('/api/governance', authMiddleware, governanceRoutes);

app.listen(PORT, () => {
  console.log(`✅ Unified Backend running on port ${PORT}`);
});
```

### **Organization Authentication Middleware**

```javascript
// backend/src/middleware/auth.js
function authMiddleware(req, res, next) {
  const org = req.query.org || req.body.org || req.headers['x-org'];
  
  const validOrgs = ['government', 'creditor', 'debtor'];
  if (!validOrgs.includes(org)) {
    return res.status(401).json({ error: 'Invalid organization' });
  }
  
  req.org = org;
  req.msp = `${org.charAt(0).toUpperCase()}${org.slice(1)}MSP`;
  
  next();
}

module.exports = authMiddleware;
```

### **Fabric Gateway Service**

```javascript
// backend/src/services/fabric-gateway.js
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

class FabricGatewayService {
  async connect(org, channelName) {
    const gateway = new Gateway();
    
    // Load connection profile
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'blockchain', 
      'network', 'connection-profiles', `${org}-connection.json`);
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    
    // Load wallet
    const walletPath = path.resolve(__dirname, '..', '..', 'wallets', org);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    // Check identity
    const identity = await wallet.get('admin');
    if (!identity) {
      throw new Error(`Identity not found for ${org}`);
    }
    
    // Connect
    await gateway.connect(ccp, {
      wallet,
      identity: 'admin',
      discovery: { enabled: true, asLocalhost: true }
    });
    
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract('iu-unified');
    
    return { gateway, network, contract };
  }
}

module.exports = new FabricGatewayService();
```

### **API Endpoints**

```javascript
// backend/src/routes/loans.js (Financial Channel)
router.post('/', async (req, res) => {
  // Create loan - CreditorMSP only
  const { gateway, contract } = await fabricGateway.connect(
    req.org, 
    'financial-operations-channel'
  );
  
  try {
    const result = await contract.submitTransaction(
      'LoanContract:createLoan',
      JSON.stringify(req.body)
    );
    res.json(JSON.parse(result.toString()));
  } finally {
    gateway.disconnect();
  }
});

// backend/src/routes/governance.js (Governance Channel)
router.get('/audit-report', async (req, res) => {
  // Only government can access
  if (req.org !== 'government') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { gateway, contract } = await fabricGateway.connect(
    'government',
    'governance-channel'
  );
  
  try {
    const result = await contract.evaluateTransaction(
      'GovernanceContract:generateAuditReport',
      req.query.month,
      req.query.year
    );
    res.json(JSON.parse(result.toString()));
  } finally {
    gateway.disconnect();
  }
});
```

---

## 🌐 FRONTEND ARCHITECTURE

### **Dashboard Structure**

1. **Creditor Dashboard** (`/creditor-dashboard`)
   - Create loans
   - View own portfolio
   - Track approval status

2. **Borrower Dashboard** (`/borrower-dashboard`)
   - View loans addressed to them
   - Accept/reject offers
   - Track loan status

3. **Admin Dashboard** (`/admin-dashboard`)
   - Approve/reject loans (financial operations)
   - Manage loan lifecycle
   - Full access to financial channel

4. **Governance Dashboard** (`/governance-dashboard`) **[NEW]**
   - Read-only monitoring
   - Audit reports
   - Compliance metrics
   - Transaction history
   - System health

### **Unified API Client**

```javascript
// frontend/src/lib/api/fabric.js
const API_BASE = 'http://localhost:4000/api';

export async function createLoan(loanData, org = 'creditor') {
  const res = await fetch(`${API_BASE}/loans?org=${org}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loanData)
  });
  return res.json();
}

export async function getAuditReport(month, year) {
  const res = await fetch(
    `${API_BASE}/governance/audit-report?org=government&month=${month}&year=${year}`
  );
  return res.json();
}

export async function getComplianceMetrics() {
  const res = await fetch(`${API_BASE}/governance/metrics?org=government`);
  return res.json();
}
```

---

## 📋 STEP-BY-STEP IMPLEMENTATION PROCEDURE

### **Phase 1: Environment Preparation** (Day 1)

#### Step 1.1: Backup Current System
```bash
# Backup existing network
cd "/Users/bharathchandranangunuri/Information Utility"
mkdir -p backups/$(date +%Y%m%d)
cp -r network/ backups/$(date +%Y%m%d)/network-backup
cp -r hyperledger-fabric-iu/ backups/$(date +%Y%m%d)/hyperledger-backup
cp -r chaincode/ backups/$(date +%Y%m%d)/chaincode-backup
```

#### Step 1.2: Stop All Running Networks
```bash
# Stop network in /network
cd network
docker-compose down -v

# Stop network in /hyperledger-fabric-iu
cd ../hyperledger-fabric-iu/network
docker-compose down -v

# Clean all Fabric containers
docker rm -f $(docker ps -aq --filter "name=fabric")
docker rm -f $(docker ps -aq --filter "name=peer")
docker rm -f $(docker ps -aq --filter "name=orderer")
docker volume prune -f
docker network prune -f
```

#### Step 1.3: Install Prerequisites
```bash
# Ensure Docker is running
docker --version

# Ensure Node.js is installed
node --version  # Should be v14+ or v16+
npm --version

# Install Fabric binaries (if not already)
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.0 1.4.9
```

---

### **Phase 2: Create Unified Directory Structure** (Day 1)

I'll create the consolidated structure. Would you like me to:

1. **Generate all configuration files** (configtx.yaml, crypto-config.yaml, docker-compose.yaml)
2. **Create the unified chaincode** (iu-unified with loan-contract + governance-contract)
3. **Set up the backend service** (unified API with org routing)
4. **Create network scripts** (start, stop, deploy, test)
5. **Update frontend** (add governance dashboard)

Should I proceed with creating all these files in your workspace now? Or would you like me to show you each configuration first for review before creating them?

Please confirm, and I'll generate everything step by step! 🚀
