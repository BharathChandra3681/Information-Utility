#!/bin/bash

# Chaincode deployment script for IU Network

export FABRIC_CFG_PATH=${PWD}/network/configtx
export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/network/organizations/ordererOrganizations/iu.com/orderers/orderer.iu.com/msp/tlscacerts/tlsca.iu.com-cert.pem

CHANNEL1_NAME="financial-operations-channel"
CHANNEL2_NAME="audit-compliance-channel"
CHAINCODE_NAME="financial-records"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE="1"
CC_RUNTIME_LANGUAGE="node"
CC_SRC_PATH="./chaincode/financial-records"
COLLECTIONS_CONFIG="./chaincode/financial-records/collections-config.json"

# Set environment for organization
function setGlobals() {
    local ORG=$1
    
    if [ "$ORG" == "creditor" ]; then
        export CORE_PEER_LOCALMSPID="CreditorOrgMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/network/organizations/peerOrganizations/creditororg.iu.com/peers/peer0.creditororg.iu.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=${PWD}/network/organizations/peerOrganizations/creditororg.iu.com/users/Admin@creditororg.iu.com/msp
        export CORE_PEER_ADDRESS=localhost:7051
    elif [ "$ORG" == "debtor" ]; then
        export CORE_PEER_LOCALMSPID="DebtorOrgMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/network/organizations/peerOrganizations/debtororg.iu.com/peers/peer0.debtororg.iu.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=${PWD}/network/organizations/peerOrganizations/debtororg.iu.com/users/Admin@debtororg.iu.com/msp
        export CORE_PEER_ADDRESS=localhost:9051
    elif [ "$ORG" == "admin" ]; then
        export CORE_PEER_LOCALMSPID="AdminOrgMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/network/organizations/peerOrganizations/adminorg.iu.com/peers/peer0.adminorg.iu.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=${PWD}/network/organizations/peerOrganizations/adminorg.iu.com/users/Admin@adminorg.iu.com/msp
        export CORE_PEER_ADDRESS=localhost:11051
    fi
}

function packageChaincode() {
    echo "📦 Packaging chaincode..."
    
    peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz --path ${CC_SRC_PATH} --lang ${CC_RUNTIME_LANGUAGE} --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to package chaincode"
        exit 1
    fi
    
    echo "✅ Chaincode packaged successfully"
}

function installChaincode() {
    local ORG=$1
    
    echo "💾 Installing chaincode on $ORG peer..."
    
    setGlobals $ORG
    
    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install chaincode on $ORG"
        exit 1
    fi
    
    echo "✅ Chaincode installed on $ORG successfully"
}

