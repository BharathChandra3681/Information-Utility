# Financial Information Utility Network - Startup Guide

## Overview
This guide provides step-by-step instructions to start the Hyperledger Fabric network for the Financial Information Utility project.

## Prerequisites
1. Docker and Docker Compose installed
2. Hyperledger Fabric binaries in `network/bin/`
3. All configuration files present

## Step-by-Step Startup

### Step 1: Diagnose Issues (Recommended)
```bash
chmod +x diagnose-network.sh
./diagnose-network.sh
```

### Step 2: Start Network (Simple)
```bash
chmod +x start-network-simple.sh
./start-network-simple.sh
```

### Step 3: Create Channels
Once the network containers are running, create channels:
```bash
# Execute channel creation in CLI container
docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && chmod +x scripts/createChannel.sh && ./scripts/createChannel.sh"
```

### Step 4: Deploy Chaincode
```bash
# Execute chaincode deployment in CLI container
docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && chmod +x scripts/deployChaincode.sh && ./scripts/deployChaincode.sh"
```

## Common Issues and Solutions

### Issue 1: "Failed to generate crypto material"
**Solution:**
- Ensure `network/bin/cryptogen` has execute permissions
- Check `network/crypto-config.yaml` syntax
- Verify directory permissions

### Issue 2: "Failed to generate genesis block"
**Solution:**
- Check `network/configtx.yaml` for syntax errors
- Ensure `FABRIC_CFG_PATH` is set correctly
- Verify all referenced profiles exist

### Issue 3: "Docker containers fail to start"
**Solution:**
- Check `network/docker-compose.yaml` syntax
- Ensure all required ports are available
- Check Docker daemon is running

### Issue 4: "Channel creation fails"
**Solution:**
- Ensure network containers are running
- Check CLI container has access to required files
- Verify MSP directories are properly mounted

### Issue 5: "MSP not found" errors
**Solution:**
- Regenerate crypto material
- Check volume mounts in docker-compose.yaml
- Verify MSP paths in configtx.yaml

## Manual Commands for Debugging

### Check Container Status
```bash
docker-compose -f network/docker-compose.yaml ps
```

### View Container Logs
```bash
docker logs orderer.iu-network.com
docker logs peer0.creditor.iu-network.com
docker logs cli
```

### Access CLI Container
```bash
docker exec -it cli bash
```

### Clean Up Network
```bash
docker-compose -f network/docker-compose.yaml down --volumes --remove-orphans
docker system prune -f
```

## Network Components

### Organizations
- **Creditor**: Financial institutions providing loans
- **Debtor**: Individuals/entities receiving loans
- **Admin**: Regulatory oversight authority

### Channels
- **financial-operations-channel**: Primary transaction channel
- **audit-compliance-channel**: Regulatory reporting channel

### Ports
- Orderer: 7050
- Creditor Peer: 7051
- Debtor Peer: 8051
- Admin Peer: 9051
- Certificate Authorities: 7054, 8054, 9054

## Success Indicators

Network startup is successful when:
1. All containers are running (status: Up)
2. Genesis block generation completes
3. Channel transaction files are created
4. CLI container can access all organizations

## Next Steps

After successful network startup:
1. Test API endpoints at http://localhost:3000
2. Review chaincode functionality
3. Test financial record creation and retrieval
4. Verify audit compliance features
