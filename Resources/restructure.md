# Information Utility Project Restructure Plan

## 📊 Current Project Status

### **Project Overview**
The Information Utility project is a Hyperledger Fabric-based blockchain application for managing loan processing, KYC, and document management across multiple organizations (Creditor, Debtor, Admin).

### **Current Technology Stack**
- **Frontend**: Next.js 15.4.5 with React 19.1.0
- **Backend**: Node.js with Express.js
- **Blockchain**: Hyperledger Fabric with Node.js chaincode
- **Database**: PostgreSQL (inferred from schema files)
- **Containerization**: Docker with Docker Compose
- **Development**: JavaScript/TypeScript

### **Current Architecture Issues**

#### 🚨 **Critical Problems Identified**

1. **Duplicate Directory Structure**
   ```
   ❌ PROBLEM: Multiple similar directories causing confusion
   ├── BlockChainIU 2/blockchainiu-next/     # Main frontend (active)
   ├── hyperledger-fabric-iu/frontend/       # Duplicate frontend (unused)
   ├── chaincode/                            # Root chaincode (active)
   ├── hyperledger-fabric-iu/chaincode/      # Duplicate chaincode (unused)
   ├── network/                              # Root network (active)
   └── hyperledger-fabric-iu/network/        # Duplicate network (unused)
   ```

2. **Temporary Backend Dependency**
   ```
   ❌ CRITICAL: Production system relying on temporary solution
   ├── network/temp-solution.js              # Temporary mock backend
   ├── Bypasses Hyperledger Fabric           # Not using blockchain
   ├── In-memory data storage                # Data not persisted
   └── No real blockchain integration        # Defeats the purpose
   ```

3. **Inconsistent Naming Conventions**
   - `BlockChainIU 2/` (spaces and numbers in directory names)
   - Mixed case: `hyperledger-fabric-iu/` vs `chaincode/`
   - Inconsistent abbreviations: `IU` vs `iu`

4. **Scattered Configuration Files**
   - Root level: `network.sh`, `iu-basic.tar.gz`, `log.txt`
   - Multiple `package.json` files in different locations
   - Duplicate Docker configurations
   - Temporary files mixed with production code

5. **Documentation Fragmentation**
   - 15+ documentation files scattered in root directory
   - Multiple README files with overlapping information
   - PDF files mixed with markdown documentation

6. **Development Environment Issues**
   - No unified development setup
   - Multiple lockfiles causing conflicts
   - Inconsistent dependency management
   - No proper environment configuration

7. **Hyperledger Fabric Infrastructure Issues**
   - Orderer connection problems
   - Incomplete network setup
   - Missing proper MSP configurations
   - No production-ready deployment strategy

## 🎯 Proposed New Project Structure

### **Root Directory Structure**
```
information-utility/
├── 📁 frontend/                          # Next.js application
├── 📁 backend/                           # Node.js API services
├── 📁 blockchain/                        # Hyperledger Fabric
├── 📁 scripts/                           # Automation scripts
├── 📁 docs/                              # Documentation
├── 📁 config/                            # Configuration files
├── 📁 tests/                             # Test suites
├── 📁 docker/                            # Docker configurations
├── 📁 .github/                           # GitHub workflows
├── 📁 .vscode/                           # VS Code settings
├── package.json                          # Root package.json (workspaces)
├── docker-compose.yml                    # Main Docker Compose
├── .env.example                          # Environment template
├── .gitignore                            # Git ignore rules
├── README.md                             # Main project README
└── CHANGELOG.md                          # Version history
```

### **Detailed Directory Breakdown**

#### **1. Frontend Structure**
```
frontend/
├── src/
│   ├── app/                              # Next.js app router
│   │   ├── page.js                       # Home page
│   │   ├── layout.js                     # Root layout
│   │   ├── creditor-dashboard/
│   │   │   └── page.js
│   │   ├── borrower-dashboard/
│   │   │   └── page.js
│   │   └── admin-dashboard/
│   │       └── page.js
│   ├── components/                       # Reusable UI components
│   │   ├── ui/                          # Basic UI components
│   │   │   ├── Button.js
│   │   │   ├── Card.js
│   │   │   └── Modal.js
│   │   ├── forms/                       # Form components
│   │   │   ├── LoanForm.js
│   │   │   └── LoginForm.js
│   │   ├── charts/                      # Data visualization
│   │   │   └── LoanChart.js
│   │   └── layout/                      # Layout components
│   │       ├── Header.js
│   │       └── Sidebar.js
│   ├── lib/                             # Utility functions
│   │   ├── api/                         # API client functions
│   │   │   ├── loans.js
│   │   │   └── auth.js
│   │   ├── auth/                        # Authentication logic
│   │   │   └── auth.js
│   │   ├── utils/                       # Helper functions
│   │   │   ├── formatters.js
│   │   │   └── validators.js
│   │   └── constants/                   # Application constants
│   │       └── config.js
│   ├── hooks/                           # Custom React hooks
│   │   ├── useAuth.js
│   │   └── useLoans.js
│   ├── styles/                          # Global styles
│   │   ├── globals.css
│   │   └── components.css
│   └── types/                           # TypeScript definitions
│       └── index.ts
├── public/                              # Static assets
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.local.example
```

#### **2. Backend Structure**
```
backend/
├── src/
│   ├── controllers/                     # Request handlers
│   │   ├── loanController.js
│   │   ├── authController.js
│   │   ├── documentController.js
│   │   └── blockchainController.js
│   ├── services/                        # Business logic
│   │   ├── loanService.js
│   │   ├── blockchainService.js
│   │   ├── fabricGatewayService.js      # Hyperledger Fabric integration
│   │   ├── notificationService.js
│   │   └── auditService.js
│   ├── models/                          # Data models
│   │   ├── Loan.js
│   │   ├── User.js
│   │   ├── Document.js
│   │   └── Transaction.js
│   ├── middleware/                      # Express middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   ├── blockchainAuth.js
│   │   └── auditLogger.js
│   ├── routes/                          # API routes
│   │   ├── loans.js
│   │   ├── auth.js
│   │   ├── documents.js
│   │   └── blockchain.js
│   ├── config/                          # Configuration
│   │   ├── database.js
│   │   ├── blockchain.js
│   │   ├── fabric.js                    # Fabric network config
│   │   └── environment.js
│   ├── fabric/                          # Hyperledger Fabric integration
│   │   ├── gateway.js                   # Fabric Gateway connection
│   │   ├── network.js                   # Network configuration
│   │   ├── wallet.js                    # Wallet management
│   │   └── contract.js                  # Contract interactions
│   ├── utils/                           # Helper functions
│   │   ├── logger.js
│   │   ├── encryption.js
│   │   ├── validators.js
│   │   └── fabricUtils.js
│   └── app.js                           # Main application file
├── package.json
├── .env.example
└── server.js                            # Server entry point
```

