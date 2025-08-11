#!/bin/bash

# Information Utility Hyperledger Fabric Network Setup Script
set -e

ROOTDIR=$(cd "$(dirname "$0")" && pwd)
export PATH=${ROOTDIR}/bin:${PATH}
export FABRIC_CFG_PATH=${ROOTDIR}
export VERBOSE=false
export DOCKER_SOCK="${DOCKER_HOST:-/var/run/docker.sock}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function println() {
  echo -e "$1"
}

function errorln() {
  println "${RED}ERROR: $1${NC}"
}

function successln() {
  println "${GREEN}$1${NC}"
}

function infoln() {
  println "${YELLOW}$1${NC}"
}

# Function to generate crypto material
function generateCrypto() {
  infoln "Generating certificates using cryptogen tool..."
  
  if [ -d "organizations/peerOrganizations" ]; then
    rm -Rf organizations/peerOrganizations && rm -Rf organizations/ordererOrganizations
  fi

  set -x
  cryptogen generate --config=./crypto-config.yaml --output="organizations"
  res=$?
  set +x
  
  if [ $res -ne 0 ]; then
    errorln "Failed to generate certificates..."
    exit 1
  fi

  successln "Generated crypto material successfully"
}

# Function to generate genesis block
function generateGenesisBlock() {
  infoln "Generating Orderer Genesis block..."
  
  set -x
  configtxgen -profile IUNetworkOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
  res=$?
  set +x
  
  if [ $res -ne 0 ]; then
    errorln "Failed to generate orderer genesis block..."
    exit 1
  fi

  successln "Generated genesis block successfully"
}

# Function to create channel artifacts directory
function createArtifactsDir() {
  if [ -d "channel-artifacts" ]; then
    rm -rf channel-artifacts
  fi
  mkdir channel-artifacts
}

# Function to create channel transaction
function createChannelTx() {
  infoln "Generating channel create transaction 'iu-channel.tx'..."
  
  set -x
  configtxgen -profile IUNetworkChannel -outputCreateChannelTx ./channel-artifacts/iu-channel.tx -channelID iu-channel
  res=$?
  set +x
  
  if [ $res -ne 0 ]; then
    errorln "Failed to generate channel transaction..."
    exit 1
  fi

  successln "Generated channel transaction successfully"
}

# Function to generate anchor peer transactions
function generateAnchorPeerTx() {
  infoln "Generating anchor peer update transactions..."
  
  set -x
  configtxgen -profile IUNetworkChannel -outputAnchorPeersUpdate ./channel-artifacts/IUGovMSPanchors.tx -channelID iu-channel -asOrg IUGovMSP
  configtxgen -profile IUNetworkChannel -outputAnchorPeersUpdate ./channel-artifacts/IUDataMSPanchors.tx -channelID iu-channel -asOrg IUDataMSP
  configtxgen -profile IUNetworkChannel -outputAnchorPeersUpdate ./channel-artifacts/IUServiceMSPanchors.tx -channelID iu-channel -asOrg IUServiceMSP
  set +x

  successln "Generated anchor peer transactions successfully"
}

# Function to bring up the network
function networkUp() {
  infoln "Starting IU Hyperledger Fabric Network..."
  
  if [ ! -d "organizations/peerOrganizations" ]; then
    createArtifactsDir
    generateCrypto
    generateGenesisBlock
    createChannelTx
    generateAnchorPeerTx
  fi

  COMPOSE_FILES="-f ${ROOTDIR}/docker-compose.yaml"
  
  IMAGE_TAG=2.5.12 docker-compose ${COMPOSE_FILES} up -d 2>&1
  
  if [ $? -ne 0 ]; then
    errorln "Unable to start network"
    exit 1
  fi

  successln "Network started successfully!"
  infoln "Waiting for containers to be ready..."
  sleep 10
}

# Function to bring down the network
function networkDown() {
  infoln "Stopping IU Hyperledger Fabric Network..."
  
  COMPOSE_FILES="-f ${ROOTDIR}/docker-compose.yaml"
  
  docker-compose ${COMPOSE_FILES} down --volumes --remove-orphans
  docker system prune -f
  
  # Remove crypto material and channel artifacts
  if [ -d "organizations/peerOrganizations" ]; then
    rm -Rf organizations/peerOrganizations && rm -Rf organizations/ordererOrganizations
  fi
  
  if [ -d "channel-artifacts" ]; then
    rm -rf channel-artifacts
  fi

  successln "Network stopped and cleaned up successfully!"
}

