#!/bin/bash

# Backend Start Script
# Checks prerequisites and starts the backend server

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Starting IU Unified Backend..."
echo ""

# Check if blockchain network is running
echo "Checking blockchain network..."
if docker ps | grep -q "peer0.government.iu.com"; then
    echo -e "${GREEN}✓ Blockchain network is running${NC}"
else
    echo -e "${RED}✗ Blockchain network is NOT running${NC}"
    echo ""
    echo "Please start the blockchain network first:"
    echo "  cd ../blockchain/network"
    echo "  ./deploy-network.sh"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ Dependencies not installed. Installing...${NC}"
    npm install
fi

# Check if crypto materials exist
CRYPTO_PATH="../blockchain/network/crypto-config"
if [ ! -d "$CRYPTO_PATH" ]; then
    echo -e "${RED}✗ Crypto materials not found at: $CRYPTO_PATH${NC}"
    echo "Please run the blockchain network setup first."
    exit 1
fi

echo ""
echo -e "${GREEN}✓ All prerequisites satisfied${NC}"
echo ""
echo "Starting backend server..."
echo "────────────────────────────────────────"
echo ""

# Start the server
npm start
