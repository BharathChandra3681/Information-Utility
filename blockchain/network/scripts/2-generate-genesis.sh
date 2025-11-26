#!/bin/bash
# =============================================================================
# Script 2: Generate Genesis Block and Channel Configurations
# =============================================================================
# This script creates the genesis block and channel transaction files

echo "📦 =============================================="
echo "   GENERATING GENESIS & CHANNEL CONFIGS"
echo "==============================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

export FABRIC_CFG_PATH="${NETWORK_DIR}/config"
export PATH="${NETWORK_DIR}/bin:$PATH"

# Ensure channel-artifacts directory exists
mkdir -p "${NETWORK_DIR}/channel-artifacts"

# ============================================================================
# Generate genesis block for orderer
# ============================================================================
echo ""
echo "🏗️  Generating genesis block for orderer..."
configtxgen -profile IUOrdererGenesis \
  -channelID system-channel \
  -outputBlock "${NETWORK_DIR}/channel-artifacts/genesis.block"

if [ $? -ne 0 ]; then
  echo "❌ Failed to generate genesis block"
  exit 1
fi
echo "✅ Genesis block generated: genesis.block"

# ============================================================================
# Generate GOVERNANCE CHANNEL transaction
# ============================================================================
echo ""
echo "📊 Generating governance-channel transaction..."
configtxgen -profile GovernanceChannel \
  -outputCreateChannelTx "${NETWORK_DIR}/channel-artifacts/governance-channel.tx" \
  -channelID governance-channel

if [ $? -ne 0 ]; then
  echo "❌ Failed to generate governance-channel transaction"
  exit 1
fi
echo "✅ Governance channel tx generated: governance-channel.tx"

# ============================================================================
# Generate FINANCIAL OPERATIONS CHANNEL transaction
# ============================================================================
echo ""
echo "💰 Generating financial-operations-channel transaction..."
configtxgen -profile FinancialOperationsChannel \
  -outputCreateChannelTx "${NETWORK_DIR}/channel-artifacts/financial-operations-channel.tx" \
  -channelID financial-operations-channel

if [ $? -ne 0 ]; then
  echo "❌ Failed to generate financial-operations-channel transaction"
  exit 1
fi
echo "✅ Financial operations channel tx generated: financial-operations-channel.tx"

# ============================================================================
# Generate Anchor Peer Updates for FINANCIAL OPERATIONS CHANNEL
# ============================================================================
echo ""
echo "⚓ Generating anchor peer updates for financial-operations-channel..."

# Government anchor peer
configtxgen -profile FinancialOperationsChannel \
  -outputAnchorPeersUpdate "${NETWORK_DIR}/channel-artifacts/GovernmentMSPanchors.tx" \
  -channelID financial-operations-channel \
  -asOrg Government

if [ $? -eq 0 ]; then
  echo "  ✅ Government anchor peer update generated"
else
  echo "  ❌ Failed to generate Government anchor peer update"
fi

# Creditor anchor peer
configtxgen -profile FinancialOperationsChannel \
  -outputAnchorPeersUpdate "${NETWORK_DIR}/channel-artifacts/CreditorMSPanchors.tx" \
  -channelID financial-operations-channel \
  -asOrg Creditor

if [ $? -eq 0 ]; then
  echo "  ✅ Creditor anchor peer update generated"
else
  echo "  ❌ Failed to generate Creditor anchor peer update"
fi

# Debtor anchor peer
configtxgen -profile FinancialOperationsChannel \
  -outputAnchorPeersUpdate "${NETWORK_DIR}/channel-artifacts/DebtorMSPanchors.tx" \
  -channelID financial-operations-channel \
  -asOrg Debtor

if [ $? -eq 0 ]; then
  echo "  ✅ Debtor anchor peer update generated"
else
  echo "  ❌ Failed to generate Debtor anchor peer update"
fi

# ============================================================================
# Generate Anchor Peer Update for GOVERNANCE CHANNEL
# ============================================================================
echo ""
echo "⚓ Generating anchor peer update for governance-channel..."

# Government anchor peer (only org on governance channel)
configtxgen -profile GovernanceChannel \
  -outputAnchorPeersUpdate "${NETWORK_DIR}/channel-artifacts/GovernanceGovernmentMSPanchors.tx" \
  -channelID governance-channel \
  -asOrg Government

if [ $? -eq 0 ]; then
  echo "  ✅ Government anchor peer update generated for governance-channel"
else
  echo "  ❌ Failed to generate Government anchor peer update for governance-channel"
fi

echo ""
echo "✅ =============================================="
echo "   GENESIS & CHANNEL CONFIGS COMPLETE!"
echo "==============================================="
echo ""
echo "📋 Generated Artifacts:"
echo "   - genesis.block"
echo "   - governance-channel.tx"
echo "   - financial-operations-channel.tx"
echo "   - Anchor peer updates for all orgs"
echo ""
echo "Next step: Run ./3-start-network.sh"
