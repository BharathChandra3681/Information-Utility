#!/bin/bash

# Set environment variables
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="CreditorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

echo "=================== Creating Channel ==================="
peer channel create \
    -o orderer.iu-network.com:7050 \
    -c iuchannel \
    -f ./channel-artifacts/iuchannel.tx \
    --outputBlock ./channel-artifacts/iuchannel.block \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem

echo "=================== Joining Creditor Peer to Channel ==================="
peer channel join -b ./channel-artifacts/iuchannel.block

echo "=================== Joining Debtor Peer to Channel ==================="
export CORE_PEER_LOCALMSPID="DebtorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051

peer channel join -b ./channel-artifacts/iuchannel.block

echo "=================== Joining Admin Peer to Channel ==================="
export CORE_PEER_LOCALMSPID="AdminMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

peer channel join -b ./channel-artifacts/iuchannel.block

echo "=================== Listing Channels ==================="
peer channel list

echo "=================== Channel Creation Complete ==================="