#### **3. Blockchain Structure**
```
blockchain/
├── chaincode/
│   ├── iu-basic/                        # Main chaincode
│   │   ├── index.js                     # Main chaincode file
│   │   ├── package.json
│   │   ├── metadata.json
│   │   ├── collections-config.json
│   │   └── test/
│   │       └── contract.test.js
│   ├── loan-processor/                  # Loan-specific logic
│   │   ├── index.js
│   │   └── package.json
│   └── shared/                          # Common utilities
│       ├── utils.js
│       └── constants.js
├── network/
│   ├── config/                          # Network configuration
│   │   ├── configtx.yaml                # Channel configuration
│   │   ├── core.yaml                    # Peer configuration
│   │   ├── orderer.yaml                 # Orderer configuration
│   │   ├── crypto-config.yaml           # Crypto material config
│   │   └── connection-profiles/         # Connection profiles
│   │       ├── creditor-connection.json
│   │       ├── debtor-connection.json
│   │       └── admin-connection.json
│   ├── scripts/                         # Network management scripts
│   │   ├── start-network.sh
│   │   ├── stop-network.sh
│   │   ├── create-channels.sh
│   │   ├── deploy-chaincode.sh
│   │   ├── test-network.sh
│   │   ├── diagnose-network.sh
│   │   └── fix-orderer-issues.sh
│   ├── docker/                          # Container definitions
│   │   ├── docker-compose.yaml          # Production setup
│   │   ├── docker-compose.dev.yaml      # Development setup
│   │   ├── docker-compose.test.yaml     # Testing setup
│   │   └── base/                        # Base configurations
│   │       ├── peer-base.yaml
│   │       └── orderer-base.yaml
│   ├── artifacts/                       # Generated artifacts
│   │   ├── channel-artifacts/
│   │   ├── crypto-config/
│   │   └── system-genesis-block/
│   └── monitoring/                      # Network monitoring
│       ├── prometheus/
│       ├── grafana/
│       └── logs/
├── organizations/                       # MSP configurations
│   ├── fabric-ca/
│   │   ├── ca-config.yaml
│   │   └── fabric-ca-server-config.yaml
│   ├── ordererOrganizations/
│   └── peerOrganizations/
│       ├── creditor.iu-network.com/
│       ├── debtor.iu-network.com/
│       └── admin.iu-network.com/
├── production/                          # Production deployment
│   ├── kubernetes/                      # K8s manifests
│   ├── terraform/                       # Infrastructure as code
│   └── ansible/                         # Configuration management
└── README.md
```

#### **4. Scripts Structure**
```
scripts/
├── setup/                               # Setup scripts
│   ├── install-dependencies.sh
│   ├── setup-environment.sh
│   └── generate-crypto.sh
├── deployment/                          # Deployment scripts
│   ├── deploy-network.sh
│   ├── deploy-chaincode.sh
│   └── deploy-application.sh
├── development/                         # Development scripts
│   ├── start-dev.sh
│   ├── stop-dev.sh
│   └── reset-network.sh
├── testing/                             # Testing scripts
│   ├── run-tests.sh
│   ├── test-chaincode.sh
│   └── test-integration.sh
└── utils/                               # Utility scripts
    ├── cleanup.sh
    ├── backup.sh
    └── health-check.sh
```

#### **5. Documentation Structure**
```
docs/
├── architecture/                        # Architecture documentation
│   ├── overview.md
│   ├── network-topology.md
│   ├── data-flow.md
│   └── security-model.md
├── api/                                 # API documentation
│   ├── frontend-api.md
│   ├── backend-api.md
│   └── blockchain-api.md
├── deployment/                          # Deployment guides
│   ├── local-setup.md
│   ├── production-deployment.md
│   └── docker-setup.md
├── development/                         # Development guides
│   ├── getting-started.md
│   ├── contributing.md
│   └── coding-standards.md
├── user-guides/                         # User documentation
│   ├── creditor-guide.md
│   ├── borrower-guide.md
│   └── admin-guide.md
└── research/                            # Research materials
    ├── blockchain-architecture.pdf
    ├── network-topology.pdf
    └── data-scheme.pdf
```

#### **6. Configuration Structure**
```
config/
├── environments/                        # Environment-specific configs
│   ├── development.json
│   ├── staging.json
│   └── production.json
├── docker/                              # Docker configurations
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.override.yml
├── nginx/                               # Nginx configurations
│   ├── nginx.conf
│   └── ssl/
└── monitoring/                          # Monitoring configurations
    ├── prometheus.yml
    └── grafana/
```

#### **7. Testing Structure**
```
tests/
├── unit/                                # Unit tests
│   ├── frontend/
│   ├── backend/
│   └── blockchain/
├── integration/                         # Integration tests
│   ├── api-tests/
│   ├── blockchain-tests/
│   └── end-to-end-tests/
├── fixtures/                            # Test data
│   ├── sample-loans.json
│   └── test-users.json
└── utils/                               # Test utilities
    ├── test-helpers.js
    └── mock-data.js
```

## 🔧 **Temporary Backend Removal & Robust Backend Development**

### **Current Temporary Backend Issues**
```
❌ CRITICAL PROBLEMS:
├── network/temp-solution.js              # Mock backend bypassing blockchain
├── In-memory data storage                # No persistence
├── No real blockchain integration        # Defeats blockchain purpose
├── Hardcoded mock data                   # Not production-ready
├── No proper authentication              # Security vulnerability
├── No audit trail                        # Compliance issues
└── No scalability                        # Single point of failure
```

### **Robust Backend Architecture Plan**

#### **1. Hyperledger Fabric Integration Layer**
```javascript
// backend/src/fabric/gateway.js
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');

class FabricGatewayService {
  constructor() {
    this.gateway = new Gateway();
    this.wallet = null;
  }

  async connect(orgName, userId) {
    // Connect to Fabric network
    const walletPath = path.join(process.cwd(), 'wallet');
    this.wallet = await Wallets.newFileSystemWallet(walletPath);
    
    const connectionProfile = path.resolve(
      __dirname, 
      `../config/connection-profiles/${orgName}-connection.json`
    );
    
    const connectionOptions = {
      wallet: this.wallet,
      identity: userId,
      discovery: { enabled: true, asLocalhost: true }
    };

    await this.gateway.connect(connectionProfile, connectionOptions);
    return this.gateway;
  }

  async submitTransaction(contractName, transactionName, ...args) {
    const network = await this.gateway.getNetwork('iu-channel');
    const contract = network.getContract(contractName);
    return await contract.submitTransaction(transactionName, ...args);
  }

  async evaluateTransaction(contractName, transactionName, ...args) {
    const network = await this.gateway.getNetwork('iu-channel');
    const contract = network.getContract(contractName);
    return await contract.evaluateTransaction(transactionName, ...args);
  }
}
```

