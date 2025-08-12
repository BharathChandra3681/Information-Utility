#!/bin/bash

# Deploy chaincode to Financial Information Utility Network
# Fixed version with proper Docker volume mounting and path handling

set -e

# Get absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"

# Configuration variables
CHANNEL_NAME=${CHANNEL_NAME:-financial-operations-channel}
CHAINCODE_NAME=${CHAINCODE_NAME:-iu-basic}
CHAINCODE_VERSION=${CHAINCODE_VERSION:-1.0}
CHAINCODE_SEQUENCE=${CHAINCODE_SEQUENCE:-1}
CC_SRC_PATH="${PROJECT_ROOT}/chaincode/iu-basic"
CC_RUNTIME_LANGUAGE="node"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Information Utility Chaincode Deployment Script${NC}"
echo "=================================================="

# Verify chaincode directory exists
if [ ! -d "$CC_SRC_PATH" ]; then
    echo -e "${RED}ERROR: Chaincode directory not found: $CC_SRC_PATH${NC}"
    exit 1
fi

# Verify required files exist
if [ ! -f "$CC_SRC_PATH/package.json" ]; then
    echo -e "${RED}ERROR: package.json not found in chaincode directory${NC}"
    exit 1
fi

if [ ! -f "$CC_SRC_PATH/index.js" ]; then
    echo -e "${RED}ERROR: index.js not found in chaincode directory${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Chaincode source directory verified: $CC_SRC_PATH${NC}"

# Set common environment variables
export FABRIC_CFG_PATH="${PROJECT_ROOT}/network"
export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA="${PROJECT_ROOT}/network/crypto-config/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem"

# Organization paths
CREDITOR_ORG_PATH="${PROJECT_ROOT}/network/crypto-config/peerOrganizations/creditor.iu-network.com"
DEBTOR_ORG_PATH="${PROJECT_ROOT}/network/crypto-config/peerOrganizations/debtor.iu-network.com"
ADMIN_ORG_PATH="${PROJECT_ROOT}/network/crypto-config/peerOrganizations/admin.iu-network.com"

# Set environment variables for organizations
setGlobals() {
    local ORG=$1
    echo -e "${YELLOW}Setting environment variables for Organization $ORG${NC}"
    
    if [ $ORG -eq 1 ]; then
        export CORE_PEER_LOCALMSPID="CreditorMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE="${CREDITOR_ORG_PATH}/peers/peer0.creditor.iu-network.com/tls/ca.crt"
        export CORE_PEER_MSPCONFIGPATH="${CREDITOR_ORG_PATH}/users/Admin@creditor.iu-network.com/msp"
        export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051
        echo "  - Organization: Creditor"
        echo "  - MSP ID: CreditorMSP"
        echo "  - Peer Address: peer0.creditor.iu-network.com:7051"
    elif [ $ORG -eq 2 ]; then
        export CORE_PEER_LOCALMSPID="DebtorMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE="${DEBTOR_ORG_PATH}/peers/peer0.debtor.iu-network.com/tls/ca.crt"
        export CORE_PEER_MSPCONFIGPATH="${DEBTOR_ORG_PATH}/users/Admin@debtor.iu-network.com/msp"
        export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051
        echo "  - Organization: Debtor"
        echo "  - MSP ID: DebtorMSP"
        echo "  - Peer Address: peer0.debtor.iu-network.com:8051"
    elif [ $ORG -eq 3 ]; then
        export CORE_PEER_LOCALMSPID="AdminMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE="${ADMIN_ORG_PATH}/peers/peer0.admin.iu-network.com/tls/ca.crt"
        export CORE_PEER_MSPCONFIGPATH="${ADMIN_ORG_PATH}/users/Admin@admin.iu-network.com/msp"
        export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051
        echo "  - Organization: Admin"
        echo "  - MSP ID: AdminMSP"
        echo "  - Peer Address: peer0.admin.iu-network.com:9051"
    fi
}

# Verify docker containers are running
verifyContainers() {
    echo -e "${YELLOW}🔍 Verifying Docker containers are running...${NC}"
    
    REQUIRED_CONTAINERS=(
        "peer0.creditor.iu-network.com"
        "peer0.debtor.iu-network.com"
        "peer0.admin.iu-network.com"
        "orderer.iu-network.com"
        "cli"
    )
    
    for container in "${REQUIRED_CONTAINERS[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            echo -e "${GREEN}  ✅ $container is running${NC}"
        else
            echo -e "${RED}  ❌ $container is not running${NC}"
            echo "Please start the network first using start-network.sh"
            exit 1
        fi
    done
}

# Package chaincode using CLI container
packageChaincode() {
    echo -e "${BLUE}📦 Packaging chaincode (${CHAINCODE_NAME}_${CHAINCODE_VERSION})${NC}"
    
    # Clean up any existing package
    rm -f ${CHAINCODE_NAME}.tar.gz
    
    # Use the CLI container to package chaincode
    docker exec cli peer lifecycle chaincode package \
        /opt/gopath/src/github.com/hyperledger/fabric/peer/${CHAINCODE_NAME}.tar.gz \
        --path /opt/gopath/src/github.com/chaincode/${CHAINCODE_NAME} \
        --lang ${CC_RUNTIME_LANGUAGE} \
        --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}
    
    if [ $? -eq 0 ]; then
        # Copy the package from container to host
        docker cp cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/${CHAINCODE_NAME}.tar.gz .
        echo -e "${GREEN}✅ Chaincode packaged successfully: ${CHAINCODE_NAME}.tar.gz${NC}"
        ls -la ${CHAINCODE_NAME}.tar.gz
    else
        echo -e "${RED}❌ Failed to package chaincode${NC}"
        exit 1
    fi
}

