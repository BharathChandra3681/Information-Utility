#!/bin/bash

echo "🔧 Creating channels using the correct Hyperledger Fabric approach"

# First, generate channel transaction files with certificates available
echo "Step 1: Generating channel transaction files..."
docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
cp -r /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations ./crypto-config/
cp -r /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations ./crypto-config/
configtxgen -profile FinancialOperationsChannel -outputCreateChannelTx ./channel-artifacts/financial-operations-channel.tx -channelID financial-operations-channel
configtxgen -profile AuditComplianceChannel -outputCreateChannelTx ./channel-artifacts/audit-compliance-channel.tx -channelID audit-compliance-channel
echo 'Channel transaction files generated:'
ls -la ./channel-artifacts/*.tx
"

# Step 2: Create channels and join peers
echo "Step 2: Creating financial-operations-channel and joining peers..."
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=CreditorMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

# Create the channel
peer channel create -o orderer.iu-network.com:7050 -c financial-operations-channel -f ./channel-artifacts/financial-operations-channel.tx --outputBlock ./channel-artifacts/financial-operations-channel.block --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem

# Join Creditor peer
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

echo "Step 3: Creating audit-compliance-channel and joining peers..."
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=AdminMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

# Create the channel
peer channel create -o orderer.iu-network.com:7050 -c audit-compliance-channel -f ./channel-artifacts/audit-compliance-channel.tx --outputBlock ./channel-artifacts/audit-compliance-channel.block --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem

# Join Admin peer
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

echo ""
echo "✅ Channel creation and peer joining complete!"

echo "Step 4: Verifying channels..."
docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=CreditorMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

echo 'Channels joined by Creditor peer:'
peer channel list
"

echo ""
echo "🎉 All channels are now active and ready for transactions!"
