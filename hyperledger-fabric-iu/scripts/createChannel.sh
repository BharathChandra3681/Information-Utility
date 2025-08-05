#!/bin/bash

# Create channels for Financial Information Utility

set -e

# Set FABRIC_CFG_PATH to where configtx.yaml is mounted in CLI container
export FABRIC_CFG_PATH=/etc/hyperledger/peercfg

# Channel names
FINANCIAL_CHANNEL="financial-operations-channel"
AUDIT_CHANNEL="audit-compliance-channel"

# Organization paths
CREDITOR_ORG_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com"
DEBTOR_ORG_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com"
ADMIN_ORG_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com"

# Function to set environment variables for each organization
setGlobals() {
    local ORG=$1
    echo "Setting environment variables for $ORG"
    
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
    
    env | grep CORE
}

# Function to create channel
createChannel() {
    local CHANNEL_NAME=$1
    local PROFILE=$2
    
    echo "Creating channel: $CHANNEL_NAME with profile: $PROFILE"
    
    # Generate channel configuration transaction
    # Inside CLI container, configtxgen is available directly
    configtxgen -profile $PROFILE -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME
    
    # Set environment for orderer
    export ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem"
    
    # Set environment for Admin (as channel creator)
    setGlobals 3
    
    # Create the channel
    peer channel create -o orderer.iu-network.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/${CHANNEL_NAME}.tx --tls --cafile $ORDERER_CA
    
    echo "Channel $CHANNEL_NAME created successfully"
}

# Function to join channel
joinChannel() {
    local CHANNEL_NAME=$1
    local ORG=$2
    
    echo "Joining $CHANNEL_NAME with organization $ORG"
    
    setGlobals $ORG
    
    # Join the peer to the channel
    peer channel join -b ${CHANNEL_NAME}.block
    
    echo "Organization $ORG joined $CHANNEL_NAME successfully"
}

# Function to update anchor peers
updateAnchorPeers() {
    local CHANNEL_NAME=$1
    local ORG=$2
    local ORG_NAME=$3
    
    echo "Updating anchor peers for $ORG_NAME in $CHANNEL_NAME"
    
    setGlobals $ORG
    
    # Generate anchor peer update transaction
    configtxgen -profile $4 -outputAnchorPeersUpdate ./channel-artifacts/${ORG_NAME}anchors_${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME -asOrg ${ORG_NAME}MSP
    
    # Update anchor peers
    peer channel update -o orderer.iu-network.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/${ORG_NAME}anchors_${CHANNEL_NAME}.tx --tls --cafile $ORDERER_CA
    
    echo "Anchor peers updated for $ORG_NAME in $CHANNEL_NAME"
}

# Main execution
echo "Creating Financial Information Utility Channels..."

# Create channel artifacts directory
mkdir -p ./channel-artifacts

# Create Financial Operations Channel
echo "=== Creating Financial Operations Channel ==="
createChannel $FINANCIAL_CHANNEL "FinancialOperationsChannel"

# Join all organizations to financial operations channel
joinChannel $FINANCIAL_CHANNEL 1  # Creditor
joinChannel $FINANCIAL_CHANNEL 2  # Debtor
joinChannel $FINANCIAL_CHANNEL 3  # Admin

# Update anchor peers for financial operations channel
updateAnchorPeers $FINANCIAL_CHANNEL 1 "Creditor" "FinancialOperationsChannel"
updateAnchorPeers $FINANCIAL_CHANNEL 2 "Debtor" "FinancialOperationsChannel"
updateAnchorPeers $FINANCIAL_CHANNEL 3 "Admin" "FinancialOperationsChannel"

# Create Audit Compliance Channel
echo "=== Creating Audit Compliance Channel ==="
createChannel $AUDIT_CHANNEL "AuditComplianceChannel"

# Join Admin and Creditor organizations to audit compliance channel
joinChannel $AUDIT_CHANNEL 1  # Creditor
joinChannel $AUDIT_CHANNEL 3  # Admin

# Update anchor peers for audit compliance channel
updateAnchorPeers $AUDIT_CHANNEL 1 "Creditor" "AuditComplianceChannel"
updateAnchorPeers $AUDIT_CHANNEL 3 "Admin" "AuditComplianceChannel"

echo "All channels created successfully!"
echo "Financial Operations Channel: $FINANCIAL_CHANNEL"
echo "Audit Compliance Channel: $AUDIT_CHANNEL"
