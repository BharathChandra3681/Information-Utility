#!/bin/bash

# Test chaincode query
docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && \
export CORE_PEER_LOCALMSPID=CreditorMSP && \
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp && \
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051 && \
export CORE_PEER_TLS_ENABLED=true && \
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt && \
peer chaincode query -C financial-operations-channel -n iu-basic -c '{\"function\":\"GetAllFinancialRecords\",\"Args\":[]}'"
