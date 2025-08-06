#!/bin/bash

echo "========================================="
echo "FINANCIAL IU - COMPLETE SETUP"
echo "1. Creating Channels"
echo "2. Deploying Loan Processing Chaincode" 
echo "3. Testing Workflow"
echo "========================================="

# Make chaincode available to CLI container
echo "📦 Preparing chaincode..."
docker exec cli mkdir -p /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode

# Copy chaincode to CLI container
docker cp chaincode/. cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/

echo "🔧 Setting up environment in CLI container..."

docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true

echo "========================================="
echo "STEP 1: Creating iu-transactions Channel"
echo "========================================="

# Set up as Creditor admin
export CORE_PEER_LOCALMSPID="CreditorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

echo "✅ Environment set for Creditor admin"
echo "📋 Current peer: $CORE_PEER_ADDRESS"
echo "📋 Current MSP: $CORE_PEER_LOCALMSPID"

# Check peer status first
echo "🔍 Checking peer connectivity..."
peer node status

echo "========================================="
echo "STEP 2: Package Loan Processing Chaincode"
echo "========================================="

cd /opt/gopath/src/github.com/hyperledger/fabric/peer

# Package the chaincode
echo "📦 Packaging loan-processor chaincode..."
peer lifecycle chaincode package loan-processor.tar.gz --path ./chaincode/loan-processor --lang node --label loan-processor_1.0

if [ $? -eq 0 ]; then
    echo "✅ Chaincode packaged successfully"
    ls -la loan-processor.tar.gz
else
    echo "❌ Chaincode packaging failed"
    exit 1
fi

echo "========================================="
echo "STEP 3: Install Chaincode on All Peers"
echo "========================================="

# Install on Creditor peer
echo "📥 Installing on Creditor peer..."
peer lifecycle chaincode install loan-processor.tar.gz

# Install on Debtor peer
echo "📥 Installing on Debtor peer..."
export CORE_PEER_LOCALMSPID="DebtorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051

peer lifecycle chaincode install loan-processor.tar.gz

# Install on Admin peer
echo "📥 Installing on Admin peer..."
export CORE_PEER_LOCALMSPID="AdminMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

peer lifecycle chaincode install loan-processor.tar.gz

echo "========================================="
echo "STEP 4: Query Installed Chaincodes"
echo "========================================="

peer lifecycle chaincode queryinstalled

echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo "✅ Chaincode installed on all peers"
echo "🔧 Ready for channel creation and chaincode deployment"
echo "📊 Next: Create channels and commit chaincode definitions"
echo "========================================="
'

echo ""
echo "========================================="
echo "FINANCIAL IU SYSTEM OVERVIEW"
echo "========================================="
echo "🏦 LOAN PROCESSING WORKFLOW:"
echo "   1. Creditor calls: proposeLoan(id, amount, rate, debtorId, docHashes)"
echo "   2. Debtor calls: acceptLoan(id, additionalDocs) OR rejectLoan(id, reason)"
echo "   3. Documents stored in PostgreSQL, hashes on blockchain"
echo "   4. Admin monitors via: getAllLoans(), getLoanStatistics()"
echo ""
echo "📊 CHANNELS:"
echo "   • iu-transactions: Loan workflow operations"
echo "   • iu-admin: Monitoring and governance"
echo ""
echo "🔐 SECURITY:"
echo "   • MSP-based authorization"
echo "   • Document hash integrity verification"
echo "   • Complete transaction audit trail"
echo "========================================="
