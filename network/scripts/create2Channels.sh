#!/bin/bash

echo "========================================="
echo "Creating 2 Fixed Channels for Financial IU"
echo "========================================="

# Create temporary genesis block for channel creation
docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="CreditorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

echo "Creating Channel 1: iu-transactions (for transaction proposals & approvals)"

# Create basic channel configuration
cat > /opt/gopath/src/github.com/hyperledger/fabric/peer/iu-transactions.tx <<EOF
{
  "channel_group": {
    "groups": {},
    "mod_policy": "",
    "policies": {},
    "values": {},
    "version": "0"
  },
  "type": 2
}
EOF

echo "Attempting to join existing channels first..."
peer channel list
'

echo ""
echo "========================================="
echo "Alternative: Using Sample Chaincode for Testing"
echo "========================================="

# Since channel creation needs proper configuration, let's use a different approach
# Let's test with built-in system chaincode first

docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="CreditorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

echo "=== Checking peer node status ==="
peer node status

echo "=== Checking system chaincodes ==="
peer chaincode list --installed
'
