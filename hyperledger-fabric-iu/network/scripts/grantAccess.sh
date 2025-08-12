#!/usr/bin/env bash
set -euo pipefail
REC_ID=${1:-LOAN004}
ORG=${2:-AdminMSP}
CC_NAME=${CC_NAME:-iu-basic}
CHANNEL=${CHANNEL:-financial-operations-channel}

INVOKE_PAYLOAD=$(cat <<EOF
{"Args":["GrantAccess","${REC_ID}","${ORG}"]}
EOF
)

DEBTOR_PEER=peer0.debtor.iu-network.com:8051
DEBTOR_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt

# Admin identity (required by chaincode authorization)
ADMIN_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
ADMIN_MSP=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp

docker exec \
  -e CORE_PEER_LOCALMSPID=AdminMSP \
  -e CORE_PEER_MSPCONFIGPATH=${ADMIN_MSP} \
  -e CORE_PEER_TLS_ROOTCERT_FILE=${ADMIN_TLS} \
  -e CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051 \
  cli peer chaincode invoke \
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
