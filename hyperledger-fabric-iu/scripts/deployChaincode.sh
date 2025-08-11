#!/bin/bash

# Deploy chaincode to Financial Information Utility Network

set -e

CHANNEL_NAME=${CHANNEL_NAME:-financial-operations-channel}
CHAINCODE_NAME=${CHAINCODE_NAME:-iu-basic}
CHAINCODE_VERSION=${CHAINCODE_VERSION:-1.1}
CHAINCODE_SEQUENCE=${CHAINCODE_SEQUENCE:-2}
CC_SRC_PATH="../chaincode/iu-basic"
CC_RUNTIME_LANGUAGE="node"

export FABRIC_CFG_PATH=$PWD/../configtx

# Organization paths
CREDITOR_ORG_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com"
DEBTOR_ORG_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com"
ADMIN_ORG_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com"

# Set environment variables for organizations
setGlobals() {
    local ORG=$1
    echo "Setting environment variables for Organization $ORG"
    
    if [ $ORG -eq 1 ]; then
        export CORE_PEER_LOCALMSPID="CreditorMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=$CREDITOR_ORG_PATH/peers/peer0.creditor.iu-network.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=$CREDITOR_ORG_PATH/users/Admin@creditor.iu-network.com/msp
        export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051
    elif [ $ORG -eq 2 ]; then
        export CORE_PEER_LOCALMSPID="DebtorMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=$DEBTOR_ORG_PATH/peers/peer0.debtor.iu-network.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=$DEBTOR_ORG_PATH/users/Admin@debtor.iu-network.com/msp
        export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051
    elif [ $ORG -eq 3 ]; then
        export CORE_PEER_LOCALMSPID="AdminMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=$ADMIN_ORG_PATH/peers/peer0.admin.iu-network.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=$ADMIN_ORG_PATH/users/Admin@admin.iu-network.com/msp
        export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051
    fi
}

# Package chaincode
packageChaincode() {
    echo "Packaging chaincode..."
    setGlobals 1
    peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz --path ${CC_SRC_PATH} --lang ${CC_RUNTIME_LANGUAGE} --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}
    echo "Chaincode packaged successfully"
}

# Install chaincode on peer
installChaincode() {
    local ORG=$1
    echo "Installing chaincode on Organization $ORG"
    setGlobals $ORG
    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
    echo "Chaincode installed on Organization $ORG"
}

# Query installed chaincode
queryInstalled() {
    local ORG=$1
    setGlobals $ORG
    peer lifecycle chaincode queryinstalled >&log.txt
    cat log.txt
    PACKAGE_ID=$(sed -n "/${CHAINCODE_NAME}_${CHAINCODE_VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
    echo "Package ID: $PACKAGE_ID"
}

# Approve chaincode for organization
approveForMyOrg() {
    local ORG=$1
    echo "Approving chaincode for Organization $ORG"
    setGlobals $ORG
    
    # Replace this with actual package ID from queryInstalled
    queryInstalled $ORG
    
    export ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem"
    
    peer lifecycle chaincode approveformyorg -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --tls --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --package-id $PACKAGE_ID --sequence $CHAINCODE_SEQUENCE
    echo "Chaincode approved for Organization $ORG"
}

# Check commit readiness
checkCommitReadiness() {
    echo "Checking commit readiness..."
    setGlobals 1
    export ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem"
    
    peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --sequence $CHAINCODE_SEQUENCE --output json
}

# Commit chaincode
commitChaincodeDefinition() {
    echo "Committing chaincode definition..."
    setGlobals 1
    export ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem"
    
    peer lifecycle chaincode commit -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --tls --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name $CHAINCODE_NAME \
    --peerAddresses peer0.creditor.iu-network.com:7051 --tlsRootCertFiles $CREDITOR_ORG_PATH/peers/peer0.creditor.iu-network.com/tls/ca.crt \
    --peerAddresses peer0.debtor.iu-network.com:8051 --tlsRootCertFiles $DEBTOR_ORG_PATH/peers/peer0.debtor.iu-network.com/tls/ca.crt \
    --peerAddresses peer0.admin.iu-network.com:9051 --tlsRootCertFiles $ADMIN_ORG_PATH/peers/peer0.admin.iu-network.com/tls/ca.crt \
    --version $CHAINCODE_VERSION --sequence $CHAINCODE_SEQUENCE
    
    echo "Chaincode committed successfully"
}

# Query committed chaincode
queryCommitted() {
    echo "Querying committed chaincode..."
    setGlobals 1
    peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name $CHAINCODE_NAME
}

# Initialize chaincode
initChaincode() {
    echo "Initializing chaincode..."
    setGlobals 1
    export ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem"
    
    peer chaincode invoke -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --tls --cafile $ORDERER_CA -C $CHANNEL_NAME -n $CHAINCODE_NAME \
    --peerAddresses peer0.creditor.iu-network.com:7051 --tlsRootCertFiles $CREDITOR_ORG_PATH/peers/peer0.creditor.iu-network.com/tls/ca.crt \
    --peerAddresses peer0.debtor.iu-network.com:8051 --tlsRootCertFiles $DEBTOR_ORG_PATH/peers/peer0.debtor.iu-network.com/tls/ca.crt \
    --peerAddresses peer0.admin.iu-network.com:9051 --tlsRootCertFiles $ADMIN_ORG_PATH/peers/peer0.admin.iu-network.com/tls/ca.crt \
    -c '{"function":"InitLedger","Args":[]}'
    
    echo "Chaincode initialized successfully"
}

# Main execution
echo "Deploying Financial Information Utility Chaincode..."

# Package the chaincode
packageChaincode

# Install chaincode on all organizations
installChaincode 1  # Creditor
installChaincode 2  # Debtor  
installChaincode 3  # Admin

# Approve chaincode for all organizations
approveForMyOrg 1  # Creditor
approveForMyOrg 2  # Debtor
approveForMyOrg 3  # Admin

# Check commit readiness
checkCommitReadiness

# Commit chaincode definition
commitChaincodeDefinition

# Query committed chaincode
queryCommitted

# Initialize the ledger
initChaincode

echo "Chaincode deployment completed successfully!"
echo "Channel: $CHANNEL_NAME"
echo "Chaincode: $CHAINCODE_NAME"
echo "Version: $CHAINCODE_VERSION"
