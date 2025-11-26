#!/bin/bash
# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

# =============================================================================
# Script 5: Join Peers to Channels
# =============================================================================
# This script joins each peer to their respective channels

echo "🔗 =============================================="
echo "   JOINING PEERS TO CHANNELS"
echo "==============================================="

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/pe"${NETWORK_DIR}/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem

# ============================================================================
# Join GOVERNMENT PEER to GOVERNANCE CHANNEL
# ============================================================================
echo ""
echo "📊 Joining Government peer to governance-channel..."
docker exec cli peer channel join -b"${NETWORK_DIR}/channel-artifacts/governance-channel.block

if [ $? -eq 0 ]; then
  echo "✅ Government peer joined governance-channel"
else
  echo "❌ Failed to join Government peer to governance-channel"
  exit 1
fi

sleep 2

# Update anchor peer for Government on governance channel
echo "⚓ Updating Government anchor peer on governance-channel..."
docker exec cli peer channel update \
  -o orderer.iu-network.com:7050 \
  -c governance-channel \
  -f"${NETWORK_DIR}/channel-artifacts/GovernanceGovernmentMSPanchors.tx \
  --tls --cafile $ORDERER_CA

if [ $? -eq 0 ]; then
  echo "✅ Government anchor peer updated on governance-channel"
fi

# ============================================================================
# Join GOVERNMENT PEER to FINANCIAL OPERATIONS CHANNEL
# ============================================================================
echo ""
echo "💰 Joining Government peer to financial-operations-channel..."
docker exec cli peer channel join -b"${NETWORK_DIR}/channel-artifacts/financial-operations-channel.block

if [ $? -eq 0 ]; then
  echo "✅ Government peer joined financial-operations-channel"
else
  echo "❌ Failed to join Government peer to financial-operations-channel"
  exit 1
fi

sleep 2

# Update anchor peer for Government on financial operations channel
echo "⚓ Updating Government anchor peer on financial-operations-channel..."
docker exec cli peer channel update \
  -o orderer.iu-network.com:7050 \
  -c financial-operations-channel \
  -f"${NETWORK_DIR}/channel-artifacts/GovernmentMSPanchors.tx \
  --tls --cafile $ORDERER_CA

if [ $? -eq 0 ]; then
  echo "✅ Government anchor peer updated on financial-operations-channel"
fi

# ============================================================================
# Join CREDITOR PEER to FINANCIAL OPERATIONS CHANNEL
# ============================================================================
echo ""
echo "💳 Joining Creditor peer to financial-operations-channel..."
docker exec -e CORE_PEER_LOCALMSPID="CreditorMSP" \
  -e CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:8051 \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/pe"${NETWORK_DIR}/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/pe"${NETWORK_DIR}/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt \
  cli peer channel join -b"${NETWORK_DIR}/channel-artifacts/financial-operations-channel.block

if [ $? -eq 0 ]; then
  echo "✅ Creditor peer joined financial-operations-channel"
else
  echo "❌ Failed to join Creditor peer to financial-operations-channel"
  exit 1
fi

sleep 2

# Update anchor peer for Creditor
echo "⚓ Updating Creditor anchor peer on financial-operations-channel..."
docker exec -e CORE_PEER_LOCALMSPID="CreditorMSP" \
  -e CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:8051 \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/pe"${NETWORK_DIR}/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/pe"${NETWORK_DIR}/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt \
  cli peer channel update \
    -o orderer.iu-network.com:7050 \
    -c financial-operations-channel \
    -f"${NETWORK_DIR}/channel-artifacts/CreditorMSPanchors.tx \
    --tls --cafile $ORDERER_CA

if [ $? -eq 0 ]; then
  echo "✅ Creditor anchor peer updated on financial-operations-channel"
fi

# ============================================================================
# Join DEBTOR PEER to FINANCIAL OPERATIONS CHANNEL
# ============================================================================
echo ""
echo "💰 Joining Debtor peer to financial-operations-channel..."
docker exec -e CORE_PEER_LOCALMSPID="DebtorMSP" \
  -e CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:9051 \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/pe"${NETWORK_DIR}/organizations/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/pe"${NETWORK_DIR}/organizations/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt \
  cli peer channel join -b"${NETWORK_DIR}/channel-artifacts/financial-operations-channel.block

if [ $? -eq 0 ]; then
  echo "✅ Debtor peer joined financial-operations-channel"
else
  echo "❌ Failed to join Debtor peer to financial-operations-channel"
  exit 1
fi

sleep 2

# Update anchor peer for Debtor
echo "⚓ Updating Debtor anchor peer on financial-operations-channel..."
docker exec -e CORE_PEER_LOCALMSPID="DebtorMSP" \
  -e CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:9051 \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/pe"${NETWORK_DIR}/organizations/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/pe"${NETWORK_DIR}/organizations/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt \
  cli peer channel update \
    -o orderer.iu-network.com:7050 \
    -c financial-operations-channel \
    -f"${NETWORK_DIR}/channel-artifacts/DebtorMSPanchors.tx \
    --tls --cafile $ORDERER_CA

if [ $? -eq 0 ]; then
  echo "✅ Debtor anchor peer updated on financial-operations-channel"
fi

echo ""
echo "✅ =============================================="
echo "   ALL PEERS JOINED SUCCESSFULLY!"
echo "==============================================="
echo ""
echo "📋 Channel Membership Summary:"
echo ""
echo "   📊 governance-channel:"
echo "      ✅ Government (peer0.government.iu-network.com:7051)"
echo ""
echo "   💰 financial-operations-channel:"
echo "      ✅ Government (peer0.government.iu-network.com:7051)"
echo "      ✅ Creditor (peer0.creditor.iu-network.com:8051)"
echo "      ✅ Debtor (peer0.debtor.iu-network.com:9051)"
echo ""
echo "Next step: Run ./6-deploy-chaincode.sh"
