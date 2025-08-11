#!/bin/bash

# Channel creation script for IU Network

export FABRIC_CFG_PATH=${PWD}/network
export PATH=${PWD}/network/bin:$PATH
export CORE_PEER_TLS_ENABLED=false
export ORDERER_CA=${PWD}/network/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/cacerts/ca.iu-network.com-cert.pem

CHANNEL1_NAME="financial-operations-channel"
CHANNEL2_NAME="audit-compliance-channel"

# Set environment for organization
function setGlobals() {
    local ORG=$1
    
    if [ "$ORG" == "creditor" ]; then
        export CORE_PEER_LOCALMSPID="CreditorOrgMSP"
        export CORE_PEER_MSPCONFIGPATH=${PWD}/network/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
        export CORE_PEER_ADDRESS=localhost:7051
    elif [ "$ORG" == "debtor" ]; then
        export CORE_PEER_LOCALMSPID="DebtorOrgMSP"
        export CORE_PEER_MSPCONFIGPATH=${PWD}/network/organizations/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
        export CORE_PEER_ADDRESS=localhost:8051
    elif [ "$ORG" == "admin" ]; then
        export CORE_PEER_LOCALMSPID="AdminOrgMSP"
        export CORE_PEER_MSPCONFIGPATH=${PWD}/network/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
        export CORE_PEER_ADDRESS=localhost:9051
    fi
}

function createChannel() {
    local CHANNEL_NAME=$1
    local PROFILE=$2
    
    echo "📡 Creating channel: $CHANNEL_NAME"
    
    # Create channel artifacts directory
    mkdir -p network/channel-artifacts
    
    # Generate channel configuration transaction
    configtxgen -profile $PROFILE -outputCreateChannelTx ./network/channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to generate channel config tx for $CHANNEL_NAME"
        exit 1
    fi
    
    # Set globals for creditor org (channel creator)
    setGlobals creditor
    
    # Create channel
    peer channel create -o localhost:7050 -c $CHANNEL_NAME --ordererTLSHostnameOverride orderer.iu-network.com -f ./network/channel-artifacts/${CHANNEL_NAME}.tx --outputBlock ./network/channel-artifacts/${CHANNEL_NAME}.block
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create channel $CHANNEL_NAME"
        exit 1
    fi
    
    echo "✅ Channel $CHANNEL_NAME created successfully"
}

function joinChannel() {
    local ORG=$1
    local CHANNEL_NAME=$2
    
    echo "🔗 Joining $ORG to channel: $CHANNEL_NAME"
    
    setGlobals $ORG
    
    peer channel join -b ./network/channel-artifacts/${CHANNEL_NAME}.block
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to join $ORG to channel $CHANNEL_NAME"
        exit 1
    fi
    
    echo "✅ $ORG joined channel $CHANNEL_NAME successfully"
}

function updateAnchorPeers() {
    local ORG=$1
    local CHANNEL_NAME=$2
    local ORG_MSP=""
    
    if [ "$ORG" == "creditor" ]; then
        ORG_MSP="CreditorOrgMSP"
    elif [ "$ORG" == "debtor" ]; then
        ORG_MSP="DebtorOrgMSP"
    elif [ "$ORG" == "admin" ]; then
        ORG_MSP="AdminOrgMSP"
    fi
    
    echo "⚓ Updating anchor peers for $ORG_MSP on channel $CHANNEL_NAME"
    
    configtxgen -profile FinancialOperationsChannel -outputAnchorPeersUpdate ./network/channel-artifacts/${ORG_MSP}anchors_${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME -asOrg $ORG_MSP
    
    setGlobals $ORG
    
    peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.iu-network.com -c $CHANNEL_NAME -f ./network/channel-artifacts/${ORG_MSP}anchors_${CHANNEL_NAME}.tx
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to update anchor peers for $ORG_MSP"
        exit 1
    fi
    
    echo "✅ Anchor peers updated for $ORG_MSP"
}

# Main execution
echo "🚀 Starting channel creation process..."

# Create Financial Operations Channel
createChannel $CHANNEL1_NAME "FinancialOperationsChannel"

# Join all organizations to Financial Operations Channel
joinChannel creditor $CHANNEL1_NAME
joinChannel debtor $CHANNEL1_NAME
joinChannel admin $CHANNEL1_NAME

# Update anchor peers for Financial Operations Channel
updateAnchorPeers creditor $CHANNEL1_NAME
updateAnchorPeers debtor $CHANNEL1_NAME
updateAnchorPeers admin $CHANNEL1_NAME

# Create Audit Compliance Channel
createChannel $CHANNEL2_NAME "AuditComplianceChannel"

# Join all organizations to Audit Compliance Channel
joinChannel creditor $CHANNEL2_NAME
joinChannel debtor $CHANNEL2_NAME
joinChannel admin $CHANNEL2_NAME

# Update anchor peers for Audit Compliance Channel
updateAnchorPeers creditor $CHANNEL2_NAME
updateAnchorPeers debtor $CHANNEL2_NAME
updateAnchorPeers admin $CHANNEL2_NAME

echo "✅ All channels created and configured successfully!"
echo ""
echo "📋 Channel Summary:"
echo "   - $CHANNEL1_NAME: Creditor, Debtor, Admin"
echo "   - $CHANNEL2_NAME: Creditor, Debtor, Admin"