function queryInstalled() {
    setGlobals creditor
    
    echo "🔍 Querying installed chaincode..."
    
    peer lifecycle chaincode queryinstalled >&log.txt
    cat log.txt
    
    PACKAGE_ID=$(sed -n "/${CHAINCODE_NAME}_${CHAINCODE_VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
    echo "Package ID: $PACKAGE_ID"
    
    if [ -z "$PACKAGE_ID" ]; then
        echo "❌ Package ID not found"
        exit 1
    fi
    
    export PACKAGE_ID=$PACKAGE_ID
}

function approveForMyOrg() {
    local ORG=$1
    local CHANNEL_NAME=$2
    
    echo "✅ Approving chaincode definition for $ORG on channel $CHANNEL_NAME..."
    
    setGlobals $ORG
    
    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.iu.com --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --package-id $PACKAGE_ID --sequence $CHAINCODE_SEQUENCE --tls --cafile $ORDERER_CA --collections-config $COLLECTIONS_CONFIG
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to approve chaincode for $ORG on $CHANNEL_NAME"
        exit 1
    fi
    
    echo "✅ Chaincode approved for $ORG on $CHANNEL_NAME"
}

function checkCommitReadiness() {
    local CHANNEL_NAME=$1
    
    echo "🔍 Checking commit readiness for channel $CHANNEL_NAME..."
    
    setGlobals creditor
    
    peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --sequence $CHAINCODE_SEQUENCE --tls --cafile $ORDERER_CA --output json --collections-config $COLLECTIONS_CONFIG
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to check commit readiness for $CHANNEL_NAME"
        exit 1
    fi
    
    echo "✅ Commit readiness checked for $CHANNEL_NAME"
}

function commitChaincodeDefinition() {
    local CHANNEL_NAME=$1
    
    echo "🚀 Committing chaincode definition on channel $CHANNEL_NAME..."
    
    setGlobals creditor
    
    peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.iu.com --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --sequence $CHAINCODE_SEQUENCE --tls --cafile $ORDERER_CA --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/network/organizations/peerOrganizations/creditororg.iu.com/peers/peer0.creditororg.iu.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/network/organizations/peerOrganizations/debtororg.iu.com/peers/peer0.debtororg.iu.com/tls/ca.crt --peerAddresses localhost:11051 --tlsRootCertFiles ${PWD}/network/organizations/peerOrganizations/adminorg.iu.com/peers/peer0.adminorg.iu.com/tls/ca.crt --collections-config $COLLECTIONS_CONFIG
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to commit chaincode definition on $CHANNEL_NAME"
        exit 1
    fi
    
    echo "✅ Chaincode definition committed on $CHANNEL_NAME"
}

function queryCommitted() {
    local ORG=$1
    local CHANNEL_NAME=$2
    
    echo "🔍 Querying committed chaincode on $CHANNEL_NAME..."
    
    setGlobals $ORG
    
    peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --cafile $ORDERER_CA
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to query committed chaincode on $CHANNEL_NAME"
        exit 1
    fi
    
    echo "✅ Chaincode committed query successful on $CHANNEL_NAME"
}

function initLedger() {
    local CHANNEL_NAME=$1
    
    echo "🎯 Initializing ledger on channel $CHANNEL_NAME..."
    
    setGlobals creditor
    
    peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.iu.com --tls --cafile $ORDERER_CA -C $CHANNEL_NAME -n $CHAINCODE_NAME --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/network/organizations/peerOrganizations/creditororg.iu.com/peers/peer0.creditororg.iu.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/network/organizations/peerOrganizations/debtororg.iu.com/peers/peer0.debtororg.iu.com/tls/ca.crt -c '{"function":"initLedger","Args":[]}'
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to initialize ledger on $CHANNEL_NAME"
        exit 1
    fi
    
    echo "✅ Ledger initialized on $CHANNEL_NAME"
}

# Main execution
echo "🚀 Starting chaincode deployment process..."

# Step 1: Package chaincode
packageChaincode

# Step 2: Install chaincode on all peers
installChaincode creditor
installChaincode debtor
installChaincode admin

# Step 3: Query installed chaincode to get package ID
queryInstalled

# Step 4: Approve chaincode for all organizations on both channels
echo "📋 Approving chaincode for Financial Operations Channel..."
approveForMyOrg creditor $CHANNEL1_NAME
approveForMyOrg debtor $CHANNEL1_NAME
approveForMyOrg admin $CHANNEL1_NAME

echo "📋 Approving chaincode for Audit Compliance Channel..."
approveForMyOrg creditor $CHANNEL2_NAME
approveForMyOrg debtor $CHANNEL2_NAME
approveForMyOrg admin $CHANNEL2_NAME

# Step 5: Check commit readiness
checkCommitReadiness $CHANNEL1_NAME
checkCommitReadiness $CHANNEL2_NAME

# Step 6: Commit chaincode definition
commitChaincodeDefinition $CHANNEL1_NAME
commitChaincodeDefinition $CHANNEL2_NAME

# Step 7: Query committed chaincode
queryCommitted creditor $CHANNEL1_NAME
queryCommitted creditor $CHANNEL2_NAME

# Step 8: Initialize ledger
initLedger $CHANNEL1_NAME
initLedger $CHANNEL2_NAME

echo "✅ Chaincode deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   - Chaincode: $CHAINCODE_NAME v$CHAINCODE_VERSION"
echo "   - Channels: $CHANNEL1_NAME, $CHANNEL2_NAME"
echo "   - Organizations: CreditorOrg, DebtorOrg, AdminOrg"
echo "   - Private Data Collections: Enabled"

# Clean up
rm -f log.txt
rm -f ${CHAINCODE_NAME}.tar.gz
