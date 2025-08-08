#!/bin/bash

echo "🔧 Joining peers to existing channels using correct TLS paths"

# Step 1: Join peers to financial-operations-channel (using existing block)
echo "=== Joining peers to financial-operations-channel ==="

echo "Joining Creditor peer to financial-operations-channel..."
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=CreditorMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

peer channel join -b ./channel-artifacts/financial-operations-channel.block
"

echo "Joining Debtor peer to financial-operations-channel..."
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=DebtorMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051

peer channel join -b ./channel-artifacts/financial-operations-channel.block
"

echo "Joining Admin peer to financial-operations-channel..."
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=AdminMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

peer channel join -b ./channel-artifacts/financial-operations-channel.block
"

# Step 2: Join peers to audit-compliance-channel (using existing block)
echo "=== Joining peers to audit-compliance-channel ==="

echo "Joining Admin peer to audit-compliance-channel..."
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=AdminMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

peer channel join -b ./channel-artifacts/audit-compliance-channel.block
"

echo "Joining Creditor peer to audit-compliance-channel..."
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=CreditorMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

peer channel join -b ./channel-artifacts/audit-compliance-channel.block
"

echo "Joining Debtor peer to audit-compliance-channel..."
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=DebtorMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051

peer channel join -b ./channel-artifacts/audit-compliance-channel.block
"

# Verification
echo "=== Verifying channel memberships ==="
echo "Checking channels from Creditor peer:"
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=CreditorMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

echo 'Channels joined by Creditor peer:'
peer channel list
"

echo "✅ Channel joining process completed!"
echo "📊 Both channels should now be operational:"
echo "   • financial-operations-channel (Creditor, Debtor, Admin)"
echo "   • audit-compliance-channel (Admin, Creditor, Debtor)"
