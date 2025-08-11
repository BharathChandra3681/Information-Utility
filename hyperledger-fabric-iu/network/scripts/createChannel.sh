#!/bin/bash

# Use peercfg where core.yaml is mounted
export FABRIC_CFG_PATH=/etc/hyperledger/peercfg
export CORE_PEER_TLS_ENABLED=true

# Channels and artifacts
CH1="financial-operations-channel"
CH2="audit-compliance-channel"
CH1_TX=./channel-artifacts/financial-operations-channel.tx
CH2_TX=./channel-artifacts/audit-compliance-channel.tx
CH1_BLOCK=./channel-artifacts/financial-operations-channel.block
CH2_BLOCK=./channel-artifacts/audit-compliance-channel.block
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/ca.crt
ORDERER_ADMIN_ADDR=https://orderer.iu-network.com:7053
ORDERER_ADDR=orderer.iu-network.com:7050

# Helper to set env for an org
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

# When SKIP_ORDERER_JOIN is set, skip orderer participation API calls
if [ "${SKIP_ORDERER_JOIN:-}" != "1" ]; then
  echo "SKIP_ORDERER_JOIN not set; this script expects start-network.sh to handle orderer joins via osnadmin with client certs."
fi

# Join peers using the local genesis blocks
echo "=================== Joining Peers to ${CH1} ==================="
setPeerEnv CreditorMSP
peer channel join -b ${CH1_BLOCK}
setPeerEnv DebtorMSP
peer channel join -b ${CH1_BLOCK}
setPeerEnv AdminMSP
peer channel join -b ${CH1_BLOCK}

# Update anchors on CH1
echo "=================== Updating Anchor Peers on ${CH1} ==================="
setPeerEnv CreditorMSP
peer channel update -o ${ORDERER_ADDR} -c ${CH1} -f ./channel-artifacts/CreditorMSPanchors.tx --tls --cafile ${ORDERER_CA}
setPeerEnv DebtorMSP
peer channel update -o ${ORDERER_ADDR} -c ${CH1} -f ./channel-artifacts/DebtorMSPanchors.tx --tls --cafile ${ORDERER_CA}
setPeerEnv AdminMSP
peer channel update -o ${ORDERER_ADDR} -c ${CH1} -f ./channel-artifacts/AdminMSPanchors.tx --tls --cafile ${ORDERER_CA}

# Join CH2
echo "=================== Joining Peers to ${CH2} ==================="
setPeerEnv CreditorMSP
peer channel join -b ${CH2_BLOCK}
setPeerEnv DebtorMSP
peer channel join -b ${CH2_BLOCK}
setPeerEnv AdminMSP
peer channel join -b ${CH2_BLOCK}

# List
echo "=================== Listing Channels (Creditor) ==================="
setPeerEnv CreditorMSP
peer channel list

echo "=================== Channel Creation Complete ==================="
