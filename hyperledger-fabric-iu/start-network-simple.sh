#!/bin/bash

echo "Starting Financial Information Utility Network..."

# Step 1: Cleanup
echo "1. Cleaning up any existing containers..."
docker-compose -f network/docker-compose.yaml down --volumes --remove-orphans 2>/dev/null || true
docker system prune -f 2>/dev/null || true

# Step 2: Generate crypto material
echo "2. Generating crypto material..."
mkdir -p network/organizations/peerOrganizations
mkdir -p network/organizations/ordererOrganizations
mkdir -p network/channel-artifacts

./network/bin/cryptogen generate --config=./network/crypto-config.yaml --output="network/organizations"
if [ $? -ne 0 ]; then
    echo "Failed to generate crypto material"
    exit 1
fi
echo "Crypto material generated successfully"

# Step 3: Generate channel artifacts
echo "3. Generating channel artifacts..."
export FABRIC_CFG_PATH=${PWD}/network

./network/bin/configtxgen -profile IUNetworkOrdererGenesis -channelID system-channel -outputBlock ./network/channel-artifacts/genesis.block
if [ $? -ne 0 ]; then
    echo "Failed to generate genesis block"
    exit 1
fi

./network/bin/configtxgen -profile FinancialOperationsChannel -outputCreateChannelTx ./network/channel-artifacts/financial-operations-channel.tx -channelID financial-operations-channel
if [ $? -ne 0 ]; then
    echo "Failed to generate financial operations channel transaction"
    exit 1
fi

./network/bin/configtxgen -profile AuditComplianceChannel -outputCreateChannelTx ./network/channel-artifacts/audit-compliance-channel.tx -channelID audit-compliance-channel
if [ $? -ne 0 ]; then
    echo "Failed to generate audit compliance channel transaction"
    exit 1
fi

echo "Channel artifacts generated successfully"

# Step 4: Start network
echo "4. Starting Docker containers..."
docker-compose -f network/docker-compose.yaml up -d
if [ $? -ne 0 ]; then
    echo "Failed to start Docker containers"
    exit 1
fi

echo "Waiting for containers to start..."
sleep 15

echo "Container status:"
docker-compose -f network/docker-compose.yaml ps

echo "Network started successfully!"
echo "Next step: Create channels using CLI container"
