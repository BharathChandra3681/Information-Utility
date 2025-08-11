#!/bin/bash

echo "🔧 Creating and joining # Function to join peer to channel
joinChannel() {
# List channels to verify
echo "=== Verifying channel creation ==="
setPeerGlobals "creditor"
echo "Channels joined by Creditor peer:"
docker exec -e CORE_PEER_TLS_ENABLED=$CORE_PEER_TLS_ENABLED -e CORE_PEER_LOCALMSPID=$CORE_PEER_LOCALMSPID -e CORE_PEER_TLS_ROOTCERT_FILE=$CORE_PEER_TLS_ROOTCERT_FILE -e CORE_PEER_MSPCONFIGPATH=$CORE_PEER_MSPCONFIGPATH -e CORE_PEER_ADDRESS=$CORE_PEER_ADDRESS cli peer channel listCHANNEL_NAME=$1
    local ORG=$2
    
    echo "Joining $ORG peer to $CHANNEL_NAME..."
    setPeerGlobals $ORG
    
    docker exec -e CORE_PEER_TLS_ENABLED=$CORE_PEER_TLS_ENABLED -e CORE_PEER_LOCALMSPID=$CORE_PEER_LOCALMSPID -e CORE_PEER_TLS_ROOTCERT_FILE=$CORE_PEER_TLS_ROOTCERT_FILE -e CORE_PEER_MSPCONFIGPATH=$CORE_PEER_MSPCONFIGPATH -e CORE_PEER_ADDRESS=$CORE_PEER_ADDRESS cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block
}erledger Fabric network"

# Function to set peer environment for each organization
setPeerGlobals() {
    local ORG=$1
    case $ORG in
        "creditor")
            export CORE_PEER_TLS_ENABLED=true
            export CORE_PEER_LOCALMSPID="CreditorMSP"
            export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
            export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
            export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051
            ;;
        "debtor")
            export CORE_PEER_TLS_ENABLED=true
            export CORE_PEER_LOCALMSPID="DebtorMSP"
            export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt
            export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
            export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051
            ;;
        "admin")
            export CORE_PEER_TLS_ENABLED=true
            export CORE_PEER_LOCALMSPID="AdminMSP"
            export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
            export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
            export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051
            ;;
    esac
}

# Function to create channel
createChannel() {
    local CHANNEL_NAME=$1
    echo "Creating channel: $CHANNEL_NAME"
    
    # Set creditor as the channel creator
    setPeerGlobals "creditor"
    
    docker exec -e CORE_PEER_TLS_ENABLED=$CORE_PEER_TLS_ENABLED -e CORE_PEER_LOCALMSPID=$CORE_PEER_LOCALMSPID -e CORE_PEER_TLS_ROOTCERT_FILE=$CORE_PEER_TLS_ROOTCERT_FILE -e CORE_PEER_MSPCONFIGPATH=$CORE_PEER_MSPCONFIGPATH -e CORE_PEER_ADDRESS=$CORE_PEER_ADDRESS cli peer channel create -o orderer.iu-network.com:7050 -c $CHANNEL_NAME -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.tx --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem
}

# Function to join peer to channel
joinChannel() {
    local CHANNEL_NAME=$1
    local ORG=$2
    
    echo "Joining $ORG peer to $CHANNEL_NAME..."
    setPeerGlobals $ORG
    
    docker exec -e CORE_PEER_TLS_ENABLED=$CORE_PEER_TLS_ENABLED 
                -e CORE_PEER_LOCALMSPID=$CORE_PEER_LOCALMSPID 
                -e CORE_PEER_TLS_ROOTCERT_FILE=$CORE_PEER_TLS_ROOTCERT_FILE 
                -e CORE_PEER_MSPCONFIGPATH=$CORE_PEER_MSPCONFIGPATH 
                -e CORE_PEER_ADDRESS=$CORE_PEER_ADDRESS 
                cli peer channel join 
                -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block
}

# First, generate channel transaction files
echo "Generating channel transaction files..."
docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
configtxgen -profile FinancialOperationsChannel -outputCreateChannelTx ./channel-artifacts/financial-operations-channel.tx -channelID financial-operations-channel
configtxgen -profile AuditComplianceChannel -outputCreateChannelTx ./channel-artifacts/audit-compliance-channel.tx -channelID audit-compliance-channel
"

# Create and join financial-operations-channel
echo "=== Creating financial-operations-channel ==="
createChannel "financial-operations-channel"
joinChannel "financial-operations-channel" "creditor"
joinChannel "financial-operations-channel" "debtor" 
joinChannel "financial-operations-channel" "admin"

echo ""
echo "=== Creating audit-compliance-channel ==="
createChannel "audit-compliance-channel"
joinChannel "audit-compliance-channel" "admin"
joinChannel "audit-compliance-channel" "creditor"
joinChannel "audit-compliance-channel" "debtor"

echo ""
echo "✅ All channels created and peers joined successfully!"

# List channels to verify
echo "=== Verifying channel creation ==="
setPeerGlobals "creditor"
echo "Channels joined by Creditor peer:"
docker exec -e CORE_PEER_TLS_ENABLED=$CORE_PEER_TLS_ENABLED 
            -e CORE_PEER_LOCALMSPID=$CORE_PEER_LOCALMSPID 
            -e CORE_PEER_TLS_ROOTCERT_FILE=$CORE_PEER_TLS_ROOTCERT_FILE 
            -e CORE_PEER_MSPCONFIGPATH=$CORE_PEER_MSPCONFIGPATH 
            -e CORE_PEER_ADDRESS=$CORE_PEER_ADDRESS 
            cli peer channel list
