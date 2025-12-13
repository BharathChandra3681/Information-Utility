#!/bin/bash
# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

# =============================================================================
# Script 3: Start Hyperledger Fabric Network
# =============================================================================
# This script starts all Docker containers for the network

echo "🚀 =============================================="
echo "   STARTING HYPERLEDGER FABRIC NETWORK"
echo "==============================================="

# Navigate to docker directory
cd "$NETWORK_DIR/docker"

# Start network
echo "🐳 Starting Docker containers..."
docker-compose up -d

if [ $? -ne 0 ]; then
  echo "❌ Failed to start network"
  exit 1
fi

# Wait for containers to start
echo "⏳ Waiting for containers to initialize..."
sleep 10

# Check container status
echo ""
echo "📊 =============================================="
echo "   CONTAINER STATUS"
echo "==============================================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAME|orderer|peer|couchdb|cli"

# Verify all containers are running
RUNNING_COUNT=$(docker ps --filter "name=peer" --filter "name=orderer" --filter "name=cli" --format "{{.Names}}" | wc -l | tr -d ' ')
EXPECTED_COUNT=5  # 1 orderer + 3 peers + 1 cli

if [ "$RUNNING_COUNT" -eq "$EXPECTED_COUNT" ]; then
  echo ""
  echo "✅ All core containers are running!"
else
  echo ""
  echo "⚠️  Warning: Expected $EXPECTED_COUNT containers, but $RUNNING_COUNT are running"
fi

echo ""
echo "✅ =============================================="
echo "   NETWORK STARTED SUCCESSFULLY!"
echo "==============================================="
echo ""
echo "📝 Network Details:"
echo "   🏛️  Orderer:"
echo "      - orderer.iu-network.com:7050"
echo ""
echo "   🏢 Government Peer:"
echo "      - peer0.government.iu-network.com:7051"
echo "      - CouchDB: http://localhost:5984/_utils"
echo ""
echo "   💳 Creditor Peer:"
echo "      - peer0.creditor.iu-network.com:8051"
echo "      - CouchDB: http://localhost:6984/_utils"
echo ""
echo "   💰 Debtor Peer:"
echo "      - peer0.debtor.iu-network.com:9051"
echo "      - CouchDB: http://localhost:7984/_utils"
echo ""
echo "   🔑 CouchDB Credentials: admin/adminpw"
echo ""
echo "Next step: Run ./4-create-channels.sh"
