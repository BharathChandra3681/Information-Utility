#!/usr/bin/env bash
# Automate CreateFinancialRecord invocation on iu-basic chaincode
# Usage: ./invokeCreateRecord.sh <RecordID>
set -euo pipefail
REC_ID=${1:-LOAN003}
CC_NAME=${CC_NAME:-iu-basic}
CHANNEL=${CHANNEL:-financial-operations-channel}
# Basic sample JSON payloads (edit as needed)
FI_JSON='{"institutionId":"FI90001","name":"New Bank India","registrationNumber":"REG90001","type":"Bank","contact":{"address":"1 Finance Way, Pune, India","phone":"+91-9000000000","email":"support@newbank.com"}}'
BORROWER_JSON='{"borrowerId":"BORR3001","name":"Ravi Kumar","dateOfBirth":"1988-11-05","PAN":"PQRSX1234Z","aadhaar":"111122223333","contact":{"address":"7 Tech Park, Hyderabad","phone":"+91-9445566778","email":"ravi.kumar@example.com"},"creditProfile":{"creditScore":710,"creditRating":"A-"}}'
LOAN_JSON='{"loanAmount":2500000,"interestRate":8.2,"sanctionDate":"2025-08-12","tenureMonths":180,"loanType":"Home Loan","collateral":{"type":"Apartment","value":4000000,"description":"2BHK in Hyderabad"}}'

# Build safely escaped arguments using printf and jq for raw string escaping
json_escape() { printf '%s' "$1" | jq -Rs .; }
FI_ESC=$(json_escape "$FI_JSON")
BORROWER_ESC=$(json_escape "$BORROWER_JSON")
LOAN_ESC=$(json_escape "$LOAN_JSON")

INVOKE_PAYLOAD=$(cat <<EOF
{"Args":["CreateFinancialRecord","${REC_ID}","LoanRecord","CREDITOR003","DEBTOR003",${FI_ESC},${BORROWER_ESC},${LOAN_ESC}]}
EOF
)

echo "Invoking CreateFinancialRecord for ${REC_ID}";
echo "Payload: $INVOKE_PAYLOAD"

# Add debtor peer TLS path vars (optional override via env)
DEBTOR_PEER=peer0.debtor.iu-network.com:8051
DEBTOR_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt

# Invoke with BOTH peers to satisfy majority endorsement (Creditor + Debtor)
docker exec cli peer chaincode invoke \
  -o orderer.iu-network.com:7050 \
  --ordererTLSHostnameOverride orderer.iu-network.com \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem \
  -C ${CHANNEL} -n ${CC_NAME} \
  --peerAddresses peer0.creditor.iu-network.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt \
  --peerAddresses ${DEBTOR_PEER} \
  --tlsRootCertFiles ${DEBTOR_TLS} \
  -c "$INVOKE_PAYLOAD" \
  --waitForEventTimeout 60s

echo "Done. To query: ./queryRecord.sh ${REC_ID}";
