#!/bin/bash

# Start Network Script for IU Network

echo "🚀 Starting Information Utility Network..."
echo "=========================================="

# Set environment variables
export FABRIC_CFG_PATH=${PWD}/network/configtx

# Function to check if Docker is running
function checkDocker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker and try again."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to check prerequisites
function checkPrerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check Docker
    checkDocker
    
    # Check if required directories exist
    if [ ! -d "network" ]; then
        echo "❌ Network directory not found. Please ensure you're in the project root."
        exit 1
    fi
    
    if [ ! -d "chaincode" ]; then
        echo "❌ Chaincode directory not found. Please ensure you're in the project root."
        exit 1
    fi
    
    echo "✅ Prerequisites check passed"
}

# Function to generate crypto material
function generateCrypto() {
    echo "🔐 Generating cryptographic material..."
    
    if [ -d "network/organizations/peerOrganizations" ]; then
        echo "⚠️  Crypto material already exists. Skipping generation."
        return 0
    fi
    
    # Generate crypto material using cryptogen
    cryptogen generate --config=./network/crypto-config/crypto-config.yaml --output="network/organizations"
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to generate crypto material"
        exit 1
    fi
    
    echo "✅ Cryptographic material generated"
}

# Function to create genesis block
function createGenesisBlock() {
    echo "⛓️  Creating genesis block..."
    
    if [ -f "network/system-genesis-block/genesis.block" ]; then
        echo "⚠️  Genesis block already exists. Skipping creation."
        return 0
    fi
    
    mkdir -p network/system-genesis-block
    
    configtxgen -profile IUOrdererGenesis -channelID system-channel -outputBlock ./network/system-genesis-block/genesis.block
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create genesis block"
        exit 1
    fi
    
    echo "✅ Genesis block created"
}

# Function to start Docker containers
function startContainers() {
    echo "🐳 Starting Docker containers..."
    
    # Start the network
    docker-compose -f network/docker/docker-compose-iu.yaml up -d
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to start Docker containers"
        exit 1
    fi
    
    echo "✅ Docker containers started"
}

# Function to wait for containers to be ready
function waitForContainers() {
    echo "⏳ Waiting for containers to be ready..."
    
    # Wait for orderer
    echo "   - Waiting for orderer..."
    sleep 10
    
    # Wait for peers
    echo "   - Waiting for peers..."
    sleep 15
    
    echo "✅ Containers are ready"
}

# Function to display network status
function displayNetworkStatus() {
    echo ""
    echo "🌐 Network Status:"
    echo "=================="
    
    # Check container status
    echo "📦 Container Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "label=service=hyperledger-fabric"
    
    echo ""
    echo "🔗 Network Endpoints:"
    echo "   - Orderer:      localhost:7050"
    echo "   - Creditor Peer: localhost:7051"
    echo "   - Debtor Peer:   localhost:9051"
    echo "   - Admin Peer:    localhost:11051"
    
    echo ""
    echo "📊 Operations Endpoints:"
    echo "   - Orderer Ops:   localhost:9443"
    echo "   - Creditor Ops:  localhost:9444"
    echo "   - Debtor Ops:    localhost:9445"
    echo "   - Admin Ops:     localhost:9446"
}

# Function to create channels and deploy chaincode
function setupNetwork() {
    echo "⚙️  Setting up network (channels and chaincode)..."
    
    # Create channels
    echo "📡 Creating channels..."
    ./scripts/createChannels.sh
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create channels"
        exit 1
    fi
    
    # Deploy chaincode
    echo "📦 Deploying chaincode..."
    ./scripts/deployChaincode.sh
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to deploy chaincode"
        exit 1
    fi
    
    echo "✅ Network setup completed"
}

# Main execution
echo "Starting Information Utility Hyperledger Fabric Network"
echo "======================================================"

# Step 1: Check prerequisites
checkPrerequisites

# Step 2: Generate crypto material
generateCrypto

# Step 3: Create genesis block
createGenesisBlock

# Step 4: Start Docker containers
startContainers

# Step 5: Wait for containers
waitForContainers

# Step 6: Display network status
displayNetworkStatus

# Ask user if they want to setup channels and chaincode
echo ""
read -p "🤔 Do you want to create channels and deploy chaincode now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    setupNetwork
else
    echo "⚠️  Skipping network setup. You can run it later with:"
    echo "   ./scripts/createChannels.sh"
    echo "   ./scripts/deployChaincode.sh"
fi

echo ""
echo "🎉 Information Utility Network is ready!"
echo "========================================"
echo ""
echo "📋 Next Steps:"
echo "   1. Start client applications:"
echo "      cd client-applications/creditor-client && npm install && npm start"
echo "      cd client-applications/debtor-client && npm install && npm start"
echo "      cd client-applications/admin-client && npm install && npm start"
echo ""
echo "   2. Access the applications:"
echo "      - Creditor App: http://localhost:3001"
echo "      - Debtor App:   http://localhost:3002"
echo "      - Admin App:    http://localhost:3003"
echo ""
echo "   3. To stop the network: ./scripts/stopNetwork.sh"