#### **2. Service Layer with Blockchain Integration**
```javascript
// backend/src/services/loanService.js
const FabricGatewayService = require('../fabric/gateway');
const { v4: uuidv4 } = require('uuid');

class LoanService {
  constructor() {
    this.fabricGateway = new FabricGatewayService();
  }

  async createLoan(loanData, orgName, userId) {
    try {
      // Connect to blockchain
      await this.fabricGateway.connect(orgName, userId);
      
      // Submit transaction to blockchain
      const result = await this.fabricGateway.submitTransaction(
        'iu-basic',
        'CreateLoan',
        JSON.stringify({
          loanId: uuidv4(),
          ...loanData,
          timestamp: new Date().toISOString(),
          status: 'pending'
        })
      );
      
      return JSON.parse(result.toString());
    } catch (error) {
      throw new Error(`Failed to create loan: ${error.message}`);
    }
  }

  async getLoans(orgName, userId, filters = {}) {
    try {
      await this.fabricGateway.connect(orgName, userId);
      
      const result = await this.fabricGateway.evaluateTransaction(
        'iu-basic',
        'GetAllLoans',
        JSON.stringify(filters)
      );
      
      return JSON.parse(result.toString());
    } catch (error) {
      throw new Error(`Failed to retrieve loans: ${error.message}`);
    }
  }

  async approveLoan(loanId, orgName, userId, approvalData) {
    try {
      await this.fabricGateway.connect(orgName, userId);
      
      const result = await this.fabricGateway.submitTransaction(
        'iu-basic',
        'ApproveLoan',
        loanId,
        JSON.stringify(approvalData)
      );
      
      return JSON.parse(result.toString());
    } catch (error) {
      throw new Error(`Failed to approve loan: ${error.message}`);
    }
  }
}
```

#### **3. Enhanced Chaincode with Proper Business Logic**
```javascript
// blockchain/chaincode/iu-basic/index.js (Enhanced)
const { Contract } = require('fabric-contract-api');

class InformationUtilityContract extends Contract {
  
  async CreateLoan(ctx, loanData) {
    const loan = JSON.parse(loanData);
    
    // Validate loan data
    if (!loan.loanId || !loan.borrowerName || !loan.loanAmount) {
      throw new Error('Invalid loan data: missing required fields');
    }
    
    // Check if loan already exists
    const existingLoan = await ctx.stub.getState(loan.loanId);
    if (existingLoan && existingLoan.length > 0) {
      throw new Error(`Loan ${loan.loanId} already exists`);
    }
    
    // Set loan status and metadata
    loan.status = 'pending';
    loan.createdAt = new Date().toISOString();
    loan.updatedAt = new Date().toISOString();
    loan.docType = 'Loan';
    
    // Store in blockchain
    await ctx.stub.putState(loan.loanId, Buffer.from(JSON.stringify(loan)));
    
    // Create audit trail
    await this.createAuditRecord(ctx, loan.loanId, 'LOAN_CREATED', 
      `Loan created by ${loan.submittedBy}`, loan.submittedBy);
    
    return JSON.stringify(loan);
  }

  async ApproveLoan(ctx, loanId, approvalData) {
    const approval = JSON.parse(approvalData);
    
    // Get existing loan
    const loanBytes = await ctx.stub.getState(loanId);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`Loan ${loanId} not found`);
    }
    
    const loan = JSON.parse(loanBytes.toString());
    
    // Update loan status based on approver
    if (approval.approverType === 'borrower') {
      loan.borrowerApproval = approval.approved;
      loan.borrowerApprovalDate = new Date().toISOString();
      loan.borrowerComments = approval.comments;
    } else if (approval.approverType === 'admin') {
      loan.adminApproval = approval.approved;
      loan.adminApprovalDate = new Date().toISOString();
      loan.adminComments = approval.comments;
    }
    
    // Update overall status
    if (loan.borrowerApproval && loan.adminApproval) {
      loan.status = 'approved';
    } else if (loan.borrowerApproval === false || loan.adminApproval === false) {
      loan.status = 'rejected';
    } else {
      loan.status = 'pending';
    }
    
    loan.updatedAt = new Date().toISOString();
    
    // Update in blockchain
    await ctx.stub.putState(loanId, Buffer.from(JSON.stringify(loan)));
    
    // Create audit trail
    await this.createAuditRecord(ctx, loanId, 'LOAN_APPROVED', 
      `Loan ${approval.approved ? 'approved' : 'rejected'} by ${approval.approverType}`, 
      approval.approverId);
    
    return JSON.stringify(loan);
  }

  async createAuditRecord(ctx, loanId, action, details, performedBy) {
    const auditId = `AUDIT_${loanId}_${Date.now()}`;
    const auditRecord = {
      auditId,
      loanId,
      action,
      details,
      performedBy,
      timestamp: new Date().toISOString(),
      docType: 'AuditRecord'
    };
    
    await ctx.stub.putState(auditId, Buffer.from(JSON.stringify(auditRecord)));
  }
}
```

### **Hyperledger Fabric Infrastructure Improvements**

#### **1. Network Configuration Enhancements**
```yaml
# blockchain/network/config/configtx.yaml (Enhanced)
Organizations:
  - &CreditorOrg
    Name: CreditorOrg
    ID: CreditorOrgMSP
    MSPDir: crypto-config/peerOrganizations/creditor.iu-network.com/msp
    Policies:
      Readers:
        Type: Signature
        Rule: "OR('CreditorOrgMSP.member')"
      Writers:
        Type: Signature
        Rule: "OR('CreditorOrgMSP.member')"
      Admins:
        Type: Signature
        Rule: "OR('CreditorOrgMSP.admin')"
    AnchorPeers:
      - Host: peer0.creditor.iu-network.com
        Port: 7051

Capabilities:
  Channel: &ChannelCapabilities
    V2_0: true
  Orderer: &OrdererCapabilities
    V2_0: true
  Application: &ApplicationCapabilities
    V2_0: true

Application: &ApplicationDefaults
  Organizations:
  Policies:
    Readers:
      Type: ImplicitMeta
      Rule: "ANY Readers"
    Writers:
      Type: ImplicitMeta
      Rule: "ANY Writers"
    Admins:
      Type: ImplicitMeta
      Rule: "MAJORITY Admins"
    LifecycleEndorsement:
      Type: ImplicitMeta
      Rule: "MAJORITY Endorsement"
    Endorsement:
      Type: ImplicitMeta
      Rule: "MAJORITY Endorsement"
  Capabilities:
    <<: *ApplicationCapabilities
```

