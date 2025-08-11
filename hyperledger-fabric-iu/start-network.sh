#!/bin/bash

# Start Financial Information Utility Network

set -euo pipefail

NETWORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$NETWORK_DIR"

# Prefer Docker Compose v2
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Error: Docker Compose not found. Install Docker Desktop and ensure 'docker compose' works."
  exit 127
fi

# Preflight checks for Docker
command -v docker >/dev/null 2>&1 || { echo "Error: Docker is not installed or not in PATH. Install Docker Desktop and ensure 'docker' works."; exit 127; }

echo "Starting Financial Information Utility Hyperledger Fabric Network..."
echo "Network Directory: $NETWORK_DIR"

# Function to print status
printStatus() {
    echo ""
    echo "=============================================="
    echo "$1"
    echo "=============================================="
}

# Clean up function
cleanup() {
    echo "Cleaning up previous network..."
    "${COMPOSE_CMD[@]}" -f network/docker-compose.yaml down --volumes --remove-orphans || true
    docker system prune -f || true
    # Remove generated certificates and channel artifacts
    rm -rf network/organizations/peerOrganizations || true
    rm -rf network/organizations/ordererOrganizations || true
    rm -rf network/channel-artifacts || true
    rm -rf application/wallet* || true
    echo "Cleanup completed"
}

# Generate crypto material
generateCrypto() {
    printStatus "GENERATING CRYPTO MATERIAL"
    
    # Create directories
    mkdir -p network/organizations/peerOrganizations
    mkdir -p network/organizations/ordererOrganizations
    mkdir -p network/channel-artifacts
    
    # Generate crypto material using cryptogen
    echo "Generating certificates using cryptogen tool..."
    if [ ! -f "./network/bin/cryptogen" ]; then
        echo "Error: cryptogen binary not found at ./network/bin/cryptogen"
        exit 1
    fi
    
    ./network/bin/cryptogen generate --config=./network/crypto-config.yaml --output="network/organizations"
    
    if [ $? -ne 0 ]; then
        echo "Failed to generate crypto material"
        exit 1
    fi
    
    echo "Crypto material generated successfully"
}

# Generate genesis block and channel configuration
generateChannelArtifacts() {
    printStatus "GENERATING CHANNEL ARTIFACTS"
    
    export FABRIC_CFG_PATH=${PWD}/network
    
    # Verify configtxgen binary exists
    if [ ! -f "./network/bin/configtxgen" ]; then
        echo "Error: configtxgen binary not found at ./network/bin/configtxgen"
        exit 1
    fi
    
    # Verify configtx.yaml exists
    if [ ! -f "./network/configtx.yaml" ]; then
        echo "Error: configtx.yaml not found at ./network/configtx.yaml"
        exit 1
    fi
    
    echo "FABRIC_CFG_PATH: $FABRIC_CFG_PATH"
    
    # Generate genesis block for orderer (no system channel used at runtime)
    echo "Generating genesis block..."
    if ! ./network/bin/configtxgen -profile IUOrdererGenesis -channelID system-channel -outputBlock ./network/channel-artifacts/genesis.block; then
        echo "Error: Failed to generate genesis block"
        exit 1
    fi
    
    # Participation API requires channel genesis blocks (not CreateChannelTx)
    echo "Generating financial operations channel genesis block..."
    if ! ./network/bin/configtxgen -profile FinancialOperationsChannel -outputBlock ./network/channel-artifacts/financial-operations-channel.block -channelID financial-operations-channel; then
        echo "Error: Failed to generate financial operations channel block"
        exit 1
    fi
    
    echo "Generating audit compliance channel genesis block..."
    if ! ./network/bin/configtxgen -profile AuditComplianceChannel -outputBlock ./network/channel-artifacts/audit-compliance-channel.block -channelID audit-compliance-channel; then
        echo "Error: Failed to generate audit compliance channel block"
        exit 1
    fi
    
    # Generate anchor peer update transactions (applied after peers join)
    echo "Generating anchor peer transactions..."
    ./network/bin/configtxgen -profile FinancialOperationsChannel -outputAnchorPeersUpdate ./network/channel-artifacts/CreditorMSPanchors.tx -channelID financial-operations-channel -asOrg CreditorMSP
    ./network/bin/configtxgen -profile FinancialOperationsChannel -outputAnchorPeersUpdate ./network/channel-artifacts/DebtorMSPanchors.tx -channelID financial-operations-channel -asOrg DebtorMSP
    ./network/bin/configtxgen -profile FinancialOperationsChannel -outputAnchorPeersUpdate ./network/channel-artifacts/AdminMSPanchors.tx -channelID financial-operations-channel -asOrg AdminMSP
    
    echo "Channel artifacts generated successfully"
}

# Start the network
startNetwork() {
    printStatus "STARTING DOCKER CONTAINERS"
    echo "Starting Docker containers..."
    "${COMPOSE_CMD[@]}" -f network/docker-compose.yaml up -d
    echo "Waiting for network to start..."
    sleep 5
    echo "Container status:"
    "${COMPOSE_CMD[@]}" -f network/docker-compose.yaml ps
}

