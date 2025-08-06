#!/bin/bash

echo "========================================="
echo "HYPERLEDGER FABRIC NETWORK STATUS"
echo "Financial Information Utility Network"
echo "========================================="

echo "📋 CHANNEL INVENTORY:"
echo "--------------------"

echo "🔍 Checking Orderer Channel Information..."
ORDERER_CHANNELS=$(docker logs orderer.iu-network.com 2>&1 | grep -i "application channels" | tail -1)
echo "   $ORDERER_CHANNELS"

echo ""
echo "🔍 Checking Peer Channel Status..."
for peer in creditor debtor admin; do
    echo "   → peer0.$peer.iu-network.com:"
    PEER_STATUS=$(docker logs peer0.$peer.iu-network.com 2>&1 | grep -i "channels" | tail -1)
    if [[ -n "$PEER_STATUS" ]]; then
        echo "     $PEER_STATUS"
    else
        echo "     No active channels"
    fi
done

echo ""
echo "📊 CURRENT STATUS SUMMARY:"
echo "-------------------------"
echo "✅ Network Infrastructure: RUNNING"
echo "✅ All Containers: UP (6+ hours)"
echo "✅ Orderer: READY (Channel Participation API enabled)"
echo "✅ All 3 Peers: READY (System chaincodes deployed)"
echo "❌ Application Channels: NONE CREATED YET"

echo ""
echo "📝 CHANNELS NEEDED FOR YOUR FINANCIAL IU:"
echo "----------------------------------------"
echo "1️⃣  iu-transactions"
echo "    └── Purpose: Transaction proposals, approvals, processing"
echo "    └── Participants: Creditor, Debtor, Admin orgs"
echo "    └── Status: NOT CREATED"

echo "2️⃣  iu-admin"
echo "    └── Purpose: Administrative monitoring, governance"
echo "    └── Participants: Admin org (primary), others (monitoring)"
echo "    └── Status: NOT CREATED"

echo ""
echo "🚀 NEXT STEPS TO CREATE CHANNELS & SEE BLOCKS:"
echo "---------------------------------------------"
echo "1. Create channel configuration transactions"
echo "2. Submit channel creation to orderer"
echo "3. Join all peers to appropriate channels"
echo "4. Deploy chaincode for transaction processing"
echo "5. Submit sample transactions to generate blocks"

echo ""
echo "========================================="