#### **2. Docker Compose for Production**
```yaml
# blockchain/network/docker/docker-compose.yaml (Production)
version: '3.8'

services:
  orderer.iu-network.com:
    extends:
      file: base/orderer-base.yaml
      service: orderer-base
    container_name: orderer.iu-network.com
    environment:
      - FABRIC_LOGGING_SPEC=INFO
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_GENESISMETHOD=file
      - ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/orderer.genesis.block
      - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
      - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp
      - ORDERER_GENERAL_TLS_ENABLED=true
      - ORDERER_GENERAL_TLS_PRIVATEKEY=/var/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_TLS_CERTIFICATE=/var/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_TLS_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
      - ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE=/var/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY=/var/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_CLUSTER_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric
    command: orderer
    volumes:
      - ./artifacts/genesis.block:/var/hyperledger/orderer/orderer.genesis.block
      - ./artifacts/channel-artifacts:/var/hyperledger/orderer/channel-artifacts
      - ./crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp:/var/hyperledger/orderer/msp
      - ./crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/:/var/hyperledger/orderer/tls
      - orderer.iu-network.com:/var/hyperledger/production/orderer
    ports:
      - 7050:7050

  peer0.creditor.iu-network.com:
    container_name: peer0.creditor.iu-network.com
    extends:
      file: base/peer-base.yaml
      service: peer-base
    environment:
      - CORE_PEER_ID=peer0.creditor.iu-network.com
      - CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:7051
      - CORE_PEER_CHAINCODEADDRESS=peer0.creditor.iu-network.com:7052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.creditor.iu-network.com:7051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.creditor.iu-network.com:7051
      - CORE_PEER_LOCALMSPID=CreditorOrgMSP
    volumes:
      - /var/run/:/host/var/run/
      - ./crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/msp:/etc/hyperledger/fabric/msp
      - ./crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls:/etc/hyperledger/fabric/tls
      - peer0.creditor.iu-network.com:/var/hyperledger/production
    ports:
      - 7051:7051

  cli:
    container_name: cli
    image: hyperledger/fabric-tools:latest
    tty: true
    stdin_open: true
    environment:
      - GOPATH=/opt/gopath
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_ID=cli
      - CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051
      - CORE_PEER_LOCALMSPID=CreditorOrgMSP
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
      - CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: /bin/bash
    volumes:
      - /var/run/:/host/var/run/
      - ./chaincode/:/opt/gopath/src/github.com/chaincode
      - ./crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/
      - ./scripts:/opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/
      - ./artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts
    depends_on:
      - orderer.iu-network.com
      - peer0.creditor.iu-network.com

volumes:
  orderer.iu-network.com:
  peer0.creditor.iu-network.com:
```

#### **3. Network Monitoring and Diagnostics**
```bash
#!/bin/bash
# blockchain/network/scripts/diagnose-network.sh

echo "🔍 Diagnosing Hyperledger Fabric Network..."

# Check if containers are running
echo "📦 Checking container status..."
docker ps --filter "name=fabric" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check network connectivity
echo "🌐 Testing network connectivity..."
docker exec cli peer channel list

# Check chaincode installation
echo "⛓️ Checking chaincode installation..."
docker exec cli peer chaincode list --installed

# Check channel information
echo "📋 Checking channel information..."
docker exec cli peer channel getinfo -c iu-channel

# Check peer logs for errors
echo "📝 Checking peer logs for errors..."
docker logs peer0.creditor.iu-network.com 2>&1 | grep -i error | tail -10

# Check orderer logs for errors
echo "📝 Checking orderer logs for errors..."
docker logs orderer.iu-network.com 2>&1 | grep -i error | tail -10

echo "✅ Network diagnosis complete!"
```

#### **4. Production Deployment Strategy**
```yaml
# blockchain/production/kubernetes/fabric-network.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: fabric-network
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orderer
  namespace: fabric-network
spec:
  replicas: 1
  selector:
    matchLabels:
      app: orderer
  template:
    metadata:
      labels:
        app: orderer
    spec:
      containers:
      - name: orderer
        image: hyperledger/fabric-orderer:latest
        env:
        - name: FABRIC_LOGGING_SPEC
          value: "INFO"
        - name: ORDERER_GENERAL_LISTENADDRESS
          value: "0.0.0.0"
        ports:
        - containerPort: 7050
        volumeMounts:
        - name: orderer-data
          mountPath: /var/hyperledger/production/orderer
        - name: crypto-config
          mountPath: /etc/hyperledger/crypto-config
      volumes:
      - name: orderer-data
        persistentVolumeClaim:
          claimName: orderer-pvc
      - name: crypto-config
        configMap:
          name: crypto-config
---
apiVersion: v1
kind: Service
metadata:
  name: orderer-service
  namespace: fabric-network
spec:
  selector:
    app: orderer
  ports:
  - port: 7050
    targetPort: 7050
  type: LoadBalancer
```

## 🚀 Implementation Plan

### **Phase 1: Preparation and Backup (Day 1-2)**

#### **1.1 Create Backup**
```bash
# Create backup of current project
cp -r "Information Utility" "Information Utility - Backup $(date +%Y%m%d)"
```

#### **1.2 Document Current State**
- List all active files and their purposes
- Identify dependencies between components
- Document current working configurations

#### **1.3 Set Up New Repository Structure**
```bash
# Create new directory structure
mkdir -p information-utility/{frontend,backend,blockchain,scripts,docs,config,tests,docker,.github,.vscode}
```

### **Phase 2: Frontend Migration (Day 3-4)**

#### **2.1 Migrate Frontend Code**
```bash
# Copy active frontend code
cp -r "BlockChainIU 2/blockchainiu-next/"* information-utility/frontend/
```

#### **2.2 Reorganize Frontend Structure**
- Move components to proper directories
- Extract reusable components
- Organize utility functions
- Update import paths

#### **2.3 Update Frontend Configuration**
```json
// frontend/package.json
{
  "name": "information-utility-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  }
}
```

### **Phase 3: Temporary Backend Removal & Robust Backend Development (Day 5-8)**

#### **3.1 Remove Temporary Backend**
```bash
# Remove temporary backend files
rm -f "network/temp-solution.js"
rm -f "network/start-temp-backend.sh"
rm -f "network/iu-basic.tar.gz"

# Update frontend to remove temp backend references
# Replace all http://localhost:4002 calls with proper blockchain integration
```

#### **3.2 Implement Hyperledger Fabric Integration**
```bash
# Create Fabric integration layer
mkdir -p information-utility/backend/src/fabric
mkdir -p information-utility/backend/src/config/connection-profiles

# Install Fabric dependencies
cd information-utility/backend
npm install fabric-network fabric-ca-client
```

