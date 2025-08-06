#!/bin/bash

# Set environment variables
export FABRIC_CFG_PATH=${PWD}/network/configtx
export VERBOSE=false

# Network configuration
CHANNEL1_NAME="financial-operations-channel"
CHANNEL2_NAME="audit-compliance-channel"
CHAINCODE_NAME="financial-records"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE="1"

# Print help information
function printHelp() {
    echo "Usage: "
    echo "  network.sh <Mode> [Flags]"
    echo "    <Mode>"
    echo "      - 'up' - Bring up the network"
    echo "      - 'down' - Clear the network"
    echo "      - 'restart' - Restart the network"
    echo "      - 'createChannels' - Create and join channels"
    echo "      - 'deployCC' - Deploy chaincode"
}

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

# Create crypto material
function createCryptoMaterial() {
    echo "Generating crypto material..."
    
    if [ ! -d "network/organizations/peerOrganizations" ]; then
        cryptogen generate --config=./network/crypto-config/crypto-config.yaml --output="network/organizations"
        if [ $? -ne 0 ]; then
            echo "Failed to generate crypto material"
            exit 1
        fi
    fi
    
    echo "✅ Crypto material generated"
}

# Create genesis block
function createGenesisBlock() {
    echo "Creating genesis block..."
    
    mkdir -p network/system-genesis-block
    
    configtxgen -profile IUOrdererGenesis -channelID system-channel -outputBlock ./network/system-genesis-block/genesis.block
    
    if [ $? -ne 0 ]; then
        echo "Failed to create genesis block"
        exit 1
    fi
    
    echo "✅ Genesis block created"
}

# Network operations
function networkUp() {
    echo "🚀 Starting IU Network..."
    
    # Generate certificates if they don't exist
    createCryptoMaterial
    createGenesisBlock
    
    # Start docker containers
    docker-compose -f network/docker/docker-compose-iu.yaml up -d
    
    if [ $? -ne 0 ]; then
        echo "Failed to start network"
        exit 1
    fi
    
    echo "✅ Network started successfully"
    echo ""
    echo "🌐 Network Services:"
    echo "   - Orderer: localhost:7050"
    echo "   - Creditor Peer: localhost:7051"
    echo "   - Debtor Peer: localhost:9051"
    echo "   - Admin Peer: localhost:11051"
}

function networkDown() {
    echo "🛑 Stopping IU Network..."
    
    docker-compose -f network/docker/docker-compose-iu.yaml down --volumes --remove-orphans
    docker rm -f $(docker ps -aq --filter label=service=hyperledger-fabric) 2>/dev/null || true
    docker rmi -f $(docker images -q --filter reference='dev-peer*') 2>/dev/null || true
    docker volume prune -f
    
    # Clean up generated material
    rm -rf network/organizations/peerOrganizations
    rm -rf network/organizations/ordererOrganizations
    rm -rf network/system-genesis-block
    rm -rf client-applications/*/wallet*
    
    echo "✅ Network stopped and cleaned"
}

function createChannels() {
    echo "📡 Creating channels..."
    
    # Create financial operations channel
    configtxgen -profile FinancialOperationsChannel -outputCreateChannelTx ./network/channel-artifacts/${CHANNEL1_NAME}.tx -channelID $CHANNEL1_NAME
    
    # Create audit compliance channel
    configtxgen -profile AuditComplianceChannel -outputCreateChannelTx ./network/channel-artifacts/${CHANNEL2_NAME}.tx -channelID $CHANNEL2_NAME
    
    echo "✅ Channel artifacts created"
}

function deployChaincode() {
    echo "📦 Deploying chaincode..."
    
    # Package chaincode
    peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz --path ./chaincode/financial-records --lang node --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}
    
    if [ $? -ne 0 ]; then
        echo "Failed to package chaincode"
        exit 1
    fi
    
    echo "✅ Chaincode packaged successfully"
}

# Parse command
MODE=$1

case $MODE in
    "up")
        networkUp
        ;;
    "down")
        networkDown
        ;;
    "restart")
        networkDown
        networkUp
        ;;
    "createChannels")
        createChannels
        ;;
    "deployCC")
        deployChaincode
        ;;
    *)
        printHelp
        exit 1
        ;;
esac
