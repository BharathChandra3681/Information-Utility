# Information Utility Project File Structure

## Overview
This document provides a complete hierarchical view of the Information Utility project structure, which encompasses a Hyperledger Fabric-based blockchain network for managing Information Utility (IU) operations including KYC, document management, and loan processing.

## Root Directory Structure

```
Information Utility/
├── BlockChainIU 2/
├── chaincode/
├── hyperledger-fabric-iu/
├── scripts/
├── Documentation Files
└── Configuration Files
```

## Detailed Structure

### 1. BlockChainIU 2/
Next.js-based frontend application for the IU system.

```
BlockChainIU 2/
├── .gitattributes
├── blockchainiu-next/
│   ├── .gitignore
│   ├── cspell.json
│   ├── eslint.config.mjs
│   ├── jsconfig.json
│   ├── next.config.mjs
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── README.md
│   ├── backend/
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   └── src/
│   ├── public/
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   └── src/
│       ├── .DS_Store
│       └── app/
│           ├── page.js
│           └── creditor-dashboard/
│               └── page.js
```

### 2. chaincode/
Smart contracts for the blockchain network.

```
chaincode/
└── [chaincode files for various business logic]
```

### 3. hyperledger-fabric-iu/
Main Hyperledger Fabric implementation directory.

```
hyperledger-fabric-iu/
├── .DS_Store
├── .eslintrc.json
├── .nvmrc
├── diagnose-network.sh
├── MSP-INTEGRATION.md
├── package-lock.json
├── package.json
├── README-Financial.md
├── README.md
├── setup-permissions.sh
├── setup.sh
├── start-network-simple.sh
├── start-network.sh
├── STARTUP_GUIDE.md
├── test-msp.js
├── test-network.sh
├── tsconfig.json
├── validate-nodejs.js
├── application/
├── chaincode/
├── fabric-samples/
├── frontend/
├── network/
├── organizations/
├── scripts/
└── Utility/
```

#### 3.1 application/
Main application layer with Node.js backend services.

```
application/
├── app-financial.js
├── app-iu-updated.js
├── app.js
├── deploy-applications.sh
├── integration-status.sh
├── package.json
├── test-iu-comprehensive.js
├── test.js
├── db/
│   ├── index.js
│   └── schema.sql
├── fabric/
│   └── gateway.js
├── msp-management/
│   ├── msp-manager.js
│   └── msp-routes.js
└── routes/
    ├── documents.js
    └── kyc.js
```

#### 3.2 chaincode/
Smart contract implementations.

```
chaincode/
├── iu-basic/
│   ├── index.js
│   ├── metadata.json
│   ├── package.json
│   └── test/
│       └── contract.test.js
└── loan-processor/
    ├── index.js
    └── package.json
```

#### 3.3 fabric-samples/
Hyperledger Fabric samples and examples.

```
fabric-samples/
├── .editorconfig
├── .gitignore
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CODEOWNERS
├── CONTRIBUTING.md
├── LICENSE
├── MAINTAINERS.md
├── README.md
├── SECURITY.md
├── asset-transfer-abac/
├── asset-transfer-basic/
├── asset-transfer-events/
├── asset-transfer-ledger-queries/
├── asset-transfer-private-data/
├── asset-transfer-sbe/
├── asset-transfer-secured-agreement/
├── auction-dutch/
├── auction-simple/
├── bin/
├── builders/
├── ci/
├── config/
├── full-stack-asset-transfer-guide/
├── hardware-security-module/
├── high-throughput/
├── off_chain_data/
├── test-application/
├── test-network/
├── test-network-k8s/
├── test-network-nano-bash/
├── token-erc-20/
├── token-erc-721/
├── token-erc-1155/
├── token-sdk/
└── token-utxo/
```

#### 3.4 frontend/
Web frontend components.

```
frontend/
├── msp-management.html
└── components/
```

#### 3.5 network/
Hyperledger Fabric network configuration and scripts.

```
network/
├── configtx.yaml
├── core.yaml
├── crypto-config.yaml
├── docker-compose.yaml
├── network.sh
├── orderer.yaml
├── bin/
├── chaincode/
├── channel-artifacts/
├── crypto-config/
├── network/
├── organizations/
├── peercfg/
├── scripts/
├── system-genesis-block/
└── system-genesis-block/
```

#### 3.6 organizations/
Organizational structure for the blockchain network.

```
organizations/
├── fabric-ca/
├── ordererOrganizations/
└── peerOrganizations/
```

#### 3.7 scripts/
Network management and deployment scripts.

```
scripts/
├── createChannel.sh
├── deployChaincode-old.sh
├── deployChaincode.sh
```

#### 3.8 Utility/
Utility functions and additional tools.

```
Utility/
└── hyperledger-fabric-iu/
    └── network/
```

### 4. scripts/
Root-level scripts for network operations.

```
scripts/
├── createChannels.sh
├── deployChaincode.sh
├── startNetwork.sh
├── stopNetwork.sh
└── tests/
    └── testNetwork.sh
```

### 5. Documentation Files
Project documentation and research materials.

```
Documentation Files/
├── Indian IU - network topology.pdf
├── data_scheme.md
├── example-requirements.txt
├── fabric_Network_Structure.md
├── Indian IU Data Scheme.pdf
├── IU Blockchain Architecture.png
├── IU Fabric Network Structure.docx
├── IU Fabric Network Structure.pdf
├── network.sh
├── OverAll Network Structure - IU.docx
├── OverAll Network Structure - IU.pdf
├── overall_network_structure.md
├── Research Proposal Blockchain-IU (2) (1).pdf
├── topology.md
└── Updated Project Workflow.pdf
```

### 6. Configuration Files
System configuration files.

```
Configuration Files/
├── .DS_Store
```

## Key Technology Stack

### Frontend
- **Next.js**: React-based frontend framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **Hyperledger Fabric**: Blockchain framework
- **PostgreSQL**: Database (inferred from schema.sql)

### Blockchain
- **Hyperledger Fabric**: Enterprise blockchain platform
- **Chaincode**: Smart contracts in JavaScript/Go
- **MSP (Membership Service Provider)**: Identity management
- **Channels**: Private blockchain networks

### DevOps & Infrastructure
- **Docker**: Containerization
- **Shell Scripts**: Automation scripts
- **Docker Compose**: Multi-container orchestration

## Network Architecture

The system implements a multi-organization Hyperledger Fabric network with:

1. **Peer Organizations**: admin.iu-network.com, debtor.iu-network.com, creditor.iu-network.com
2. **Orderer Organizations**: Network ordering services
3. **Channels**: Separate channels for different business processes
4. **Chaincode**: Smart contracts for KYC, document management, and loan processing
5. **MSP**: Membership Service Provider for identity management

## Business Logic Components

1. **KYC Management**: Know Your Customer processes
2. **Document Management**: Secure document storage and verification
3. **Loan Processing**: End-to-end loan lifecycle management
4. **Financial Integration**: Integration with financial systems
5. **MSP Integration**: Member service provider management

## File Count Summary
- **Total Directories**: 50+
- **Total Files**: 200+
- **Smart Contracts**: 5+
- **Network Configuration Files**: 20+
- **Script Files**: 30+
- **Documentation Files**: 15+

## Usage Notes
- Use `start-network.sh` to initialize the complete network
- Use `deployChaincode.sh` to deploy smart contracts
- Use `app.js` to start the main application server
- Use `test-network.sh` to run comprehensive tests
- Documentation files provide detailed setup and usage instructions
