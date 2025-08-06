#!/bin/bash

echo "========================================="
echo "Financial Information Utility - Network Status"
echo "========================================="

# Check which channels exist (this will work even without channels)
echo "1. Checking CLI Configuration..."
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=\"CreditorMSP\"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

echo '=== Creditor Peer Status ==='
peer node status
"

echo "========================================="
echo "2. Checking Container Logs for Recent Activity..."
echo "========================================="

echo "=== Orderer Logs (Last 20 lines) ==="
docker logs --tail 20 orderer.iu-network.com

echo -e "\n=== Creditor Peer Logs (Last 20 lines) ==="
docker logs --tail 20 peer0.creditor.iu-network.com

echo -e "\n=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(peer0|orderer|ca)"

echo "========================================="
echo "Network Status Check Complete"
echo "========================================="
