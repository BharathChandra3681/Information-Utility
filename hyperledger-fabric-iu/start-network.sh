#!/bin/bash
set -euo pipefail

NETWORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$NETWORK_DIR"

# Choose docker compose
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Error: Docker Compose not found"; exit 127
fi

printStatus() {
  echo
  echo "=============================================="
  echo "$1"
  echo "=============================================="
}

cleanup() {
  printStatus "CLEANING NETWORK"
  "${COMPOSE_CMD[@]}" -f network/docker-compose.yaml down --volumes --remove-orphans || true
  docker system prune -f || true
  rm -rf network/organizations/peerOrganizations || true
  rm -rf network/organizations/ordererOrganizations || true
  rm -rf network/channel-artifacts || true
  rm -rf network/system-genesis-block || true
  rm -rf application/wallet* || true
  echo "Cleanup completed"
}

generateCrypto() {
  printStatus "GENERATING CRYPTO (noop placeholder)"
  mkdir -p network/organizations/peerOrganizations
}

generateChannelArtifacts() {
  printStatus "GENERATING CHANNEL ARTIFACTS"
  export FABRIC_CFG_PATH="$NETWORK_DIR/network"
  mkdir -p "network/channel-artifacts" "network/system-genesis-block"

  if [ -x "$NETWORK_DIR/network/bin/configtxgen" ]; then
    CTX="$NETWORK_DIR/network/bin/configtxgen"
  else
    CTX="$(command -v configtxgen || true)"
  fi
  if [ -z "${CTX:-}" ]; then
    echo "Error: configtxgen not found on PATH"; exit 127
  fi

  # Genesis block for system (orderer bootstrap)
  "$CTX" -profile IUOrdererGenesis -channelID system-channel \
         -outputBlock "network/system-genesis-block/genesis.block"

  # Application channels: create config blocks (Participation API expects .block)
  "$CTX" -profile FinancialOperationsChannel -channelID financial-operations-channel \
         -outputBlock "network/channel-artifacts/financial-operations-channel.block"

  # If you also need the audit channel, uncomment:
  # "$CTX" -profile AuditComplianceChannel -channelID audit-compliance-channel \
  #        -outputBlock "network/channel-artifacts/audit-compliance-channel.block"

  # Anchor peer updates (optional, applied later)
  $CTX -profile FinancialOperationsChannel -outputAnchorPeersUpdate network/channel-artifacts/CreditorMSPanchors.tx -channelID financial-operations-channel -asOrg CreditorMSP
  $CTX -profile FinancialOperationsChannel -outputAnchorPeersUpdate network/channel-artifacts/DebtorMSPanchors.tx   -channelID financial-operations-channel -asOrg DebtorMSP
  $CTX -profile FinancialOperationsChannel -outputAnchorPeersUpdate network/channel-artifacts/AdminMSPanchors.tx    -channelID financial-operations-channel -asOrg AdminMSP
  echo "Channel artifacts generated successfully"
}

waitForContainerRunning() {
  local name="$1" timeout="${2:-120}"
  local start now; start=$(date +%s)
  echo "Waiting for container $name to be running..."
  while true; do
    if [ "$(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null || echo false)" = "true" ]; then
      echo "Container $name is running."; break
    fi
    now=$(date +%s)
    if (( now - start > timeout )); then
      echo "Timeout waiting for $name"; docker logs --tail=200 "$name" || true; return 1
    fi
    sleep 1
  done
}

waitForPortInCli() {
  local host="$1" port="$2" timeout="${3:-120}"
  local start; start=$(date +%s)
  echo "Waiting for $host:$port to open..."
  # ensure cli running
  while ! docker inspect -f '{{.State.Running}}' cli >/dev/null 2>&1; do sleep 1; done
  while true; do
    if docker exec cli bash -lc "timeout 2 bash -lc '</dev/tcp/$host/$port'" >/dev/null 2>&1; then
      echo "$host:$port is open!"; break
    fi
    if (( $(date +%s) - start > timeout )); then
      echo "Timeout waiting for $host:$port"; return 1
    fi
    sleep 1
  done
}

cliPeer() {
  local mspId="$1" peerAddr="$2" mspPath="$3" tlsRoot="$4"
  shift 4
  docker exec -e FABRIC_CFG_PATH=/etc/hyperledger/fabric cli bash -lc "
    export CORE_PEER_LOCALMSPID='$mspId'
    export CORE_PEER_MSPCONFIGPATH='$mspPath'
    export CORE_PEER_ADDRESS='$peerAddr'
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_TLS_ROOTCERT_FILE='$tlsRoot'
    $*
  "
}