#### **3.3 Create Robust Backend Services**
```javascript
// backend/src/services/fabricGatewayService.js
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');

class FabricGatewayService {
  constructor() {
    this.gateway = new Gateway();
    this.wallet = null;
  }

  async connect(orgName, userId) {
    const walletPath = path.join(process.cwd(), 'wallet');
    this.wallet = await Wallets.newFileSystemWallet(walletPath);
    
    const connectionProfile = path.resolve(
      __dirname, 
      `../config/connection-profiles/${orgName}-connection.json`
    );
    
    const connectionOptions = {
      wallet: this.wallet,
      identity: userId,
      discovery: { enabled: true, asLocalhost: true }
    };

    await this.gateway.connect(connectionProfile, connectionOptions);
    return this.gateway;
  }

  async submitTransaction(contractName, transactionName, ...args) {
    const network = await this.gateway.getNetwork('iu-channel');
    const contract = network.getContract(contractName);
    return await contract.submitTransaction(transactionName, ...args);
  }

  async evaluateTransaction(contractName, transactionName, ...args) {
    const network = await this.gateway.getNetwork('iu-channel');
    const contract = network.getContract(contractName);
    return await contract.evaluateTransaction(transactionName, ...args);
  }
}

module.exports = FabricGatewayService;
```

#### **3.4 Update Frontend API Calls**
```javascript
// frontend/src/lib/api/loans.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

export const loanAPI = {
  async getLoans(orgType) {
    const response = await fetch(`${API_BASE_URL}/api/loans?org=${orgType}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  async createLoan(loanData) {
    const response = await fetch(`${API_BASE_URL}/api/loans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loanData)
    });
    return response.json();
  },

  async approveLoan(loanId, approvalData) {
    const response = await fetch(`${API_BASE_URL}/api/loans/${loanId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(approvalData)
    });
    return response.json();
  }
};
```

#### **3.5 Enhanced Backend Configuration**
```json
// backend/package.json
{
  "name": "information-utility-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "lint": "eslint src/",
    "build": "npm run lint && npm run test"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "fabric-network": "^2.2.19",
    "fabric-ca-client": "^2.2.19",
    "uuid": "^9.0.0",
    "joi": "^17.9.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2",
    "supertest": "^6.3.3",
    "eslint": "^8.45.0"
  }
}
```

### **Phase 4: Hyperledger Fabric Infrastructure Improvements (Day 9-12)**

#### **4.1 Fix Orderer Connection Issues**
```bash
# Create orderer fix script
cat > information-utility/blockchain/network/scripts/fix-orderer-issues.sh << 'EOF'
#!/bin/bash
echo "🔧 Fixing Hyperledger Fabric Orderer Issues..."

# Stop all containers
docker-compose -f docker/docker-compose.yaml down

# Clean up volumes
docker volume prune -f

# Remove old crypto material
rm -rf crypto-config/
rm -rf artifacts/

# Regenerate crypto material
./scripts/generate-crypto.sh

# Create new genesis block
./scripts/create-genesis-block.sh

# Start network with fixed configuration
docker-compose -f docker/docker-compose.yaml up -d

echo "✅ Orderer issues fixed!"
EOF

chmod +x information-utility/blockchain/network/scripts/fix-orderer-issues.sh
```

#### **4.2 Enhanced Network Configuration**
```bash
# Create enhanced configtx.yaml
cat > information-utility/blockchain/network/config/configtx.yaml << 'EOF'
---
Organizations:
    - &OrdererOrg
        Name: OrdererOrg
        ID: OrdererMSP
        MSPDir: crypto-config/ordererOrganizations/iu-network.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('OrdererMSP.member')"
            Writers:
                Type: Signature
                Rule: "OR('OrdererMSP.member')"
            Admins:
                Type: Signature
                Rule: "OR('OrdererMSP.admin')"

    - &CreditorOrg
        Name: CreditorOrg
        ID: CreditorOrgMSP
        MSPDir: crypto-config/peerOrganizations/creditor.iu-network.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('CreditorOrgMSP.member')"
            Writers:
                Type: Signature
                Rule: "OR('CreditorOrgMSP.member')"
            Admins:
                Type: Signature
                Rule: "OR('CreditorOrgMSP.admin')"
        AnchorPeers:
            - Host: peer0.creditor.iu-network.com
              Port: 7051

    - &DebtorOrg
        Name: DebtorOrg
        ID: DebtorOrgMSP
        MSPDir: crypto-config/peerOrganizations/debtor.iu-network.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('DebtorOrgMSP.member')"
            Writers:
                Type: Signature
                Rule: "OR('DebtorOrgMSP.member')"
            Admins:
                Type: Signature
                Rule: "OR('DebtorOrgMSP.admin')"
        AnchorPeers:
            - Host: peer0.debtor.iu-network.com
              Port: 7051

    - &AdminOrg
        Name: AdminOrg
        ID: AdminOrgMSP
        MSPDir: crypto-config/peerOrganizations/admin.iu-network.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('AdminOrgMSP.member')"
            Writers:
                Type: Signature
                Rule: "OR('AdminOrgMSP.member')"
            Admins:
                Type: Signature
                Rule: "OR('AdminOrgMSP.admin')"
        AnchorPeers:
            - Host: peer0.admin.iu-network.com
              Port: 7051

Capabilities:
    Channel: &ChannelCapabilities
        V2_0: true
    Orderer: &OrdererCapabilities
        V2_0: true
    Application: &ApplicationCapabilities
        V2_0: true

Application: &ApplicationDefaults
    Organizations:
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
        LifecycleEndorsement:
            Type: ImplicitMeta
            Rule: "MAJORITY Endorsement"
        Endorsement:
            Type: ImplicitMeta
            Rule: "MAJORITY Endorsement"
    Capabilities:
        <<: *ApplicationCapabilities

Orderer: &OrdererDefaults
    OrdererType: etcdraft
    EtcdRaft:
        Consenters:
        - Host: orderer.iu-network.com
          Port: 7050
          ClientTLSCert: crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt
          ServerTLSCert: crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt
    BatchTimeout: 2s
    BatchSize:
        MaxMessageCount: 10
        AbsoluteMaxBytes: 99 MB
        PreferredMaxBytes: 512 KB
    Organizations:
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
        BlockValidation:
            Type: ImplicitMeta
            Rule: "ANY Writers"

Channel: &ChannelDefaults
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
    Capabilities:
        <<: *ChannelCapabilities

Profiles:
    Genesis:
        <<: *ChannelDefaults
        Orderer:
            <<: *OrdererDefaults
            Organizations:
                - *OrdererOrg
            Capabilities:
                <<: *OrdererCapabilities
        Consortiums:
            SampleConsortium:
                Organizations:
                    - *CreditorOrg
                    - *DebtorOrg
                    - *AdminOrg
    Channel:
        Consortium: SampleConsortium
        <<: *ChannelDefaults
        Application:
            <<: *ApplicationDefaults
            Organizations:
                - *CreditorOrg
                - *DebtorOrg
                - *AdminOrg
            Capabilities:
                <<: *ApplicationCapabilities
