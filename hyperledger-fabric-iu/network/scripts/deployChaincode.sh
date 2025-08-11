#!/bin/bash

set -euo pipefail

echo "🔧 Information Utility Chaincode Deployment Script"
echo "=================================================="

# Chaincode metadata
CC_NAME="iu-basic"
CC_PATH="/opt/gopath/src/github.com/chaincode/iu-basic"
CC_LANG="node"
CC_VERSION="1.0"
CC_SEQUENCE="1"
CC_LABEL="${CC_NAME}_${CC_VERSION}"
CH1="financial-operations-channel"
CH2="audit-compliance-channel"
ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem"

export FABRIC_CFG_PATH=/etc/hyperledger/peercfg
export CORE_PEER_TLS_ENABLED=true

setPeerEnv() {
  ORG=$1
  case "$ORG" in
    CreditorMSP)
      export CORE_PEER_LOCALMSPID="CreditorMSP"
      export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
      export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
      export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051
      ;;
    DebtorMSP)
      export CORE_PEER_LOCALMSPID="DebtorMSP"
      export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt
      export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
      export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051
      ;;
    AdminMSP)
      export CORE_PEER_LOCALMSPID="AdminMSP"
      export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
      export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
      export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051
      ;;
  esac
}

# Helper to check if already installed on a peer
alreadyInstalled() {
  peer lifecycle chaincode queryinstalled 2>/dev/null | grep -q "Label: ${CC_LABEL}" && return 0 || return 1
}

# Pre-flight validation
if [ ! -d "${CC_PATH}" ]; then
  echo "❌ Chaincode path ${CC_PATH} not found inside CLI container. Contents of /opt/gopath/src/github.com/chaincode:";
  ls -al /opt/gopath/src/github.com/chaincode || true;
  exit 1;
fi
if [ ! -f "${CC_PATH}/package.json" ]; then
  echo "❌ package.json missing in ${CC_PATH}"; exit 1; fi

# Try to discover existing package ID first
setPeerEnv CreditorMSP
EXISTING_PKG_ID=$(peer lifecycle chaincode queryinstalled 2>/dev/null | grep "Label: ${CC_LABEL}" | sed -E "s/^Package ID: ([^,]+),.*/\1/" || true)
if [ -n "${EXISTING_PKG_ID}" ]; then
  echo "ℹ️  Reusing existing package ID: ${EXISTING_PKG_ID}";
  PKG_ID=${EXISTING_PKG_ID}
else
  echo "📦 Packaging chaincode (${CC_LABEL})"
  rm -f ${CC_NAME}.tar.gz || true
  peer lifecycle chaincode package ${CC_NAME}.tar.gz --path ${CC_PATH} --lang ${CC_LANG} --label ${CC_LABEL} || { echo "❌ Packaging failed"; exit 1; }
fi

# Install on peers only if not already present
for ORG in CreditorMSP DebtorMSP AdminMSP; do
  echo "📤 Ensuring installed on ${ORG}"
  setPeerEnv ${ORG}
  if alreadyInstalled; then
    echo "   ↪ already installed"
  else
    peer lifecycle chaincode install ${CC_NAME}.tar.gz
  fi
done

# Determine package ID if not previously set
if [ -z "${EXISTING_PKG_ID:-}" ]; then
  echo "🔍 Query installed to extract package ID"
  setPeerEnv CreditorMSP
  PKG_ID=$(peer lifecycle chaincode queryinstalled | grep "Label: ${CC_LABEL}" | sed -E "s/^Package ID: ([^,]+),.*/\1/")
  if [ -z "${PKG_ID}" ]; then
    echo "❌ Failed to extract Package ID. Full queryinstalled output:";
    peer lifecycle chaincode queryinstalled || true
    exit 1
  fi
  echo "✅ Package ID: ${PKG_ID}"
fi

# Approve and commit on CH1 (Creditor + Debtor)
echo "🧾 Approve for ${CH1} (Creditor, Debtor)"
setPeerEnv CreditorMSP
peer lifecycle chaincode approveformyorg -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --channelID ${CH1} --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --tls --cafile ${ORDERER_CA} --waitForEvent --package-id ${PKG_ID} || true
setPeerEnv DebtorMSP
peer lifecycle chaincode approveformyorg -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --channelID ${CH1} --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --tls --cafile ${ORDERER_CA} --waitForEvent --package-id ${PKG_ID} || true

echo "🧾 Check commit readiness (${CH1})"
peer lifecycle chaincode checkcommitreadiness --channelID ${CH1} --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --tls --cafile ${ORDERER_CA}

echo "🧾 Commit on ${CH1} (may fail if already committed)"
peer lifecycle chaincode commit -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --channelID ${CH1} --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --tls --cafile ${ORDERER_CA} \
  --peerAddresses peer0.creditor.iu-network.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt \
  --peerAddresses peer0.debtor.iu-network.com:8051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt || true

# Approve and commit on CH2 (Admin + Creditor)
echo "🧾 Approve for ${CH2} (Admin, Creditor)"
setPeerEnv AdminMSP
peer lifecycle chaincode approveformyorg -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --channelID ${CH2} --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --tls --cafile ${ORDERER_CA} --waitForEvent --package-id ${PKG_ID} || true
setPeerEnv CreditorMSP
peer lifecycle chaincode approveformyorg -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --channelID ${CH2} --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --tls --cafile ${ORDERER_CA} --waitForEvent --package-id ${PKG_ID} || true

echo "🧾 Check commit readiness (${CH2})"
peer lifecycle chaincode checkcommitreadiness --channelID ${CH2} --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --tls --cafile ${ORDERER_CA}

echo "🧾 Commit on ${CH2} (may fail if already committed)"
peer lifecycle chaincode commit -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --channelID ${CH2} --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --tls --cafile ${ORDERER_CA} \
  --peerAddresses peer0.admin.iu-network.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt \
  --peerAddresses peer0.creditor.iu-network.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt || true

# Init (invoke InitLedger on CH1) if not already invoked
echo "🚀 Invoking InitLedger on ${CH1} (ignoring duplicate errors)"
setPeerEnv CreditorMSP
peer chaincode invoke -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com --tls --cafile ${ORDERER_CA} -C ${CH1} -n ${CC_NAME} -c '{"Args":["InitLedger"]}' \
  --peerAddresses peer0.creditor.iu-network.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt \
  --peerAddresses peer0.debtor.iu-network.com:8051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt --waitForEvent || true

echo "✅ Chaincode deployment completed (idempotent)"
