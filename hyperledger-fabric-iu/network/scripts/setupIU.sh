#!/bin/bash

echo "========================================="
echo "Financial Information Utility"
echo "Setting up 2 Fixed Channels"
echo "========================================="

# Set environment for CLI
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true

echo "Channel 1: iu-transactions (Transaction Proposals & Approvals)"
echo "  - Creditor Org: Transaction proposals"
echo "  - Debtor Org: Transaction approvals" 
echo "  - Admin Org: Transaction oversight"

echo ""
echo "Channel 2: iu-admin (Administrative Monitoring)"
echo "  - Admin Org: Primary governance"
echo "  - Creditor/Debtor Orgs: Monitoring access"

echo ""
echo "========================================="
echo "Testing Network Connectivity"
echo "========================================="

# Test basic peer connectivity without channels first
echo "Setting up Creditor Peer environment..."
export CORE_PEER_LOCALMSPID="CreditorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

echo "Checking peer status..."
peer node status

echo ""
echo "Listing any existing channels..."
peer channel list

echo ""
echo "========================================="
echo "Network Setup Complete"
echo "Ready for channel creation when needed"
echo "========================================="
