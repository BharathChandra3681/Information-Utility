#!/bin/bash

echo "🔧 Information Utility Chaincode Deployment Script"
echo "=================================================="

CHAINCODE_NAME="iu-chaincode"
CHAINCODE_PATH="../chaincode/iu-chaincode"
VERSION="1.0"
SEQUENCE="1"

echo ""
echo "📦 Step 1: Package Chaincode"
echo "----------------------------"
docker exec cli bash -c "
cd /opt/gopath/src/github.com/hyperledger/fabric/peer
peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz --path ${CHAINCODE_PATH} --lang golang --label ${CHAINCODE_NAME}_${VERSION}
"

echo ""
echo "📤 Step 2: Install Chaincode on All Peers"
echo "------------------------------------------"

# Install on Creditor peer
echo "Installing on Creditor peer..."
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=CreditorMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
"

# Install on Debtor peer
echo "Installing on Debtor peer..."
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=DebtorMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051

peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
"

# Install on Admin peer
echo "Installing on Admin peer..."
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=AdminMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
"

echo ""
echo "🔍 Step 3: Query Installed Chaincode"
echo "------------------------------------"
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=CreditorMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

peer lifecycle chaincode queryinstalled
"

echo ""
echo "⚠️  NOTE: Due to current TLS issues, chaincode deployment will be completed"
echo "after TLS certificate verification is resolved."
echo ""
echo "🎯 NEXT STEPS:"
echo "1. Resolve TLS certificate issues"
echo "2. Complete chaincode approval process"
echo "3. Commit chaincode to channels"
echo "4. Initialize chaincode with test data"