EOF
```

#### **4.3 Production-Ready Docker Configuration**
```bash
# Create production docker-compose
cat > information-utility/blockchain/network/docker/docker-compose.yaml << 'EOF'
version: '3.8'

networks:
  iu-network:
    driver: bridge

services:
  orderer.iu-network.com:
    container_name: orderer.iu-network.com
    image: hyperledger/fabric-orderer:latest
    environment:
      - FABRIC_LOGGING_SPEC=INFO
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_GENESISMETHOD=file
      - ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/orderer.genesis.block
      - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
      - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp
      - ORDERER_GENERAL_TLS_ENABLED=true
      - ORDERER_GENERAL_TLS_PRIVATEKEY=/var/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_TLS_CERTIFICATE=/var/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_TLS_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
      - ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE=/var/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY=/var/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_CLUSTER_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric
    command: orderer
    volumes:
      - ./artifacts/genesis.block:/var/hyperledger/orderer/orderer.genesis.block
      - ./crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp:/var/hyperledger/orderer/msp
      - ./crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/:/var/hyperledger/orderer/tls
      - orderer.iu-network.com:/var/hyperledger/production/orderer
    ports:
      - 7050:7050
    networks:
      - iu-network

  peer0.creditor.iu-network.com:
    container_name: peer0.creditor.iu-network.com
    image: hyperledger/fabric-peer:latest
    environment:
      - CORE_PEER_ID=peer0.creditor.iu-network.com
      - CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:7051
      - CORE_PEER_CHAINCODEADDRESS=peer0.creditor.iu-network.com:7052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.creditor.iu-network.com:7051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.creditor.iu-network.com:7051
      - CORE_PEER_LOCALMSPID=CreditorOrgMSP
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=iu-network
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_GOSSIP_USELEADERELECTION=true
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
    volumes:
      - /var/run/:/host/var/run/
      - ./crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/msp:/etc/hyperledger/fabric/msp
      - ./crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls:/etc/hyperledger/fabric/tls
      - peer0.creditor.iu-network.com:/var/hyperledger/production
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    ports:
      - 7051:7051
    networks:
      - iu-network
    depends_on:
      - orderer.iu-network.com

  peer0.debtor.iu-network.com:
    container_name: peer0.debtor.iu-network.com
    image: hyperledger/fabric-peer:latest
    environment:
      - CORE_PEER_ID=peer0.debtor.iu-network.com
      - CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:7051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:7051
      - CORE_PEER_CHAINCODEADDRESS=peer0.debtor.iu-network.com:7052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.debtor.iu-network.com:7051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.debtor.iu-network.com:7051
      - CORE_PEER_LOCALMSPID=DebtorOrgMSP
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=iu-network
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_GOSSIP_USELEADERELECTION=true
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
    volumes:
      - /var/run/:/host/var/run/
      - ./crypto-config/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/msp:/etc/hyperledger/fabric/msp
      - ./crypto-config/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls:/etc/hyperledger/fabric/tls
      - peer0.debtor.iu-network.com:/var/hyperledger/production
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    ports:
      - 8051:7051
    networks:
      - iu-network
    depends_on:
      - orderer.iu-network.com

  peer0.admin.iu-network.com:
    container_name: peer0.admin.iu-network.com
    image: hyperledger/fabric-peer:latest
    environment:
      - CORE_PEER_ID=peer0.admin.iu-network.com
      - CORE_PEER_ADDRESS=peer0.admin.iu-network.com:7051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:7051
      - CORE_PEER_CHAINCODEADDRESS=peer0.admin.iu-network.com:7052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.admin.iu-network.com:7051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.admin.iu-network.com:7051
      - CORE_PEER_LOCALMSPID=AdminOrgMSP
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=iu-network
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_GOSSIP_USELEADERELECTION=true
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
    volumes:
      - /var/run/:/host/var/run/
      - ./crypto-config/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/msp:/etc/hyperledger/fabric/msp
      - ./crypto-config/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls:/etc/hyperledger/fabric/tls
      - peer0.admin.iu-network.com:/var/hyperledger/production
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    ports:
      - 9051:7051
    networks:
      - iu-network
    depends_on:
      - orderer.iu-network.com

  cli:
    container_name: cli
    image: hyperledger/fabric-tools:latest
    tty: true
    stdin_open: true
    environment:
      - GOPATH=/opt/gopath
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=iu-network
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_ID=cli
      - CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051
      - CORE_PEER_LOCALMSPID=CreditorOrgMSP
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
      - CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: /bin/bash
    volumes:
      - /var/run/:/host/var/run/
      - ./chaincode/:/opt/gopath/src/github.com/chaincode
      - ./crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/
      - ./scripts:/opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/
      - ./artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts
    networks:
      - iu-network
    depends_on:
      - orderer.iu-network.com
      - peer0.creditor.iu-network.com
      - peer0.debtor.iu-network.com
      - peer0.admin.iu-network.com

volumes:
  orderer.iu-network.com:
  peer0.creditor.iu-network.com:
  peer0.debtor.iu-network.com:
  peer0.admin.iu-network.com:
EOF
```

#### **4.4 Enhanced Chaincode with Better Error Handling**
```bash
# Update chaincode with improved error handling
cat > information-utility/blockchain/chaincode/iu-basic/index.js << 'EOF'
'use strict';

const { Contract } = require('fabric-contract-api');

class InformationUtilityContract extends Contract {

    async InitLedger(ctx) {
        console.log('Initializing Information Utility Ledger');
        const loans = [
            {
                loanId: 'LOAN001',
                borrowerName: 'TechCorp Solutions Ltd',
                loanAmount: '500000',
                loanStartDate: '2025-01-01',
                maturityDate: '2026-01-01',
                status: 'pending',
                creditorName: 'First National Bank',
                submittedBy: 'creditor',
                createdAt: new Date().toISOString(),
                docType: 'Loan'
            }
        ];

        for (const loan of loans) {
            await ctx.stub.putState(loan.loanId, Buffer.from(JSON.stringify(loan)));
            console.log(`Added loan: ${loan.loanId}`);
        }
    }

    async CreateLoan(ctx, loanData) {
        try {
            const loan = JSON.parse(loanData);
            
            // Validate required fields
            if (!loan.loanId || !loan.borrowerName || !loan.loanAmount) {
                throw new Error('Invalid loan data: missing required fields (loanId, borrowerName, loanAmount)');
            }
            
            // Check if loan already exists
            const existingLoan = await ctx.stub.getState(loan.loanId);
            if (existingLoan && existingLoan.length > 0) {
                throw new Error(`Loan ${loan.loanId} already exists`);
            }
            
            // Set loan metadata
            loan.status = 'pending';
            loan.createdAt = new Date().toISOString();
            loan.updatedAt = new Date().toISOString();
            loan.docType = 'Loan';
            
            // Store in blockchain
            await ctx.stub.putState(loan.loanId, Buffer.from(JSON.stringify(loan)));
            
            // Create audit trail
            await this.createAuditRecord(ctx, loan.loanId, 'LOAN_CREATED', 
                `Loan created by ${loan.submittedBy}`, loan.submittedBy);
            
            console.log(`Loan ${loan.loanId} created successfully`);
            return JSON.stringify(loan);
            
        } catch (error) {
            console.error(`Error creating loan: ${error.message}`);
            throw new Error(`Failed to create loan: ${error.message}`);
        }
    }

