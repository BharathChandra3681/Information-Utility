#!/bin/bash
# =============================================================================
# Script 1: Generate Cryptographic Materials
# =============================================================================
# This script generates certificates and keys for all organizations using cryptogen

echo "🔐 =============================================="
echo "   GENERATING CRYPTOGRAPHIC MATERIALS"
echo "==============================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

# Set environment variables
export FABRIC_CFG_PATH="${NETWORK_DIR}/config"
export PATH="${NETWORK_DIR}/bin:$PATH"

# Create organizations directory if it doesn't exist
mkdir -p "${NETWORK_DIR}/organizations"

# Clean previous crypto materials
echo "🧹 Cleaning previous crypto materials..."
rm -rf "${NETWORK_DIR}/organizations/peerOrganizations"
rm -rf "${NETWORK_DIR}/organizations/ordererOrganizations"

# Generate crypto materials using cryptogen
echo "📝 Generating certificates using cryptogen..."
cryptogen generate --config="${NETWORK_DIR}/config/crypto-config.yaml" --output="${NETWORK_DIR}/organizations"

if [ $? -eq 0 ]; then
  echo "✅ Crypto materials generated successfully"
  echo ""
  echo "📁 Generated Organizations:"
  echo "   - OrdererOrg (orderer.iu-network.com)"
  echo "   - GovernmentMSP (government.iu-network.com)"
  echo "   - CreditorMSP (creditor.iu-network.com)"
  echo "   - DebtorMSP (debtor.iu-network.com)"
  echo ""
else
  echo "❌ Failed to generate crypto materials"
  exit 1
fi

# Create channel-artifacts directory
echo "📦 Creating channel-artifacts directory..."
mkdir -p "${NETWORK_DIR}/channel-artifacts"

echo ""
echo "✅ =============================================="
echo "   CRYPTOGRAPHIC SETUP COMPLETE!"
echo "==============================================="
echo ""
echo "Next step: Run ./2-generate-genesis.sh"