# Create channels and join peers (orderer via osnadmin, peers via CLI)
createChannels() {
    printStatus "CREATING CHANNELS"
    echo "Creating channels using Orderer Channel Participation API..."

    local ORDERER_CA_IN_CLI=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/ca.crt
    local ORDERER_TLS_CERT_IN_CLI=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt
    local ORDERER_TLS_KEY_IN_CLI=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.key
    local CHDIR=/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts

    # Wait for admin endpoint to be ready (use TLS client auth)
    echo "Waiting for orderer admin endpoint (7053) to be ready..."
    for i in {1..30}; do
      if docker exec cli bash -lc "osnadmin channel list -o orderer.iu-network.com:7053 --ca-file ${ORDERER_CA_IN_CLI} --client-cert ${ORDERER_TLS_CERT_IN_CLI} --client-key ${ORDERER_TLS_KEY_IN_CLI} >/dev/null 2>&1"; then
        echo "Admin endpoint is ready"
        break
      fi
      sleep 2
      if [ "$i" -eq 30 ]; then
        echo "Error: Orderer admin endpoint not ready"
        exit 1
      fi
    done

    echo "Joining orderer to financial-operations-channel..."
    docker exec cli osnadmin channel join \
      --channelID financial-operations-channel \
      --config-block ${CHDIR}/financial-operations-channel.block \
      --orderer-address orderer.iu-network.com:7053 \
      --ca-file ${ORDERER_CA_IN_CLI} \
      --client-cert ${ORDERER_TLS_CERT_IN_CLI} \
      --client-key ${ORDERER_TLS_KEY_IN_CLI}

    echo "Joining orderer to audit-compliance-channel..."
    docker exec cli osnadmin channel join \
      --channelID audit-compliance-channel \
      --config-block ${CHDIR}/audit-compliance-channel.block \
      --orderer-address orderer.iu-network.com:7053 \
      --ca-file ${ORDERER_CA_IN_CLI} \
      --client-cert ${ORDERER_TLS_CERT_IN_CLI} \
      --client-key ${ORDERER_TLS_KEY_IN_CLI}

    echo "Having peers join channels and update anchors via CLI container..."
    docker exec -e SKIP_ORDERER_JOIN=1 cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && chmod +x scripts/createChannel.sh && ./scripts/createChannel.sh"
}

# Deploy chaincode
deployChaincode() {
    printStatus "DEPLOYING CHAINCODE"
    echo "Installing and instantiating chaincode..."
    # Execute chaincode deployment script entirely within CLI
    docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && chmod +x scripts/deployChaincode.sh && ./scripts/deployChaincode.sh"
}

# Install Node.js dependencies for chaincode
installChaincodeDependendencies() {
    printStatus "INSTALLING CHAINCODE DEPENDENCIES"
    
    echo "Installing Node.js dependencies for chaincode..."
    cd chaincode/iu-basic
    npm install
    cd ../../
}

# Install application dependencies
installAppDependencies() {
    printStatus "INSTALLING APPLICATION DEPENDENCIES"
    
    echo "Installing Node.js dependencies for application..."
    cd application
    npm install
    cd ../
}

# Start the API server
startAPIServer() {
    printStatus "STARTING API SERVER"
    
    echo "Starting Financial Information Utility API server..."
    cd application
    
    # Create wallet directories
    mkdir -p wallet-creditor wallet-debtor wallet-admin
    
    # Start the server in background
    node app-financial.js &
    API_PID=$!
    echo "API server started with PID: $API_PID"
    
    cd ../
    
    sleep 3
    echo "API server should be running on http://localhost:3000"
    echo "Health check: http://localhost:3000/api/health"
    echo "API documentation: http://localhost:3000/api/docs"
}

# Print network information
printNetworkInfo() {
    printStatus "NETWORK INFORMATION"
    
    echo "Financial Information Utility Network is running!"
    echo ""
    echo "Network Components:"
    echo "- Organizations: Creditor, Debtor, Admin"
    echo "- Channels: financial-operations-channel, audit-compliance-channel"
    echo "- Chaincode: iu-basic (Financial Information Utility Contract)"
    echo ""
    echo "Docker Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "API Endpoints:"
    echo "- Health Check: http://localhost:3000/api/health"
    echo "- API Documentation: http://localhost:3000/api/docs"
    echo "- Create Financial Record: POST http://localhost:3000/api/financial-records"
    echo "- Get All Records: GET http://localhost:3000/api/financial-records"
    echo ""
    echo "Network is ready for use!"
}

# Main execution
main() {
    COMMAND=${1:-"up"}
    case $COMMAND in
        up)
            printStatus "STARTING FINANCIAL INFORMATION UTILITY NETWORK"
            cleanup
            generateCrypto
            generateChannelArtifacts
            installChaincodeDependendencies
            installAppDependencies
            startNetwork
            createChannels
            deployChaincode
            startAPIServer
            printNetworkInfo
            ;;
        down)
            printStatus "STOPPING FINANCIAL INFORMATION UTILITY NETWORK"
            cleanup
            echo "Network stopped and cleaned up"
            ;;
        restart)
            printStatus "RESTARTING FINANCIAL INFORMATION UTILITY NETWORK"
            "$0" down
            sleep 2
            "$0" up
            ;;
        *)
            echo "Usage: $0 {up|down|restart}"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
