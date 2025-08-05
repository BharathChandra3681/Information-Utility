# Information Utility Hyperledger Fabric Network (Node.js)

This project implements a **pure Node.js** Hyperledger Fabric blockchain network for an Information Utility system designed to securely manage and share citizen data across government and service organizations.

## 🚀 **Fully Node.js Implementation**

- **Smart Contracts (Chaincode)**: 100% Node.js using `fabric-contract-api`
- **Client Applications**: Node.js with Express.js REST API
- **Development Tools**: Node.js-based testing, linting, and build tools
- **No Go or Java Dependencies**: Everything runs on Node.js runtime

## Architecture Overview

The Information Utility blockchain network consists of:

- **3 Organizations**:
  - `IU-Gov`: Government organization for identity verification and policy management
  - `IU-Data`: Data management organization for secure storage and retrieval
  - `IU-Service`: Service provider organization for citizen services

- **1 Orderer**: Manages transaction ordering and block creation
- **3 Peers**: One peer per organization for transaction validation and ledger maintenance
- **1 Channel**: `iu-channel` for secure communication between organizations

## Features

### Smart Contract (Chaincode) Features
- **Information Record Management**: Create, read, update, and delete citizen information records
- **Access Control**: Grant and revoke access permissions for organizations
- **Data Verification**: Multi-organization verification process
- **Data Types**: Support for Identity, Financial, Educational, and Health records
- **Audit Trail**: Immutable transaction history for all data operations
- **Privacy Controls**: Role-based access with different security levels

### API Features
- RESTful API for easy integration
- Real-time data operations
- Comprehensive error handling
- Health monitoring endpoints

## Project Structure

```
hyperledger-fabric-iu/
├── network/
│   ├── docker-compose.yaml      # Container orchestration
│   ├── configtx.yaml           # Network configuration
│   ├── crypto-config.yaml      # Certificate generation config
│   ├── network.sh              # Network management script
│   └── organizations/          # Generated certificates and configs
├── chaincode/
│   └── iu-basic/               # Information Utility smart contract
│       ├── index.js
│       └── package.json
├── application/
│   ├── app.js                  # REST API server
│   ├── package.json
│   └── wallet/                 # User identities
└── scripts/                    # Utility scripts
```

## Prerequisites

Before running the Information Utility network, ensure you have the following installed:

1. **Node.js & npm** (v16 or higher) - **PRIMARY REQUIREMENT**:
   ```bash
   # Install via Homebrew
   brew install node@16
   
   # Or download from https://nodejs.org/
   node --version  # Should be >= 16.0.0
   npm --version   # Should be >= 8.0.0
   ```

2. **Docker & Docker Compose**:
   ```bash
   # Install Docker Desktop for macOS
   # https://docs.docker.com/desktop/mac/install/
   
   # Verify installation
   docker --version
   docker-compose --version
   ```

3. **Hyperledger Fabric Binaries**:
   ```bash
   # This will be handled automatically by setup.sh
   # Or manually:
   curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.4.0 1.5.0
   ```

## Quick Start

### 1. Initial Setup (Node.js Environment)

```bash
# Make setup script executable
chmod +x setup.sh

# Run automated setup (includes Node.js validation)
./setup.sh
```

This setup script will:
- Validate Node.js version (>=16.0.0)
- Install all Node.js dependencies for chaincode and application
- Download Hyperledger Fabric binaries
- Pull required Docker images including Node.js runtime
- Run tests to ensure everything works

### 2. Start the Network

Navigate to the network directory:
```bash
cd network
```

Start the network:
```bash
./network.sh up
```

Create and join the channel:
```bash
./network.sh channel
```

### 3. Deploy the Node.js Chaincode

```bash
./network.sh deployCC
```

This will:
- Package the Node.js chaincode
- Install it on all peers
- Approve the chaincode definition for all organizations
- Commit the chaincode to the channel

### 4. Start the Node.js Client Application

Navigate to the application directory:
```bash
cd ../application
```

Install dependencies (if not done by setup):
```bash
npm install
```

Start the API server:
```bash
npm start
```

The API will be available at `http://localhost:3000`

## API Usage Examples

### Initialize the Ledger
```bash
curl -X POST http://localhost:3000/api/init
```

### Create an Information Record
```bash
curl -X POST http://localhost:3000/api/records \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "IU003",
    "dataType": "Identity",
    "owner": "CitizenID67890",
    "data": {
      "name": "Jane Smith",
      "aadhaar": "9876-5432-1098",
      "pan": "FGHIJ5678K",
      "dateOfBirth": "1985-06-15",
      "address": "Delhi, India"
    },
    "accessLevel": "restricted",
    "permissions": ["iu-gov", "iu-data"]
  }'
```

### Get All Records
```bash
curl http://localhost:3000/api/records
```

### Get Record by ID
```bash
curl http://localhost:3000/api/records/IU003
```

### Verify a Record
```bash
curl -X POST http://localhost:3000/api/records/IU003/verify \\
  -H "Content-Type: application/json" \\
  -d '{"verifierOrg": "iu-gov"}'
```

### Grant Access to Organization
```bash
curl -X POST http://localhost:3000/api/records/IU003/grant-access \\
  -H "Content-Type: application/json" \\
  -d '{"organization": "iu-service"}'
```

