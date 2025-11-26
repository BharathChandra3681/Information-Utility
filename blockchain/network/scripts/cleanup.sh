#!/bin/bash
# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

# =============================================================================
# Script: Complete Cleanup
# =============================================================================
# This script removes all containers, volumes, and generated artifacts

echo "🧹 =============================================="
echo "   CLEANING UP HYPERLEDGER FABRIC NETWORK"
echo "==============================================="

echo "⚠️  This will remove:"
echo "   - All Docker containers"
echo "   - All Docker volumes"
echo "   - All generated crypto materials"
echo "   - All channel artifacts"
echo ""
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cleanup cancelled"
  exit 0
fi

# Stop network if running
echo ""
echo "🛑 Stopping network..."
cd ../docker
docker-compose down -v

# Remove all Fabric containers
echo ""
echo "🗑️  Removing Fabric containers..."
docker rm -f $(docker ps -aq --filter "name=peer") 2>/dev/null
docker rm -f $(docker ps -aq --filter "name=orderer") 2>/dev/null
docker rm -f $(docker ps -aq --filter "name=cli") 2>/dev/null
docker rm -f $(docker ps -aq --filter "name=couchdb") 2>/dev/null

# Remove volumes
echo "🗑️  Removing Docker volumes..."
docker volume prune -f

# Remove generated materials
cd ..
echo "🗑️  Removing generated crypto materials..."
rm -rf organizations/peerOrganizations
rm -rf organizations/ordererOrganizations

echo "🗑️  Removing channel artifacts..."
rm -rf channel-artifacts

# Remove chaincode packages
echo "🗑️  Removing chaincode packages..."
rm -f ../chaincode/iu-unified/iu-unified.tar.gz 2>/dev/null

echo ""
echo "✅ =============================================="
echo "   CLEANUP COMPLETE!"
echo "==============================================="
echo ""
echo "To restart the network from scratch:"
echo "  1. ./1-generate-crypto.sh"
echo "  2. ./2-generate-genesis.sh"
echo "  3. ./3-start-network.sh"
echo "  4. ./4-create-channels.sh"
echo "  5. ./5-join-peers.sh"
echo "  6. ./6-deploy-chaincode.sh"