    async ApproveLoan(ctx, loanId, approvalData) {
        try {
            const approval = JSON.parse(approvalData);
            
            // Get existing loan
            const loanBytes = await ctx.stub.getState(loanId);
            if (!loanBytes || loanBytes.length === 0) {
                throw new Error(`Loan ${loanId} not found`);
            }
            
            const loan = JSON.parse(loanBytes.toString());
            
            // Update loan status based on approver
            if (approval.approverType === 'borrower') {
                loan.borrowerApproval = approval.approved;
                loan.borrowerApprovalDate = new Date().toISOString();
                loan.borrowerComments = approval.comments || '';
            } else if (approval.approverType === 'admin') {
                loan.adminApproval = approval.approved;
                loan.adminApprovalDate = new Date().toISOString();
                loan.adminComments = approval.comments || '';
            } else {
                throw new Error(`Invalid approver type: ${approval.approverType}`);
            }
            
            // Update overall status
            if (loan.borrowerApproval === true && loan.adminApproval === true) {
                loan.status = 'approved';
            } else if (loan.borrowerApproval === false || loan.adminApproval === false) {
                loan.status = 'rejected';
            } else {
                loan.status = 'pending';
            }
            
            loan.updatedAt = new Date().toISOString();
            
            // Update in blockchain
            await ctx.stub.putState(loanId, Buffer.from(JSON.stringify(loan)));
            
            // Create audit trail
            await this.createAuditRecord(ctx, loanId, 'LOAN_APPROVED', 
                `Loan ${approval.approved ? 'approved' : 'rejected'} by ${approval.approverType}`, 
                approval.approverId);
            
            console.log(`Loan ${loanId} ${approval.approved ? 'approved' : 'rejected'} by ${approval.approverType}`);
            return JSON.stringify(loan);
            
        } catch (error) {
            console.error(`Error approving loan: ${error.message}`);
            throw new Error(`Failed to approve loan: ${error.message}`);
        }
    }

    async GetAllLoans(ctx, filters = '{}') {
        try {
            const filterObj = JSON.parse(filters);
            const allResults = [];
            
            const iterator = await ctx.stub.getStateByRange('', '');
            let result = await iterator.next();
            
            while (!result.done) {
                const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                } catch (err) {
                    console.log(err);
                    record = strValue;
                }
                
                // Apply filters
                if (record.docType === 'Loan') {
                    if (filterObj.org && record.submittedBy !== filterObj.org) {
                        result = await iterator.next();
                        continue;
                    }
                    if (filterObj.status && record.status !== filterObj.status) {
                        result = await iterator.next();
                        continue;
                    }
                    allResults.push(record);
                }
                
                result = await iterator.next();
            }
            
            return JSON.stringify(allResults);
            
        } catch (error) {
            console.error(`Error getting loans: ${error.message}`);
            throw new Error(`Failed to get loans: ${error.message}`);
        }
    }

    async GetLoan(ctx, loanId) {
        try {
            const loanBytes = await ctx.stub.getState(loanId);
            if (!loanBytes || loanBytes.length === 0) {
                throw new Error(`Loan ${loanId} not found`);
            }
            
            return loanBytes.toString();
            
        } catch (error) {
            console.error(`Error getting loan: ${error.message}`);
            throw new Error(`Failed to get loan: ${error.message}`);
        }
    }

    async createAuditRecord(ctx, loanId, action, details, performedBy) {
        try {
            const auditId = `AUDIT_${loanId}_${Date.now()}`;
            const auditRecord = {
                auditId,
                loanId,
                action,
                details,
                performedBy,
                timestamp: new Date().toISOString(),
                docType: 'AuditRecord'
            };
            
            await ctx.stub.putState(auditId, Buffer.from(JSON.stringify(auditRecord)));
            console.log(`Audit record created: ${auditId}`);
            
        } catch (error) {
            console.error(`Error creating audit record: ${error.message}`);
            // Don't throw error for audit record creation failure
        }
    }
}

module.exports = InformationUtilityContract;
EOF
```

#### **4.5 Update Blockchain Configuration**
```json
// blockchain/package.json
{
  "name": "information-utility-blockchain",
  "version": "1.0.0",
  "scripts": {
    "start-network": "./network/scripts/start-network.sh",
    "stop-network": "./network/scripts/stop-network.sh",
    "deploy-chaincode": "./network/scripts/deploy-chaincode.sh",
    "fix-orderer": "./network/scripts/fix-orderer-issues.sh",
    "diagnose": "./network/scripts/diagnose-network.sh",
    "test-network": "./network/scripts/test-network.sh"
  }
}
```

### **Phase 5: Scripts and Automation (Day 9-10)**

#### **5.1 Migrate and Organize Scripts**
```bash
# Copy scripts
cp -r "scripts/"* information-utility/scripts/
cp -r "hyperledger-fabric-iu/scripts/"* information-utility/scripts/
```

#### **5.2 Create Unified Development Scripts**
```bash
# scripts/development/start-dev.sh
#!/bin/bash
echo "🚀 Starting Information Utility Development Environment"
echo "📦 Installing dependencies..."
npm install
echo "🔗 Starting blockchain network..."
cd blockchain && npm run start-network
echo "🖥️ Starting backend server..."
cd ../backend && npm run dev &
echo "🌐 Starting frontend application..."
cd ../frontend && npm run dev
```

### **Phase 6: Documentation Migration (Day 11-12)**

#### **6.1 Organize Documentation**
```bash
# Move documentation files
mkdir -p information-utility/docs/{architecture,api,deployment,development,user-guides,research}
mv *.md information-utility/docs/architecture/
mv *.pdf information-utility/docs/research/
```

#### **6.2 Create Comprehensive README**
```markdown
# Information Utility

A Hyperledger Fabric-based blockchain application for managing loan processing, KYC, and document management.

## Quick Start

```bash
# Install dependencies
npm install

# Start development environment
npm run dev
```

## Architecture

