#!/bin/bash

# Comprehensive diagnostic script for Financial Information Utility Network

set -e

echo "=== Financial Information Utility Network Diagnostic ==="
echo "Current directory: $(pwd)"
echo "Date: $(date)"

# Function to print status
printStatus() {
    echo ""
    echo "=============================================="
    echo "$1"
    echo "=============================================="
}

printStatus "1. ENVIRONMENT CHECK"

# Check Docker
if command -v docker &> /dev/null; then
    echo "✓ Docker is installed"
    docker --version
    if docker ps &> /dev/null; then
        echo "✓ Docker daemon is running"
    else
        echo "✗ Docker daemon is not running or accessible"
        exit 1
    fi
else
    echo "✗ Docker is not installed"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✓ Docker Compose is installed"
    docker-compose --version
else
    echo "✗ Docker Compose is not installed"
    exit 1
fi

printStatus "2. FILE STRUCTURE CHECK"

# Check required directories
required_dirs=(
    "network"
    "network/bin"
    "network/organizations"
    "scripts"
    "chaincode"
    "application"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✓ Directory $dir exists"
    else
        echo "✗ Directory $dir missing"
    fi
done

# Check required files
required_files=(
    "network/configtx.yaml"
    "network/crypto-config.yaml"
    "network/docker-compose.yaml"
    "network/bin/cryptogen"
    "network/bin/configtxgen"
    "scripts/createChannel.sh"
    "start-network.sh"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ File $file exists"
    else
        echo "✗ File $file missing"
    fi
done

printStatus "3. CONFIGURATION VALIDATION"

# Validate configtx.yaml syntax
echo "Checking configtx.yaml syntax..."
if ./network/bin/configtxgen -inspectBlock /dev/null &> /dev/null; then
    echo "✓ configtxgen binary works"
else
    echo "✗ configtxgen binary has issues"
fi

# Set FABRIC_CFG_PATH and test profile generation
export FABRIC_CFG_PATH=${PWD}/network
echo "FABRIC_CFG_PATH set to: $FABRIC_CFG_PATH"

# Test configtx profiles
echo "Testing configtx profiles..."
mkdir -p network/test-artifacts

echo "Testing IUNetworkOrdererGenesis profile..."
if ./network/bin/configtxgen -profile IUNetworkOrdererGenesis -channelID test-channel -outputBlock ./network/test-artifacts/test-genesis.block &> /dev/null; then
    echo "✓ IUNetworkOrdererGenesis profile works"
    rm -f ./network/test-artifacts/test-genesis.block
else
    echo "✗ IUNetworkOrdererGenesis profile failed"
    ./network/bin/configtxgen -profile IUNetworkOrdererGenesis -channelID test-channel -outputBlock ./network/test-artifacts/test-genesis.block
fi

echo "Testing FinancialOperationsChannel profile..."
if ./network/bin/configtxgen -profile FinancialOperationsChannel -outputCreateChannelTx ./network/test-artifacts/test-channel.tx -channelID test-channel &> /dev/null; then
    echo "✓ FinancialOperationsChannel profile works"
    rm -f ./network/test-artifacts/test-channel.tx
else
    echo "✗ FinancialOperationsChannel profile failed"
    ./network/bin/configtxgen -profile FinancialOperationsChannel -outputCreateChannelTx ./network/test-artifacts/test-channel.tx -channelID test-channel
fi

printStatus "4. CRYPTO MATERIAL TEST"

# Clean up previous test crypto
rm -rf network/test-crypto
mkdir -p network/test-crypto

echo "Testing crypto generation..."
if ./network/bin/cryptogen generate --config=./network/crypto-config.yaml --output="network/test-crypto" &> /dev/null; then
    echo "✓ Crypto generation successful"
    echo "Generated organizations:"
    ls -la network/test-crypto/
    rm -rf network/test-crypto
else
    echo "✗ Crypto generation failed"
    ./network/bin/cryptogen generate --config=./network/crypto-config.yaml --output="network/test-crypto"
fi

printStatus "5. DOCKER NETWORK TEST"

# Test docker-compose file syntax
echo "Testing docker-compose configuration..."
if docker-compose -f network/docker-compose.yaml config &> /dev/null; then
    echo "✓ docker-compose.yaml syntax is valid"
else
    echo "✗ docker-compose.yaml has syntax errors"
    docker-compose -f network/docker-compose.yaml config
fi

printStatus "6. SUMMARY"

echo "Diagnostic complete. If all checks passed, the network should start successfully."
echo ""
echo "To start the network:"
echo "  ./start-network-simple.sh"
echo ""
echo "Or use the full start script:"
echo "  ./start-network.sh up"

# Clean up test artifacts
rm -rf network/test-artifacts
