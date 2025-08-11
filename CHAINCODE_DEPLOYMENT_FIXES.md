# Chaincode Deployment Fixes Applied

## 🚨 Issue Identified
The error `Error uploading input to container: API error (404): Could not find the file /chaincode/input in container` was caused by:

1. **Path Mapping Mismatch**: The deployment script was using host paths instead of container paths
2. **Wrong Organization Names**: Script was using old organization names (`iu.com` instead of `iu-network.com`)
3. **Incorrect Peer Ports**: Script was using wrong peer port numbers
4. **Host vs Container Execution**: Peer commands were being run from host instead of CLI container

## ✅ Fixes Applied

### 1. **Path Mapping Fixed**
- **Before**: `CC_SRC_PATH="${PWD}/chaincode/iu-basic"` (host path)
- **After**: `CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/iu-basic"` (container path)
- **Before**: `COLLECTIONS_CONFIG="${PWD}/chaincode/iu-basic/collections-config.json"` (host path)
- **After**: `COLLECTIONS_CONFIG="/opt/gopath/src/github.com/chaincode/iu-basic/collections-config.json"` (container path)

### 2. **Organization Names Updated**
- **Before**: `creditororg.iu.com`, `debtororg.iu.com`, `adminorg.iu.com`
- **After**: `creditor.iu-network.com`, `debtor.iu-network.com`, `admin.iu-network.com`
- **Before**: `orderer.iu.com`
- **After**: `orderer.iu-network.com`

### 3. **Peer Ports Corrected**
- **Before**: Creditor: 7051 ✅, Debtor: 9051 ❌, Admin: 11051 ❌
- **After**: Creditor: 7051 ✅, Debtor: 8051 ✅, Admin: 9051 ✅

### 4. **Container Execution Fixed**
- **Before**: All peer commands executed from host (`peer lifecycle chaincode...`)
- **After**: All peer commands executed from CLI container (`docker exec cli peer lifecycle chaincode...`)

## 🔧 Technical Details

### Docker Volume Mounts (from docker-compose.yaml)
```yaml
volumes:
  - ../chaincode:/opt/gopath/src/github.com/chaincode
  - ../chaincode:/chaincode
```

### Container Paths
- **Chaincode Source**: `/opt/gopath/src/github.com/chaincode/iu-basic`
- **Collections Config**: `/opt/gopath/src/github.com/chaincode/iu-basic/collections-config.json`

### Organization Structure
```
network/organizations/
├── ordererOrganizations/
│   └── iu-network.com/
│       └── orderers/orderer.iu-network.com/
└── peerOrganizations/
    ├── creditor.iu-network.com/
    ├── debtor.iu-network.com/
    └── admin.iu-network.com/
```

## 📋 Updated Functions

All functions in `scripts/deployChaincode.sh` now use:
- ✅ Correct organization names
- ✅ Correct peer ports
- ✅ Container paths
- ✅ CLI container execution

### Functions Updated:
1. `packageChaincode()` - Uses container path and CLI container
2. `installChaincode()` - Executes in CLI container
3. `queryInstalled()` - Executes in CLI container
4. `approveForMyOrg()` - Executes in CLI container
5. `checkCommitReadiness()` - Executes in CLI container
6. `commitChaincodeDefinition()` - Executes in CLI container
7. `queryCommitted()` - Executes in CLI container
8. `initLedger()` - Executes in CLI container

## 🚀 Next Steps

The deployment script is now fixed and should work correctly. The key changes ensure:

1. **Path Resolution**: Chaincode paths are resolved within the container where they're properly mounted
2. **Organization Alignment**: All organization references match the actual network configuration
3. **Port Consistency**: Peer addresses use the correct ports from docker-compose.yaml
4. **Container Execution**: All peer operations run in the CLI container with proper environment

## 🧪 Testing

To test the fixes:
1. Ensure the network is running: `./scripts/startNetwork.sh`
2. Run the deployment: `./scripts/deployChaincode.sh`
3. The script should now successfully package, install, and deploy the chaincode

The error about `/chaincode/input` should no longer occur as the paths are now correctly mapped within the container environment. 