joinWithRetry() {
  local mspId="$1" peerName="$2" peerAddr="$3" mspPath="$4" tlsRoot="$5" channel="$6" blockFile="$7"
  local tries=0 max=12
  until cliPeer "$mspId" "$peerAddr" "$mspPath" "$tlsRoot" "peer channel join -b '$blockFile'"; do
    tries=$((tries+1))
    if (( tries >= max )); then
      echo "Join failed for $peerName on $channel after $tries attempts"; return 1
    fi
    echo "Retry join for $peerName on $channel ($tries/$max) in 3s..."
    sleep 3
  done
  echo "$peerName joined $channel"
}

startNetwork() {
  printStatus "STARTING DOCKER CONTAINERS"
  echo "Starting Docker containers..."
  "${COMPOSE_CMD[@]}" -f network/docker-compose.yaml up -d

  echo "Checking container readiness..."
  waitForContainerRunning orderer.iu-network.com
  waitForContainerRunning peer0.creditor.iu-network.com
  waitForContainerRunning peer0.debtor.iu-network.com
  waitForContainerRunning peer0.admin.iu-network.com
  waitForContainerRunning cli

  echo "Waiting for core gRPC ports to be open..."
  waitForPortInCli orderer.iu-network.com 7050
  waitForPortInCli peer0.creditor.iu-network.com 7051
  waitForPortInCli peer0.debtor.iu-network.com 8051
  waitForPortInCli peer0.admin.iu-network.com 9051

  echo "Container status:"
  "${COMPOSE_CMD[@]}" -f network/docker-compose.yaml ps
}

createChannels() {
  printStatus "CREATING CHANNELS AND JOINING PEERS"

  local ART=/etc/hyperledger/fabric/channel-artifacts
  local ORG=/etc/hyperledger/fabric/organizations
  local ORDERER_CA="$ORG/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem"
  local ORDERER_TLS_CERT="$ORG/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt"
  local ORDERER_TLS_KEY="$ORG/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.key"
  local OSNADMIN="orderer.iu-network.com:9443"

  echo "Waiting for orderer admin endpoint ($OSNADMIN)..."
  for i in {1..40}; do
    if docker exec cli bash -lc "osnadmin channel list -o $OSNADMIN --ca-file $ORDERER_CA --client-cert $ORDERER_TLS_CERT --client-key $ORDERER_TLS_KEY >/dev/null 2>&1"; then
      echo "Admin endpoint is ready"; break
    fi
    sleep 2
    [ "$i" -eq 40 ] && { echo "Orderer admin not ready"; return 1; }
  done

  echo "Joining orderer to channels (Participation API)..."
  docker exec cli osnadmin channel join --channelID financial-operations-channel --config-block "$ART/financial-operations-channel.block" -o "$OSNADMIN" --ca-file "$ORDERER_CA" --client-cert "$ORDERER_TLS_CERT" --client-key "$ORDERER_TLS_KEY"
  docker exec cli osnadmin channel join --channelID audit-compliance-channel   --config-block "$ART/audit-compliance-channel.block"   -o "$OSNADMIN" --ca-file "$ORDERER_CA" --client-cert "$ORDERER_TLS_CERT" --client-key "$ORDERER_TLS_KEY"

  # MSP paths and TLS roots for peers (inside CLI)
  local ORG_BASE="$ORG/peerOrganizations"
  local CRED_MSPID=CreditorMSP
  local DEBT_MSPID=DebtorMSP
  local ADMIN_MSPID=AdminMSP

  local CRED_MSP="$ORG_BASE/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp"
  local DEBT_MSP="$ORG_BASE/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp"
  local ADMIN_MSP="$ORG_BASE/admin.iu-network.com/users/Admin@admin.iu-network.com/msp"

  local CRED_TLS="$ORG_BASE/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt"
  local DEBT_TLS="$ORG_BASE/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt"
  local ADMIN_TLS="$ORG_BASE/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt"

  local CRED_ADDR="peer0.creditor.iu-network.com:7051"
  local DEBT_ADDR="peer0.debtor.iu-network.com:8051"
  local ADMIN_ADDR="peer0.admin.iu-network.com:9051"

  echo "Joining peers to financial-operations-channel..."
  joinWithRetry "$CRED_MSPID"  peer0.creditor.iu-network.com "$CRED_ADDR"  "$CRED_MSP"  "$CRED_TLS"  financial-operations-channel "$ART/financial-operations-channel.block"
  joinWithRetry "$DEBT_MSPID"  peer0.debtor.iu-network.com   "$DEBT_ADDR"  "$DEBT_MSP"  "$DEBT_TLS"  financial-operations-channel "$ART/financial-operations-channel.block"
  joinWithRetry "$ADMIN_MSPID" peer0.admin.iu-network.com    "$ADMIN_ADDR" "$ADMIN_MSP" "$ADMIN_TLS" financial-operations-channel "$ART/financial-operations-channel.block"

  echo "Joining peers to audit-compliance-channel..."
  joinWithRetry "$CRED_MSPID"  peer0.creditor.iu-network.com "$CRED_ADDR"  "$CRED_MSP"  "$CRED_TLS"  audit-compliance-channel "$ART/audit-compliance-channel.block"
  joinWithRetry "$DEBT_MSPID"  peer0.debtor.iu-network.com   "$DEBT_ADDR"  "$DEBT_MSP"  "$DEBT_TLS"  audit-compliance-channel "$ART/audit-compliance-channel.block"
  joinWithRetry "$ADMIN_MSPID" peer0.admin.iu-network.com    "$ADMIN_ADDR" "$ADMIN_MSP" "$ADMIN_TLS" audit-compliance-channel "$ART/audit-compliance-channel.block"

  echo "Channels created and peers joined"
}

