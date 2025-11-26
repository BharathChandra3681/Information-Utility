#!/bin/bash
# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

# =============================================================================
# Script: Stop Network
# =============================================================================
# This script stops and removes all Docker containers

echo "🛑 =============================================="
echo "   STOPPING HYPERLEDGER FABRIC NETWORK"
echo "==============================================="

cd ../docker

echo "🐳 Stopping Docker containers..."
docker-compose down

if [ $? -eq 0 ]; then
  echo "✅ Network stopped successfully"
else
  echo "⚠️  Warning: Some containers may not have stopped cleanly"
fi

echo ""
echo "📊 Remaining Fabric containers:"
docker ps -a --filter "name=peer" --filter "name=orderer" --filter "name=cli" --filter "name=couchdb" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "✅ Network stopped!"
echo ""
echo "💡 To completely clean up, run: ./cleanup.sh"
