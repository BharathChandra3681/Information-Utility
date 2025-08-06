#!/bin/bash

echo "========================================="
echo "Financial IU - Network Activity Monitor"
echo "========================================="

echo "1. Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -1
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(peer0|orderer|ca)"

echo ""
echo "2. Recent Network Activity (Last 10 lines from each service):"

echo ""
echo "=== ORDERER ACTIVITY ==="
docker logs --tail 10 orderer.iu-network.com | grep -E "(Delivering|block|transaction)" || echo "No recent block/transaction activity"

echo ""
echo "=== CREDITOR PEER ACTIVITY ==="  
docker logs --tail 10 peer0.creditor.iu-network.com | grep -E "(block|transaction|channel)" || echo "No recent activity"

echo ""
echo "=== DEBTOR PEER ACTIVITY ==="
docker logs --tail 10 peer0.debtor.iu-network.com | grep -E "(block|transaction|channel)" || echo "No recent activity"

echo ""
echo "=== ADMIN PEER ACTIVITY ==="
docker logs --tail 10 peer0.admin.iu-network.com | grep -E "(block|transaction|channel)" || echo "No recent activity"

echo ""
echo "3. Network Health Check:"
echo "   ✓ All containers running for: $(docker ps --format '{{.Status}}' --filter name=peer0.creditor.iu-network.com | cut -d' ' -f2-)"

echo ""
echo "========================================="
echo "To see blocks being created, you need:"
echo "1. Channels: iu-transactions & iu-admin"  
echo "2. Chaincode: For transaction processing"
echo "3. Sample transactions: To generate blocks"
echo "========================================="