# Function to create channel
function createChannel() {
  infoln "Creating channel 'iu-channel'..."
  
  docker exec cli peer channel create \
    -o orderer.iu-network.com:7050 \
    -c iu-channel \
    -f ./channel-artifacts/iu-channel.tx \
    --outputBlock ./channel-artifacts/iu-channel.block \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem
  
  successln "Channel 'iu-channel' created successfully!"
}

# Function to join peers to channel
function joinChannel() {
  infoln "Joining peers to channel 'iu-channel'..."
  
  # Join IUGov peer
  docker exec cli peer channel join -b ./channel-artifacts/iu-channel.block
  
  # Join IUData peer
  docker exec -e CORE_PEER_LOCALMSPID=IUDataMSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-data.iu-network.com/peers/peer0.iu-data.iu-network.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-data.iu-network.com/users/Admin@iu-data.iu-network.com/msp \
    -e CORE_PEER_ADDRESS=peer0.iu-data.iu-network.com:8051 \
    cli peer channel join -b ./channel-artifacts/iu-channel.block
  
  # Join IUService peer
  docker exec -e CORE_PEER_LOCALMSPID=IUServiceMSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-service.iu-network.com/peers/peer0.iu-service.iu-network.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-service.iu-network.com/users/Admin@iu-service.iu-network.com/msp \
    -e CORE_PEER_ADDRESS=peer0.iu-service.iu-network.com:9051 \
    cli peer channel join -b ./channel-artifacts/iu-channel.block
  
  successln "All peers joined channel successfully!"
}

