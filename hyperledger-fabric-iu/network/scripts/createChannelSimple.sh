#!/bin/bash

echo "🚀 CREATING CHANNELS - SIMPLIFIED APPROACH"
echo "=========================================="

# Create financial-operations-channel
echo "🏗️ Step 1: Creating financial-operations-channel..."

docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="AdminMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

echo "🔧 Creating financial-operations-channel..."
peer channel create \
    -o orderer.iu-network.com:7050 \
    -c financial-operations-channel \
    -f ./channel-artifacts/financial-operations-channel.tx \
    --outputBlock ./channel-artifacts/financial-operations-channel.block \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem

ls -la ./channel-artifacts/financial-operations-channel.block
echo "✅ financial-operations-channel created!"
'

echo ""
echo "🔗 Step 2: Joining Admin peer to financial-operations-channel..."

docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="AdminMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

echo "👨‍💼 Joining Admin peer..."
peer channel join -b ./channel-artifacts/financial-operations-channel.block
'

echo ""
echo "🔗 Step 3: Joining Creditor peer to financial-operations-channel..."

docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="CreditorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

echo "🏦 Joining Creditor peer..."
peer channel join -b ./channel-artifacts/financial-operations-channel.block
'

echo ""
echo "🔗 Step 4: Joining Debtor peer to financial-operations-channel..."

docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="DebtorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051

echo "🏢 Joining Debtor peer..."
peer channel join -b ./channel-artifacts/financial-operations-channel.block
'

echo ""
echo "📋 Step 5: Verifying channel is active..."

docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="AdminMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

echo "📊 Listing channels on Admin peer:"
peer channel list
'

echo ""
echo "🎯 CHECKING FINAL STATUS..."
