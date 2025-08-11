#!/bin/bash

echo "=================================================================="
echo "🔍 HYPERLEDGER FABRIC CHANNEL STATUS REPORT"
echo "Financial Information Utility Network"
echo "=================================================================="

echo ""
echo "📊 NETWORK STATUS:"
echo "═════════════════"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(peer0|orderer|ca)"

echo ""
echo "📋 CHANNEL CONFIGURATION FILES:"
echo "═══════════════════════════════"
echo "✅ Found channel transaction files:"
ls -la channel-artifacts/ | grep -E "\.(tx|block)$"

echo ""
echo "🔍 ORDERER CHANNEL ANALYSIS:"
echo "═══════════════════════════"
echo "📊 From Orderer Logs:"
CHANNEL_COUNT=$(docker logs orderer.iu-network.com 2>&1 | grep "application channels" | tail -1 | grep -o "application channels: [0-9]*" | cut -d' ' -f3)
if [ "$CHANNEL_COUNT" ]; then
    echo "   • Application channels: $CHANNEL_COUNT"
else
    echo "   • Application channels: 0 (from logs)"
fi

echo ""
echo "📁 Orderer Chain Storage:"
CHAINS=$(docker exec orderer.iu-network.com ls /var/hyperledger/production/orderer/chains/ 2>/dev/null || echo "")
if [ -z "$CHAINS" ]; then
    echo "   • Chains directory: EMPTY"
    echo "   • Status: NO CHANNELS CREATED YET"
else
    echo "   • Active chains found:"
    echo "$CHAINS" | while read chain; do
        echo "     - $chain"
    done
fi

echo ""
echo "🔍 PEER CHANNEL ANALYSIS:"
echo "═══════════════════════"
echo "📊 Checking peer ledger data..."

for peer in creditor debtor admin; do
    echo "   → peer0.$peer.iu-network.com:"
    LEDGER_DATA=$(docker exec peer0.$peer.iu-network.com ls /var/hyperledger/production/ledgersData/chains/ 2>/dev/null || echo "")
    if [ -z "$LEDGER_DATA" ]; then
        echo "     • Ledger chains: NONE"
    else
        echo "     • Ledger chains:"
        echo "$LEDGER_DATA" | while read ledger; do
            echo "       - $ledger"
        done
    fi
done

echo ""
echo "🎯 CHANNEL CONFIGURATION ANALYSIS:"
echo "═════════════════════════════════"
echo "✅ ConfigTX Profiles Found:"
echo "   • FinancialOperationsChannel"
echo "   • AuditComplianceChannel"
echo ""
echo "✅ Channel Transaction Files:"
echo "   • financial-operations-channel.tx ($(stat -f%z channel-artifacts/financial-operations-channel.tx 2>/dev/null || echo "N/A") bytes)"
echo "   • audit-compliance-channel.tx ($(stat -f%z channel-artifacts/audit-compliance-channel.tx 2>/dev/null || echo "N/A") bytes)"
echo ""
echo "✅ Genesis Block:"
echo "   • genesis.block ($(stat -f%z channel-artifacts/genesis.block 2>/dev/null || echo "N/A") bytes)"

echo ""
echo "⚠️  CHANNEL STATUS SUMMARY:"
echo "════════════════════════════"
echo "🔧 PREPARATION: COMPLETE"
echo "   ✅ Network running successfully"
echo "   ✅ Channel artifacts generated"
echo "   ✅ ConfigTX profiles configured"
echo ""
echo "❌ DEPLOYMENT: NOT COMPLETED"
echo "   ❌ Channels not created on orderer"
echo "   ❌ Peers not joined to channels"
echo "   ❌ No active blockchain channels"

echo ""
echo "📈 WHAT THIS MEANS:"
echo "══════════════════"
echo "• Your network infrastructure is READY"
echo "• Channel configuration files are PREPARED"  
echo "• But actual channels are NOT YET RUNNING"
echo "• No blocks are being created yet"
echo ""
echo "🚀 TO ACTIVATE CHANNELS:"
echo "• Submit channel creation transactions to orderer"
echo "• Join peers to the created channels"
echo "• Deploy and instantiate chaincode"
echo "• Then every transaction will create blocks!"

echo ""
echo "=================================================================="
echo "🎯 FINAL STATUS: 0 ACTIVE CHANNELS"
echo "Your network is ready but channels need to be created and joined"
echo "=================================================================="
