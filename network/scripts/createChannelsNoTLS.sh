#!/bin/bash

echo "🔧 Creating channels without TLS for testing"

# Step 1: Create financial-operations-channel
echo "=== Creating financial-operations-channel ==="
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID=CreditorMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

echo 'Creating financial-operations-channel...'
peer channel create -o orderer.iu-network.com:7050 -c financial-operations-channel -f ./channel-artifacts/financial-operations-channel.tx --outputBlock ./channel-artifacts/financial-operations-channel.block

echo 'Joining Creditor peer to financial-operations-channel...'
peer channel join -b ./channel-artifacts/financial-operations-channel.block
"

echo "=== Joining Debtor peer to financial-operations-channel ==="
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID=DebtorMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051

echo 'Joining Debtor peer to financial-operations-channel...'
peer channel join -b ./channel-artifacts/financial-operations-channel.block
"

echo "=== Joining Admin peer to financial-operations-channel ==="
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID=AdminMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

echo 'Joining Admin peer to financial-operations-channel...'
peer channel join -b ./channel-artifacts/financial-operations-channel.block
"

# Step 2: Create audit-compliance-channel
echo "=== Creating audit-compliance-channel ==="
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID=AdminMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

echo 'Creating audit-compliance-channel...'
peer channel create -o orderer.iu-network.com:7050 -c audit-compliance-channel -f ./channel-artifacts/audit-compliance-channel.tx --outputBlock ./channel-artifacts/audit-compliance-channel.block

echo 'Joining Admin peer to audit-compliance-channel...'
peer channel join -b ./channel-artifacts/audit-compliance-channel.block
"

echo "=== Joining Creditor peer to audit-compliance-channel ==="
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID=CreditorMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

echo 'Joining Creditor peer to audit-compliance-channel...'
peer channel join -b ./channel-artifacts/audit-compliance-channel.block
"

echo "=== Joining Debtor peer to audit-compliance-channel ==="
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID=DebtorMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051

echo 'Joining Debtor peer to audit-compliance-channel...'
peer channel join -b ./channel-artifacts/audit-compliance-channel.block
"

# Verification
echo "=== Verifying channels ==="
echo "Checking channels from Creditor peer:"
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID=CreditorMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

peer channel list
"

echo "✅ Channel creation process completed!"
