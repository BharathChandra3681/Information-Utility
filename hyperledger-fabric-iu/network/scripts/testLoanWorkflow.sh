#!/bin/bash

echo "========================================="
echo "FINANCIAL IU - LOAN WORKFLOW DEMO"
echo "Testing Creditor → Debtor → Admin Flow"
echo "========================================="

docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true

echo "========================================="
echo "DEMO: Complete Loan Processing Workflow"
echo "========================================="

# Step 1: CREDITOR PROPOSES LOAN
echo "💰 STEP 1: Creditor proposes a loan"
export CORE_PEER_LOCALMSPID="CreditorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

echo "🏦 Acting as: CREDITOR (MSP: $CORE_PEER_LOCALMSPID)"

# Sample loan proposal
LOAN_ID="LOAN-001-$(date +%s)"
LOAN_AMOUNT="50000.00"
INTEREST_RATE="7.5"
DEBTOR_ID="DEBTOR_COMPANY_ABC"

# Sample document hashes (simulating PostgreSQL stored documents)
DOC_HASHES='"'"'{
    "loanApplication": "a1b2c3d4e5f6789012345678901234567890abcdef",
    "creditReport": "b2c3d4e5f6789012345678901234567890abcdef12", 
    "collateralDocs": "c3d4e5f6789012345678901234567890abcdef1234",
    "financialStatements": "d4e5f6789012345678901234567890abcdef123456"
}'"'"'

echo "📋 Loan Details:"
echo "   • Loan ID: $LOAN_ID"
echo "   • Amount: ₹$LOAN_AMOUNT"
echo "   • Interest Rate: $INTEREST_RATE%"
echo "   • Debtor: $DEBTOR_ID"
echo "   • Document Hashes: PostgreSQL references included"

echo ""
echo "🔄 Submitting loan proposal..."

# This will fail without proper channel, but shows the workflow
peer chaincode invoke -o orderer.iu-network.com:7050 \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem \
    -C iu-transactions \
    -n loan-processor \
    -c "{\"function\":\"proposeLoan\",\"Args\":[\"$LOAN_ID\",\"$LOAN_AMOUNT\",\"$INTEREST_RATE\",\"$DEBTOR_ID\",\"$DOC_HASHES\"]}" || echo "⚠️  Channel not created yet - this is expected"

echo ""
echo "========================================="
echo "💡 EXPECTED WORKFLOW (Once Channels Are Created):"
echo "========================================="

echo "1️⃣  CREDITOR ACTIONS:"
echo "   proposeLoan() → Creates loan proposal on blockchain"
echo "   → Event: LoanProposed emitted"
echo "   → Status: PROPOSED"

echo ""
echo "2️⃣  DEBTOR ACTIONS (Choose one):"
echo "   acceptLoan() → Accepts loan, adds debtor documents"
echo "   → Event: LoanAccepted emitted"
echo "   → Status: ACCEPTED"
echo "   OR"
echo "   rejectLoan() → Rejects with reason"
echo "   → Event: LoanRejected emitted"
echo "   → Status: REJECTED"

echo ""
echo "3️⃣  ADMIN MONITORING:"
echo "   getAllLoans() → View all loans"
echo "   getLoanStatistics() → Dashboard metrics"
echo "   getLoanHistory() → Complete audit trail"

echo ""
echo "4️⃣  DOCUMENT MANAGEMENT:"
echo "   📄 Documents stored in PostgreSQL"
echo "   🔐 Document hashes stored on blockchain"
echo "   ✅ verifyDocumentHash() for integrity checks"

echo ""
echo "========================================="
echo "NEXT STEPS TO MAKE THIS WORK:"
echo "========================================="
echo "1. Create proper channel configuration files"
echo "2. Use configtxgen to create channel transactions"
echo "3. Submit channel creation to orderer"
echo "4. Join all peers to channels"
echo "5. Commit chaincode definition"
echo "6. Run this demo again with working channels"

echo ""
echo "🔍 MONITORING BLOCKS:"
echo "   Once channels are active, each transaction creates a new block:"
echo "   • proposeLoan() → Block with loan proposal"
echo "   • acceptLoan()/rejectLoan() → Block with response"
echo "   • Admin queries → Read-only (no new blocks)"
echo "   • Document hash verification → Read-only"
echo "========================================="
'