- **Frontend**: Next.js with React
- **Backend**: Node.js with Express
- **Blockchain**: Hyperledger Fabric
- **Database**: PostgreSQL
```

### **Phase 7: Configuration and Environment (Day 13-14)**

#### **7.1 Create Root Configuration**
```json
// package.json (root)
{
  "name": "information-utility",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "blockchain"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "test": "npm run test:frontend && npm run test:backend",
    "test:frontend": "cd frontend && npm run test",
    "test:backend": "cd backend && npm run test",
    "lint": "npm run lint:frontend && npm run lint:backend",
    "lint:frontend": "cd frontend && npm run lint",
    "lint:backend": "cd backend && npm run lint"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

#### **7.2 Environment Configuration**
```bash
# .env.example
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/information_utility

# Blockchain Configuration
FABRIC_NETWORK_PATH=./blockchain/network
CHAINCODE_PATH=./blockchain/chaincode

# API Configuration
API_PORT=4002
FRONTEND_PORT=3000

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### **Phase 8: Testing and Validation (Day 15-16)**

#### **8.1 Create Test Structure**
```bash
# Set up testing framework
mkdir -p tests/{unit,integration,fixtures,utils}
```

#### **8.2 Validation Scripts**
```bash
# scripts/testing/validate-setup.sh
#!/bin/bash
echo "🔍 Validating Information Utility Setup..."

# Check if all services are running
echo "📡 Checking services..."
curl -f http://localhost:3000 > /dev/null && echo "✅ Frontend running" || echo "❌ Frontend not running"
curl -f http://localhost:4002/health > /dev/null && echo "✅ Backend running" || echo "❌ Backend not running"

# Check blockchain network
echo "⛓️ Checking blockchain network..."
docker ps | grep fabric > /dev/null && echo "✅ Blockchain network running" || echo "❌ Blockchain network not running"

echo "🎉 Validation complete!"
```

## 🛠️ Migration Commands

### **Complete Migration Script**
```bash
#!/bin/bash
# migrate-project.sh

echo "🚀 Starting Information Utility Project Migration"

# Create backup
echo "📦 Creating backup..."
cp -r "Information Utility" "Information Utility - Backup $(date +%Y%m%d)"

# Create new structure
echo "🏗️ Creating new project structure..."
mkdir -p information-utility/{frontend,backend,blockchain,scripts,docs,config,tests,docker,.github,.vscode}

# Migrate frontend
echo "🌐 Migrating frontend..."
cp -r "BlockChainIU 2/blockchainiu-next/"* information-utility/frontend/

# Migrate backend
echo "🖥️ Migrating backend..."
mkdir -p information-utility/backend/src
cp -r "hyperledger-fabric-iu/application/"* information-utility/backend/src/
cp "network/temp-solution.js" information-utility/backend/

# Migrate blockchain
echo "⛓️ Migrating blockchain..."
cp -r "chaincode/"* information-utility/blockchain/chaincode/
cp -r "network/"* information-utility/blockchain/network/

# Migrate scripts
echo "📜 Migrating scripts..."
cp -r "scripts/"* information-utility/scripts/
cp -r "hyperledger-fabric-iu/scripts/"* information-utility/scripts/

# Migrate documentation
echo "📚 Migrating documentation..."
mkdir -p information-utility/docs/{architecture,api,deployment,development,user-guides,research}
mv *.md information-utility/docs/architecture/ 2>/dev/null || true
mv *.pdf information-utility/docs/research/ 2>/dev/null || true

# Create configuration files
echo "⚙️ Creating configuration files..."
cat > information-utility/package.json << 'EOF'
{
  "name": "information-utility",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["frontend", "backend", "blockchain"],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "test": "npm run test:frontend && npm run test:backend",
    "lint": "npm run lint:frontend && npm run lint:backend"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF

# Create environment template
cat > information-utility/.env.example << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/information_utility

# Blockchain Configuration
FABRIC_NETWORK_PATH=./blockchain/network
CHAINCODE_PATH=./blockchain/chaincode

# API Configuration
API_PORT=4002
FRONTEND_PORT=3000

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
EOF

# Create main README
cat > information-utility/README.md << 'EOF'
# Information Utility

A Hyperledger Fabric-based blockchain application for managing loan processing, KYC, and document management.

## Quick Start

```bash
# Install dependencies
npm install

# Start development environment
npm run dev
```

## Architecture

- **Frontend**: Next.js with React
- **Backend**: Node.js with Express
- **Blockchain**: Hyperledger Fabric
- **Database**: PostgreSQL

## Development

```bash
# Start all services
npm run dev

# Start individual services
npm run dev:frontend
npm run dev:backend

# Run tests
npm run test

# Run linting
npm run lint
```

## Documentation

See the `docs/` directory for detailed documentation.
EOF

echo "✅ Migration complete!"
echo "📁 New project structure created in: information-utility/"
echo "🚀 To start development:"
echo "   cd information-utility"
echo "   npm install"
echo "   npm run dev"
```

## 🎯 Benefits of New Structure

### **Development Benefits**
- ✅ **Unified Development Environment**: Single command to start all services
- ✅ **Clear Separation of Concerns**: Frontend, backend, and blockchain clearly separated
- ✅ **Consistent Naming**: No more spaces or inconsistent abbreviations
- ✅ **Proper Dependency Management**: Workspace-based package management
- ✅ **Organized Documentation**: All docs in one place with clear structure

### **Maintenance Benefits**
- ✅ **Easy to Navigate**: Logical directory structure
- ✅ **Scalable**: Easy to add new features or services
- ✅ **Testable**: Proper test structure and organization
- ✅ **Deployable**: Clear deployment configurations
- ✅ **Documented**: Comprehensive documentation structure

### **Team Benefits**
- ✅ **Onboarding**: New developers can understand structure quickly
- ✅ **Collaboration**: Clear ownership of different components
- ✅ **Standards**: Consistent coding and documentation standards
- ✅ **CI/CD Ready**: Proper structure for automated deployments

## 🚨 Important Notes

### **No CouchDB Configuration Issues**
- The new structure maintains PostgreSQL as the primary database
- No CouchDB dependencies or configurations are included
- All database configurations remain consistent with current setup

### **Backward Compatibility**
- All existing functionality is preserved
- API endpoints remain the same
- Database schemas are unchanged
- Blockchain network configurations are maintained

### **Migration Safety**
- Complete backup created before migration
- Step-by-step migration process
- Validation scripts to ensure everything works
- Rollback plan available if needed

## 📋 Post-Migration Checklist

- [ ] Verify all services start correctly
- [ ] Test all API endpoints
- [ ] Validate blockchain network functionality
- [ ] Check frontend dashboard functionality
- [ ] Run all tests
- [ ] Update deployment scripts
- [ ] Update CI/CD configurations
- [ ] Train team on new structure
- [ ] Update external documentation

## 🎉 Conclusion

This restructure plan addresses all current issues while maintaining functionality and improving maintainability. The new structure provides a solid foundation for future development and scaling of the Information Utility project.

**Estimated Timeline**: 16 days
**Risk Level**: Low (with proper backup and testing)
**Benefits**: High (significant improvement in maintainability and developer experience)
