#!/usr/bin/env bash
set -euo pipefail
REC_ID=${1:-LOAN004}
VERIFIER=${2:-AdminMSP}
CC_NAME=${CC_NAME:-iu-basic}
CHANNEL=${CHANNEL:-financial-operations-channel}

INVOKE_PAYLOAD=$(cat <<EOF
{"Args":["VerifyFinancialRecord","${REC_ID}","${VERIFIER}"]}
EOF
)

DEBTOR_PEER=peer0.debtor.iu-network.com:8051
DEBTOR_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt

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
  --waitForEvent --waitForEventTimeout 60s
