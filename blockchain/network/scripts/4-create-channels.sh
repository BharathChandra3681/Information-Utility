#!/bin/bash
# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

# =============================================================================
# Script 4: Create Both Channels
# =============================================================================
# This script creates governance-channel and financial-operations-channel

echo "📡 =============================================="
echo "   CREATING BLOCKCHAIN CHANNELS"
echo "==============================================="

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/"${NETWORK_DIR}/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem
export FABRIC_CFG_PATH=${PWD}/../config

# Set peer environment to Government (for channel creation)
export CORE_PEER_LOCALMSPID="GovernmentMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/"${NETWORK_DIR}/organizations/peerOrganizations/government.iu-network.com/peers/peer0.government.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/"${NETWORK_DIR}/organizations/peerOrganizations/government.iu-network.com/users/Admin@government.iu-network.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# ============================================================================
# Create GOVERNANCE CHANNEL
# ============================================================================
echo ""
echo "📊 Creating governance-channel (Government monitoring)..."
docker exec cli peer channel create \
  -o orderer.iu-network.com:7050 \
  -c governance-channel \
  -f"${NETWORK_DIR}/channel-artifacts/governance-channel.tx \
  --outputBlock"${NETWORK_DIR}/channel-artifacts/governance-channel.block \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/pe"${NETWORK_DIR}/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem

if [ $? -eq 0 ]; then
  echo "✅ governance-channel created successfully"
else
  echo "❌ Failed to create governance-channel"
  exit 1
fi

sleep 2

# ============================================================================
# Create FINANCIAL OPERATIONS CHANNEL
# ============================================================================
echo ""
echo "💰 Creating financial-operations-channel (Loan processing)..."
docker exec cli peer channel create \
  -o orderer.iu-network.com:7050 \
  -c financial-operations-channel \
  -f"${NETWORK_DIR}/channel-artifacts/financial-operations-channel.tx \
  --outputBlock"${NETWORK_DIR}/channel-artifacts/financial-operations-channel.block \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/pe"${NETWORK_DIR}/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem

if [ $? -eq 0 ]; then
  echo "✅ financial-operations-channel created successfully"
else
  echo "❌ Failed to create financial-operations-channel"
  exit 1
fi

echo ""
echo "✅ =============================================="
echo "   CHANNELS CREATED SUCCESSFULLY!"
echo "==============================================="
echo ""
echo "📋 Created Channels:"
echo "   📊 governance-channel"
echo "      - Government only (monitoring & compliance)"
echo ""
echo "   💰 financial-operations-channel"
echo "      - Government (admin approval)"
echo "      - Creditor (create loans)"
echo "      - Debtor (accept/reject loans)"
echo ""
echo "Next step: Run ./5-join-peers.sh"