# Function to deploy sample chaincode
function deployChaincode() {
  infoln "Deploying Information Utility Node.js chaincode..."
  
  # Set chaincode path
  CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/iu-basic/"
  
  # Package chaincode (Node.js)
  infoln "Packaging Node.js chaincode..."
  docker exec cli peer lifecycle chaincode package iu-basic.tar.gz \
    --path ${CC_SRC_PATH} \
    --lang node \
    --label iu-basic_1.0
  
  # Install on IUGov peer
  infoln "Installing chaincode on IUGov peer..."
  docker exec cli peer lifecycle chaincode install iu-basic.tar.gz
  
  # Install on IUData peer
  infoln "Installing chaincode on IUData peer..."
  docker exec -e CORE_PEER_LOCALMSPID=IUDataMSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-data.iu-network.com/peers/peer0.iu-data.iu-network.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-data.iu-network.com/users/Admin@iu-data.iu-network.com/msp \
    -e CORE_PEER_ADDRESS=peer0.iu-data.iu-network.com:8051 \
    cli peer lifecycle chaincode install iu-basic.tar.gz
  
  # Install on IUService peer
  infoln "Installing chaincode on IUService peer..."
  docker exec -e CORE_PEER_LOCALMSPID=IUServiceMSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-service.iu-network.com/peers/peer0.iu-service.iu-network.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-service.iu-network.com/users/Admin@iu-service.iu-network.com/msp \
    -e CORE_PEER_ADDRESS=peer0.iu-service.iu-network.com:9051 \
    cli peer lifecycle chaincode install iu-basic.tar.gz
  
  # Query package ID
  infoln "Querying installed chaincode..."
  docker exec cli peer lifecycle chaincode queryinstalled >&log.txt
  PACKAGE_ID=$(sed -n "/iu-basic_1.0/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
  echo "Package ID: $PACKAGE_ID"
  
  # Approve chaincode definition for IUGov
  infoln "Approving chaincode definition for IUGov..."
  docker exec cli peer lifecycle chaincode approveformyorg \
    -o orderer.iu-network.com:7050 \
    --ordererTLSHostnameOverride orderer.iu-network.com \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem \
    --channelID iu-channel \
    --name iu-basic \
    --version 1.0 \
    --package-id $PACKAGE_ID \
    --sequence 1
  
  # Approve chaincode definition for IUData
  infoln "Approving chaincode definition for IUData..."
  docker exec -e CORE_PEER_LOCALMSPID=IUDataMSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-data.iu-network.com/peers/peer0.iu-data.iu-network.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-data.iu-network.com/users/Admin@iu-data.iu-network.com/msp \
    -e CORE_PEER_ADDRESS=peer0.iu-data.iu-network.com:8051 \
    cli peer lifecycle chaincode approveformyorg \
    -o orderer.iu-network.com:7050 \
    --ordererTLSHostnameOverride orderer.iu-network.com \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem \
    --channelID iu-channel \
    --name iu-basic \
    --version 1.0 \
    --package-id $PACKAGE_ID \
    --sequence 1
  
  # Approve chaincode definition for IUService
  infoln "Approving chaincode definition for IUService..."
  docker exec -e CORE_PEER_LOCALMSPID=IUServiceMSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-service.iu-network.com/peers/peer0.iu-service.iu-network.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-service.iu-network.com/users/Admin@iu-service.iu-network.com/msp \
    -e CORE_PEER_ADDRESS=peer0.iu-service.iu-network.com:9051 \
    cli peer lifecycle chaincode approveformyorg \
    -o orderer.iu-network.com:7050 \
    --ordererTLSHostnameOverride orderer.iu-network.com \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem \
    --channelID iu-channel \
    --name iu-basic \
    --version 1.0 \
    --package-id $PACKAGE_ID \
    --sequence 1
  
  # Check commit readiness
  infoln "Checking commit readiness..."
  docker exec cli peer lifecycle chaincode checkcommitreadiness \
    --channelID iu-channel \
    --name iu-basic \
    --version 1.0 \
    --sequence 1 \
    --output json
  
  # Commit chaincode definition
  infoln "Committing chaincode definition..."
  docker exec cli peer lifecycle chaincode commit \
    -o orderer.iu-network.com:7050 \
    --ordererTLSHostnameOverride orderer.iu-network.com \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem \
    --channelID iu-channel \
    --name iu-basic \
    --version 1.0 \
    --sequence 1 \
    --peerAddresses peer0.iu-gov.iu-network.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-gov.iu-network.com/peers/peer0.iu-gov.iu-network.com/tls/ca.crt \
    --peerAddresses peer0.iu-data.iu-network.com:8051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-data.iu-network.com/peers/peer0.iu-data.iu-network.com/tls/ca.crt \
    --peerAddresses peer0.iu-service.iu-network.com:9051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/iu-service.iu-network.com/peers/peer0.iu-service.iu-network.com/tls/ca.crt
  
  # Query committed chaincode
  infoln "Querying committed chaincode..."
  docker exec cli peer lifecycle chaincode querycommitted --channelID iu-channel --name iu-basic
  
  successln "Node.js chaincode deployed successfully!"
}

# Function to display usage
function printHelp() {
  println "Usage: "
  println "  network.sh <Mode> [Flags]"
  println "    Modes:"
  println "      up - bring up the network with docker-compose up"
  println "      down - clear the network with docker-compose down"
  println "      restart - restart the network"
  println "      channel - create and join channel"
  println "      deployCC - deploy the chaincode"
  println
  println "    Flags:"
  println "    -v, --verbose - verbose mode"
  println "    -h, --help - print this message"
}

# Main script logic
MODE=$1
shift

# Parse command line options
while [[ $# -ge 1 ]] ; do
  key="$1"
  case $key in
  -v | --verbose)
    VERBOSE=true
    ;;
  -h | --help)
    printHelp
    exit 0
    ;;
  *)
    errorln "Unknown flag: $key"
    printHelp
    exit 1
    ;;
  esac
  shift
done

# Determine mode
if [ "$MODE" == "up" ]; then
  networkUp
elif [ "$MODE" == "down" ]; then
  networkDown
elif [ "$MODE" == "restart" ]; then
  networkDown
  networkUp
elif [ "$MODE" == "channel" ]; then
  createChannel
  joinChannel
elif [ "$MODE" == "deployCC" ]; then
  deployChaincode
else
  printHelp
  exit 1
fi
