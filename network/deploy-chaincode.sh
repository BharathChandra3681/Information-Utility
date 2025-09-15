#!/bin/bash

echo "🚀 Starting Chaincode Deployment Process..."

# Set environment variables for CLI
export CORE_PEER_LOCALMSPID=CreditorMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export ORDERER_TLS_ENABLED=true
export ORDERER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem

echo "📋 Step 1: Checking installed chaincode..."
docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && \
export CORE_PEER_LOCALMSPID=CreditorMSP && \
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp && \
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051 && \
export CORE_PEER_TLS_ENABLED=true && \
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt && \
peer lifecycle chaincode queryinstalled"

echo "📋 Step 2: Approving chaincode for CreditorMSP..."
docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && \
export CORE_PEER_LOCALMSPID=CreditorMSP && \
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp && \
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051 && \
export CORE_PEER_TLS_ENABLED=true && \
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt && \
export ORDERER_TLS_ENABLED=true && \
export ORDERER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem && \
peer lifecycle chaincode approveformyorg \
  -o orderer.iu-network.com:7050 \
  --channelID financial-operations-channel \
  --name iu-basic \
  --version 1.0 \
  --package-id iu-basic_1.0:be813d478c6ec60716acf2975b810320b68f136e2b792c4fb32f712ddd009194 \
  --sequence 1 \
  --tls \
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem"

echo "📋 Step 3: Committing chaincode to channel..."
docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && \
export CORE_PEER_LOCALMSPID=CreditorMSP && \
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp && \
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051 && \
export CORE_PEER_TLS_ENABLED=true && \
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt && \
export ORDERER_TLS_ENABLED=true && \
export ORDERER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem && \
peer lifecycle chaincode commit \
  -o orderer.iu-network.com:7050 \
  --channelID financial-operations-channel \
  --name iu-basic \
  --version 1.0 \
  --sequence 1 \
  --tls \
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem \
  --peerAddresses peer0.creditor.iu-network.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt"

echo "📋 Step 4: Verifying chaincode deployment..."
docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && \
export CORE_PEER_LOCALMSPID=CreditorMSP && \
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp && \
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051 && \
export CORE_PEER_TLS_ENABLED=true && \
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt && \
peer lifecycle chaincode querycommitted --channelID financial-operations-channel"

echo "✅ Chaincode deployment completed!"
