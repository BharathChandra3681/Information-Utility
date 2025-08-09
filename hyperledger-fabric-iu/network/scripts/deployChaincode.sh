#!/bin/bash

echo "🔧 Information Utility Chaincode Deployment Script"
echo "=================================================="

CHAINCODE_NAME="iu-chaincode"
CHAINCODE_PATH="../chaincode/iu-chaincode"
VERSION="1.1"
SEQUENCE="2"
LABEL="${CHAINCODE_NAME}_${VERSION}"
COLL_CONFIG="${CHAINCODE_PATH}/collections_config.json"
CHANNEL1="financial-operations-channel"
CHANNEL2="audit-compliance-channel"
ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem"

echo ""
echo "📦 Step 1: Package Chaincode"
echo "----------------------------"
# Package
 docker exec cli bash -c "
 cd /opt/gopath/src/github.com/hyperledger/fabric/peer
 peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz --path ${CHAINCODE_PATH} --lang golang --label ${LABEL}
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

echo ""
echo "🧾 Step 4: Approve and Commit for ${CHANNEL1} with policy AND('CreditorMSP.peer','DebtorMSP.peer')"
# Query installed to get PACKAGE_ID
PKG_ID=$(docker exec cli bash -c "peer lifecycle chaincode queryinstalled | grep ${LABEL} -n | sed -E 's/Package ID: (.*), Label: .*/\1/g'" | tr -d '\r')
echo "Package ID: ${PKG_ID}"

# Approve for Creditor
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=CreditorMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051
peer lifecycle chaincode approveformyorg -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --channelID ${CHANNEL1} --name ${CHAINCODE_NAME} --version ${VERSION} --sequence ${SEQUENCE} --init-required --signature-policy \"AND('CreditorMSP.peer','DebtorMSP.peer')\" --collections-config ${COLL_CONFIG} --waitForEvent --tls --cafile ${ORDERER_CA} --package-id ${PKG_ID}
"

# Approve for Debtor
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=DebtorMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051
peer lifecycle chaincode approveformyorg -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --channelID ${CHANNEL1} --name ${CHAINCODE_NAME} --version ${VERSION} --sequence ${SEQUENCE} --init-required --signature-policy \"AND('CreditorMSP.peer','DebtorMSP.peer')\" --collections-config ${COLL_CONFIG} --waitForEvent --tls --cafile ${ORDERER_CA} --package-id ${PKG_ID}
"

# Commit on CHANNEL1
docker exec cli bash -c "
peer lifecycle chaincode commit -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --channelID ${CHANNEL1} --name ${CHAINCODE_NAME} --version ${VERSION} --sequence ${SEQUENCE} --init-required --signature-policy \"AND('CreditorMSP.peer','DebtorMSP.peer')\" --collections-config ${COLL_CONFIG} --waitForEvent --tls --cafile ${ORDERER_CA} \
--peerAddresses peer0.creditor.iu-network.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt \
--peerAddresses peer0.debtor.iu-network.com:8051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt
"

echo ""
echo "🧾 Step 5: Approve and Commit for ${CHANNEL2} with policy AND('AdminMSP.peer','CreditorMSP.peer')"
# Approve for Admin
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=AdminMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051
peer lifecycle chaincode approveformyorg -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --channelID ${CHANNEL2} --name ${CHAINCODE_NAME} --version ${VERSION} --sequence ${SEQUENCE} --init-required --signature-policy \"AND('AdminMSP.peer','CreditorMSP.peer')\" --collections-config ${COLL_CONFIG} --waitForEvent --tls --cafile ${ORDERER_CA} --package-id ${PKG_ID}
"

# Approve for Creditor on CHANNEL2
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=CreditorMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051
peer lifecycle chaincode approveformyorg -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --channelID ${CHANNEL2} --name ${CHAINCODE_NAME} --version ${VERSION} --sequence ${SEQUENCE} --init-required --signature-policy \"AND('AdminMSP.peer','CreditorMSP.peer')\" --collections-config ${COLL_CONFIG} --waitForEvent --tls --cafile ${ORDERER_CA} --package-id ${PKG_ID}
"

# Commit on CHANNEL2
docker exec cli bash -c "
peer lifecycle chaincode commit -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --channelID ${CHANNEL2} --name ${CHAINCODE_NAME} --version ${VERSION} --sequence ${SEQUENCE} --init-required --signature-policy \"AND('AdminMSP.peer','CreditorMSP.peer')\" --collections-config ${COLL_CONFIG} --waitForEvent --tls --cafile ${ORDERER_CA} \
--peerAddresses peer0.admin.iu-network.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt \
--peerAddresses peer0.creditor.iu-network.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
"

# Init (if required)
echo ""
echo "🚀 Step 6: Init (if function exists)"
docker exec cli bash -c "
peer chaincode invoke -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --tls --cafile ${ORDERER_CA} -C ${CHANNEL1} -n ${CHAINCODE_NAME} --isInit -c '{"Args":["InitLedger"]}' \
--peerAddresses peer0.creditor.iu-network.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt \
--peerAddresses peer0.debtor.iu-network.com:8051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt
"
