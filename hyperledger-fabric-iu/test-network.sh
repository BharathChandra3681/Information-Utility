#!/bin/bash

# Simple test script to diagnose network startup issues

set -e

echo "=== Financial Information Utility Network Diagnostic ==="
echo "Working directory: $(pwd)"

# Test 1: Check if binaries exist
echo ""
echo "1. Checking Hyperledger Fabric binaries..."
if [ -f "./network/bin/cryptogen" ]; then
    echo "✓ cryptogen binary found"
else
    echo "✗ cryptogen binary NOT found"
fi

if [ -f "./network/bin/configtxgen" ]; then
    echo "✓ configtxgen binary found"
else
    echo "✗ configtxgen binary NOT found"
fi

# Test 2: Check configuration files
echo ""
echo "2. Checking configuration files..."
if [ -f "./network/configtx.yaml" ]; then
    echo "✓ configtx.yaml found"
else
    echo "✗ configtx.yaml NOT found"
fi

if [ -f "./network/crypto-config.yaml" ]; then
    echo "✓ crypto-config.yaml found"
else
    echo "✗ crypto-config.yaml NOT found"
fi

if [ -f "./network/docker-compose.yaml" ]; then
    echo "✓ docker-compose.yaml found"
else
    echo "✗ docker-compose.yaml NOT found"
fi

# Test 3: Test crypto generation
echo ""
echo "3. Testing crypto material generation..."
mkdir -p network/organizations/test-output

export FABRIC_CFG_PATH=${PWD}/network
echo "FABRIC_CFG_PATH set to: $FABRIC_CFG_PATH"

# Try to generate crypto material
echo "Attempting to generate crypto material..."
./network/bin/cryptogen generate --config=./network/crypto-config.yaml --output="network/organizations/test-output"

if [ $? -eq 0 ]; then
    echo "✓ Crypto generation successful"
    ls -la network/organizations/test-output/
else
    echo "✗ Crypto generation failed"
fi

# Test 4: Test configtx generation
echo ""
echo "4. Testing configtx generation..."
mkdir -p network/channel-artifacts

echo "Attempting to generate genesis block..."
./network/bin/configtxgen -profile IUNetworkOrdererGenesis -channelID system-channel -outputBlock ./network/channel-artifacts/test-genesis.block

if [ $? -eq 0 ]; then
    echo "✓ Genesis block generation successful"
else
    echo "✗ Genesis block generation failed"
fi

# Test 5: Docker connectivity
echo ""
echo "5. Testing Docker connectivity..."
docker --version
docker-compose --version

echo ""
echo "=== Diagnostic Complete ==="
