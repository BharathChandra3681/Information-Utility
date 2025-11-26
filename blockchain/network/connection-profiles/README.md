# Connection Profiles

This directory contains Hyperledger Fabric connection profiles for each organization in the IU Unified Network.

## What are Connection Profiles?

Connection profiles (also called Common Connection Profiles or CCPs) are JSON files that define how client applications connect to a Hyperledger Fabric network. They contain:

- Peer endpoints
- Orderer endpoints
- Certificate Authority (CA) endpoints
- Channel configurations
- TLS certificate paths
- Organization MSP IDs

## Available Profiles

### 1. Government Organization
**File:** `connection-government.json`
- **MSP ID:** GovernmentMSP
- **Peer:** peer0.government.iu.com:7051
- **CA:** ca.government.iu.com:7054
- **Channels:** governance-channel, financial-operations-channel
- **Role:** Admin + Regulator

### 2. Creditor Organization
**File:** `connection-creditor.json`
- **MSP ID:** CreditorMSP
- **Peer:** peer0.creditor.iu.com:8051
- **CA:** ca.creditor.iu.com:8054
- **Channels:** financial-operations-channel
- **Role:** Lender

### 3. Debtor Organization
**File:** `connection-debtor.json`
- **MSP ID:** DebtorMSP
- **Peer:** peer0.debtor.iu.com:9051
- **CA:** ca.debtor.iu.com:9054
- **Channels:** financial-operations-channel
- **Role:** Borrower

## Usage

### With Fabric SDK (Node.js)

```javascript
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

// Load connection profile
const ccpPath = path.resolve(__dirname, 'connection-profiles', 'connection-government.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

// Create wallet
const walletPath = path.join(process.cwd(), 'wallet');
const wallet = await Wallets.newFileSystemWallet(walletPath);

// Connect to gateway
const gateway = new Gateway();
await gateway.connect(ccp, {
    wallet,
    identity: 'admin',
    discovery: { enabled: true, asLocalhost: true }
});

// Get network and contract
const network = await gateway.getNetwork('financial-operations-channel');
const contract = network.getContract('iu-unified', 'LoanContract');

// Submit transaction
await contract.submitTransaction('createLoan', JSON.stringify(loanData));
```

### With Fabric Gateway SDK (Node.js)

The backend API service already uses these connection profiles internally through the Fabric Gateway SDK.

### Path Resolution

All certificate paths in the connection profiles are **relative** to the `blockchain/network/` directory:

```
blockchain/network/
├── connection-profiles/
│   ├── connection-government.json
│   ├── connection-creditor.json
│   └── connection-debtor.json
└── crypto-config/
    ├── ordererOrganizations/
    └── peerOrganizations/
```

## Configuration Details

### Peer Ports
- Government: 7051
- Creditor: 8051
- Debtor: 9051
- Orderer: 7050

### CA Ports
- Government: 7054
- Creditor: 8054
- Debtor: 9054

### CouchDB Ports (State Database)
- Government: 5984
- Creditor: 6984
- Debtor: 7984

### TLS Configuration

All connections use TLS encryption (`grpcs://` for peers/orderer). The connection profiles reference the TLS CA certificates located in the `crypto-config` directory.

### Channel Access

| Organization | governance-channel | financial-operations-channel |
|--------------|-------------------|----------------------------|
| Government   | ✅ Full Access    | ✅ Full Access (Admin)     |
| Creditor     | ❌ No Access      | ✅ Full Access (Lender)    |
| Debtor       | ❌ No Access      | ✅ Full Access (Borrower)  |

## Using with Backend API

The backend API service (`backend/fabric/gateway.js`) automatically uses these connection profiles when connecting to the blockchain network. No additional configuration needed - it reads the crypto materials directly.

## Environment-Specific Profiles

For different deployment environments, you may need to modify:

1. **URLs**: Change `localhost` to actual hostnames/IPs
2. **Ports**: Adjust if using non-standard port mappings
3. **TLS**: Update certificate paths for different environments
4. **Discovery**: Set `asLocalhost: false` for production

## Troubleshooting

### Connection Timeout
- Verify the network is running: `docker ps`
- Check peer/orderer endpoints are accessible
- Ensure TLS certificates exist in `crypto-config/`

### Certificate Errors
- Regenerate crypto materials: `./scripts/1-generate-crypto.sh`
- Verify certificate paths match the actual file locations

### Channel Not Found
- Ensure channels are created: `./scripts/4-create-channels.sh`
- Verify peer has joined the channel: `./scripts/5-join-peers.sh`

## Security Notes

- Keep connection profiles secure - they contain network topology information
- TLS certificates should be properly managed in production
- Use secrets management for production deployments (e.g., HashiCorp Vault)
- Consider using service mesh (Istio) for production networks

## Related Documentation

- [Backend API Documentation](../../../backend/README.md)
- [Network Deployment Guide](../README.md)
- [Hyperledger Fabric Connection Profile Spec](https://hyperledger.github.io/fabric-sdk-node/release-2.2/tutorial-network-config.html)

---

**Generated**: October 2024
**Network Version**: 1.0.0