# Install chaincode on peer using CLI container
installChaincode() {
    local ORG=$1
    local ORG_NAME=""
    local PEER_ADDRESS=""
    
    case $ORG in
        1)
            ORG_NAME="Creditor"
            PEER_ADDRESS="peer0.creditor.iu-network.com:7051"
            MSP_ID="CreditorMSP"
            TLS_ROOTCERT="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt"
            MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp"
            ;;
        2)
            ORG_NAME="Debtor"
            PEER_ADDRESS="peer0.debtor.iu-network.com:8051"
            MSP_ID="DebtorMSP"
            TLS_ROOTCERT="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt"
            MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp"
            ;;
        3)
            ORG_NAME="Admin"
            PEER_ADDRESS="peer0.admin.iu-network.com:9051"
            MSP_ID="AdminMSP"
            TLS_ROOTCERT="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt"
            MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp"
            ;;
    esac

    echo -e "${BLUE}🏗 Installing chaincode on $ORG_NAME peer ($PEER_ADDRESS)${NC}"

    docker exec \
        -e CORE_PEER_LOCALMSPID=${MSP_ID} \
        -e CORE_PEER_TLS_ROOTCERT_FILE=${TLS_ROOTCERT} \
        -e CORE_PEER_MSPCONFIGPATH=${MSPCONFIGPATH} \
        -e CORE_PEER_ADDRESS=${PEER_ADDRESS} \
        cli peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/${CHAINCODE_NAME}.tar.gz || true
}

# Query installed chaincode package ID on a peer
queryInstalled() {
    local ORG=$1
    setGlobals $ORG
    docker exec cli peer lifecycle chaincode queryinstalled >&log.txt
    cat log.txt
    PACKAGE_ID=$(sed -n "/${CHAINCODE_NAME}_${CHAINCODE_VERSION}/{s/^Package ID: \(.*\), Label: .*/\1/p;q}" log.txt)
    echo -e "${GREEN}📦 Package ID: ${PACKAGE_ID}${NC}"
}

# Approve chaincode for an org
approveForMyOrg() {
    local ORG=$1
    setGlobals $ORG
    echo -e "${BLUE}✅ Approving chaincode for organization $ORG${NC}"

    PEER_ADDRESS="peer0.creditor.iu-network.com:7051"
    [ $ORG -eq 2 ] && PEER_ADDRESS="peer0.debtor.iu-network.com:8051"
    [ $ORG -eq 3 ] && PEER_ADDRESS="peer0.admin.iu-network.com:9051"

    docker exec cli peer lifecycle chaincode approveformyorg \
        -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com \
        --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} \
        --package-id ${PACKAGE_ID} --sequence ${CHAINCODE_SEQUENCE} --tls \
        --cafile ${ORDERER_CA} \
        --peerAddresses ${PEER_ADDRESS} \
        --tlsRootCertFiles ${CORE_PEER_TLS_ROOTCERT_FILE} || true
}

# Check commit readiness
checkCommitReadiness() {
    setGlobals 1
    echo -e "${BLUE}🔎 Checking commit readiness...${NC}"
    docker exec cli peer lifecycle chaincode checkcommitreadiness \
        --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} \
        --sequence ${CHAINCODE_SEQUENCE} --tls --cafile ${ORDERER_CA} --output json
}

# Commit chaincode definition
commitChaincode() {
    setGlobals 1
    echo -e "${BLUE}🧾 Committing chaincode definition...${NC}"
    docker exec cli peer lifecycle chaincode commit \
        -o orderer.iu-network.com:7050 --ordererTLSHostnameOverride orderer.iu-network.com \
        --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} \
        --sequence ${CHAINCODE_SEQUENCE} --tls --cafile ${ORDERER_CA} \
        --peerAddresses peer0.creditor.iu-network.com:7051 --tlsRootCertFiles ${CREDITOR_ORG_PATH}/peers/peer0.creditor.iu-network.com/tls/ca.crt \
        --peerAddresses peer0.debtor.iu-network.com:8051 --tlsRootCertFiles ${DEBTOR_ORG_PATH}/peers/peer0.debtor.iu-network.com/tls/ca.crt \
        --peerAddresses peer0.admin.iu-network.com:9051 --tlsRootCertFiles ${ADMIN_ORG_PATH}/peers/peer0.admin.iu-network.com/tls/ca.crt
}

# Init (if needed)
invokeInit() {
    setGlobals 1
    echo -e "${BLUE}🚀 Invoking InitLedger...${NC}"
    docker exec cli peer chaincode invoke -o orderer.iu-network.com:7050 \
        --ordererTLSHostnameOverride orderer.iu-network.com --tls --cafile ${ORDERER_CA} \
        -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} \
        --peerAddresses peer0.creditor.iu-network.com:7051 --tlsRootCertFiles ${CREDITOR_ORG_PATH}/peers/peer0.creditor.iu-network.com/tls/ca.crt \
        --peerAddresses peer0.debtor.iu-network.com:8051 --tlsRootCertFiles ${DEBTOR_ORG_PATH}/peers/peer0.debtor.iu-network.com/tls/ca.crt \
        --peerAddresses peer0.admin.iu-network.com:9051 --tlsRootCertFiles ${ADMIN_ORG_PATH}/peers/peer0.admin.iu-network.com/tls/ca.crt \
        -c '{"function":"InitLedger","Args":[]}' || true
}

main() {
    verifyContainers
    packageChaincode
    installChaincode 1
    installChaincode 2
    installChaincode 3
    queryInstalled 1
    approveForMyOrg 1
    queryInstalled 2
    approveForMyOrg 2
    queryInstalled 3
    approveForMyOrg 3
    checkCommitReadiness
    commitChaincode
    sleep 2
    invokeInit
    echo -e "${GREEN}🎉 Deployment finished${NC}"
}

main "$@"