## Network Management

### Start the Network
```bash
cd network
./network.sh up
```

### Stop the Network
```bash
./network.sh down
```

### Restart the Network
```bash
./network.sh restart
```

### View Network Status
```bash
docker ps
```

### View Logs
```bash
# View orderer logs
docker logs orderer.iu-network.com

# View peer logs
docker logs peer0.iu-gov.iu-network.com
docker logs peer0.iu-data.iu-network.com
docker logs peer0.iu-service.iu-network.com
```

## Security Features

### 1. Multi-Organization Consensus
- All transactions require endorsement from multiple organizations
- Consensus mechanism ensures data integrity

### 2. Role-Based Access Control
- Different access levels: `public`, `restricted`, `confidential`
- Organization-specific permissions
- Dynamic access grant/revoke capabilities

### 3. Data Privacy
- Sensitive data encrypted at rest
- Channel-based isolation
- Private data collections support

### 4. Audit Trail
- Immutable transaction history
- Complete data lineage tracking
- Compliance reporting capabilities

## Data Types Supported

### Identity Records
- Aadhaar number
- PAN details
- Voter ID
- Passport information
- Address verification

### Financial Records
- Bank account details
- Credit scores
- Income certificates
- Tax records
- Loan histories

### Educational Records
- Academic certificates
- Professional qualifications
- Skill assessments
- Training records

### Health Records
- Medical histories
- Vaccination records
- Insurance details
- Emergency contacts

## Monitoring and Maintenance

### Health Checks
```bash
curl http://localhost:3000/api/health
```

### Performance Metrics
The network exposes Prometheus metrics on:
- Orderer: `http://localhost:9443/metrics`
- IU-Gov Peer: `http://localhost:9444/metrics`
- IU-Data Peer: `http://localhost:9445/metrics`
- IU-Service Peer: `http://localhost:9446/metrics`

### Backup and Recovery
```bash
# Backup ledger data
docker run --rm -v fabric_peer0.iu-gov.iu-network.com:/backup \\
  alpine tar czf /backup/peer-backup.tar.gz /var/hyperledger/production

# Backup certificates
tar czf crypto-backup.tar.gz organizations/
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 7050, 7051, 8051, 9051, 9443-9446 are available
2. **Docker permissions**: Run docker commands with appropriate permissions
3. **Certificate issues**: Regenerate crypto material using `./network.sh down` then `./network.sh up`

### Debug Mode
Enable verbose logging:
```bash
./network.sh up -v
```

### Clean Start
```bash
./network.sh down
docker system prune -f
./network.sh up
```

## Development

### Adding New Organizations
1. Update `crypto-config.yaml`
2. Modify `configtx.yaml`
3. Update `docker-compose.yaml`
4. Regenerate certificates and restart network

### Chaincode Development (Node.js)
1. Modify `chaincode/iu-basic/index.js`
2. Update version in `package.json`
3. Run tests: `cd chaincode/iu-basic && npm test`
4. Redeploy using `./network.sh deployCC`

### API Extensions (Node.js)
1. Add new routes in `application/app.js`
2. Update client application as needed
3. Test endpoints: `cd application && npm test`

## Node.js Development Environment

### Available npm Scripts

From the root directory, you can use these npm scripts:

```bash
# Complete setup and start
npm run setup          # Initial environment setup
npm start              # Start network, deploy chaincode, and run API
npm run start:network  # Start only the Fabric network
npm run start:app      # Start only the Node.js API

# Testing
npm test               # Run all tests (chaincode + application)
npm run test:chaincode # Test Node.js chaincode only
npm run test:app       # Test Node.js application only

# Code Quality
npm run lint           # Lint all Node.js code
npm run lint:chaincode # Lint chaincode only
npm run lint:app       # Lint application only

# Maintenance
npm run clean          # Clean up Docker containers and volumes
npm run status         # Check Docker container status
npm run logs           # View all container logs

# Dependencies
npm run install:all    # Install all Node.js dependencies
```

### Node.js Development Features

The project is configured with:
- **Node.js 16+**: Modern JavaScript features and optimal Fabric compatibility
- **ESLint**: Code quality and consistency
- **Mocha + Chai**: Testing framework for chaincode
- **NYC**: Code coverage reporting
- **Nodemon**: Development server with auto-reload
- **TypeScript Support**: For better development experience (optional)

### Chaincode Testing

```bash
cd chaincode/iu-basic
npm test              # Run all tests
npm run test:coverage # Run tests with coverage report
```

### Hot Reloading Development

```bash
# Terminal 1: Start network
npm run start:network

# Terminal 2: Start API in development mode
cd application
npx nodemon app.js
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Contact the Information Utility development team
- Check the Hyperledger Fabric documentation: https://hyperledger-fabric.readthedocs.io/

## Roadmap

- [ ] Multi-channel support for different data domains
- [ ] Integration with external identity providers
- [ ] Advanced privacy controls with zero-knowledge proofs
- [ ] Mobile application development
- [ ] Integration with government service portals
- [ ] Automated compliance reporting
- [ ] Performance optimization for high-volume transactions