updateAnchorPeers() {
  printStatus "UPDATING ANCHOR PEERS"
  local ART=/etc/hyperledger/fabric/channel-artifacts
  local ORG=/etc/hyperledger/fabric/organizations
  local ORDERER_CA="$ORG/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem"

  docker exec cli bash -lc "
    export CORE_PEER_LOCALMSPID=CreditorMSP
    export CORE_PEER_MSPCONFIGPATH=$ORG/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
    peer channel update -c financial-operations-channel -f $ART/CreditorMSPanchors.tx -o orderer.iu-network.com:7050 --tls --cafile $ORDERER_CA
  "
  docker exec cli bash -lc "
    export CORE_PEER_LOCALMSPID=DebtorMSP
    export CORE_PEER_MSPCONFIGPATH=$ORG/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
    peer channel update -c financial-operations-channel -f $ART/DebtorMSPanchors.tx -o orderer.iu-network.com:7050 --tls --cafile $ORDERER_CA
  "
  docker exec cli bash -lc "
    export CORE_PEER_LOCALMSPID=AdminMSP
    export CORE_PEER_MSPCONFIGPATH=$ORG/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
    peer channel update -c financial-operations-channel -f $ART/AdminMSPanchors.tx -o orderer.iu-network.com:7050 --tls --cafile $ORDERER_CA
  "
  echo "Anchor peers updated"
}

deployChaincode() {
  printStatus "DEPLOYING CHAINCODE"
  if [ -x scripts/deployChaincode.sh ]; then
    bash scripts/deployChaincode.sh
  else
    echo "scripts/deployChaincode.sh not found; skipping"
  fi
}

installChaincodeDependendencies() {
  printStatus "INSTALLING CHAINCODE DEPENDENCIES"
  (cd chaincode/iu-basic && npm ci || true)
  (cd chaincode/loan-processor && npm ci || true)
}

installAppDependencies() {
  printStatus "INSTALLING APPLICATION DEPENDENCIES"
  (cd application && npm ci || true)
}

startAPIServer() {
  printStatus "STARTING API SERVER"
  (cd application && nohup npm start >/dev/null 2>&1 &)
  echo "API server started"
}

printNetworkInfo() {
  printStatus "NETWORK READY"
  echo "Orderer: orderer.iu-network.com:7050 (admin 9443)"
  echo "Peers: creditor 7051, debtor 8051, admin 9051"
}

main() {
  local cmd="${1:-up}"
  case "$cmd" in
    up)
      echo "Starting Financial Information Utility Hyperledger Fabric Network..."
      echo "Network Directory: $NETWORK_DIR"
      cleanup
      generateCrypto
      generateChannelArtifacts
      startNetwork
      createChannels
      updateAnchorPeers
      deployChaincode
      installChaincodeDependendencies
      installAppDependencies
      startAPIServer
      printNetworkInfo
      ;;
    down)
      echo "Starting Financial Information Utility Hyperledger Fabric Network..."
      echo "Network Directory: $NETWORK_DIR"
      cleanup
      ;;
    restart)
      "$0" down
      "$0" up
      ;;
    *)
      echo "Usage: $0 {up|down|restart}"; exit 2;;
  esac
}

main "$@"
