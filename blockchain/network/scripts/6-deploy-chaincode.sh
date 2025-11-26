#!/bin/bash
# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"


# Chaincode Deployment Script - IU Unified Network
# Packages, installs, approves, and commits the unified chaincode to both channels

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NETWORK_DIR="$( dirname "$SCRIPT_DIR" )"
BASE_DIR="$( dirname "$NETWORK_DIR" )"
CHAINCODE_DIR="${BASE_DIR}/chaincode/iu-unified"

# Network configuration
CHAINCODE_NAME="iu-unified"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE="1"
CHANNEL_GOVERNANCE="governance-channel"
CHANNEL_FINANCIAL="financial-operations-channel"

# Organization configurations
ORDERER_CA=""${NETWORK_DIR}/crypto-config/ordererOrganizations/iu.com/orderers/orderer.iu.com/msp/tlscacerts/tlsca.iu.com-cert.pem"
GOVERNMENT_PEER="peer0.government.iu.com:7051"
GOVERNMENT_TLS_CA=""${NETWORK_DIR}/crypto-config/peerOrganizations/government.iu.com/peers/peer0.government.iu.com/tls/ca.crt"
CREDITOR_PEER="peer0.creditor.iu.com:8051"
CREDITOR_TLS_CA=""${NETWORK_DIR}/crypto-config/peerOrganizations/creditor.iu.com/peers/peer0.creditor.iu.com/tls/ca.crt"
DEBTOR_PEER="peer0.debtor.iu.com:9051"
DEBTOR_TLS_CA=""${NETWORK_DIR}/crypto-config/peerOrganizations/debtor.iu.com/peers/peer0.debtor.iu.com/tls/ca.crt"

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  IU UNIFIED CHAINCODE DEPLOYMENT${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# ========================================================================
# STEP 1: Package Chaincode
# ========================================================================
echo -e "${YELLOW}[STEP 1/8]${NC} Packaging chaincode..."

# Install dependencies first
cd "${CHAINCODE_DIR}"
if [ ! -d "node_modules" ]; then
    echo "Installing chaincode dependencies..."
    npm install
fi

# Create package directory
PACKAGE_DIR=""${NETWORK_DIR}/chaincode-packages"
mkdir -p "${PACKAGE_DIR}"

# Set environment for packaging
export FABRIC_CFG_PATH=""${NETWORK_DIR}/config"
export CORE_PEER_MSPCONFIGPATH=""${NETWORK_DIR}/crypto-config/peerOrganizations/government.iu.com/users/Admin@government.iu.com/msp"

# Package the chaincode
cd "${NETWORK_DIR}"
docker exec cli peer lifecycle chaincode package \
    "${PACKAGE_DIR}/${CHAINCODE_NAME}.tar.gz" \
    --path "/opt/gopath/src/github.com/chaincode/iu-unified" \
    --lang node \
    --label "${CHAINCODE_NAME}_${CHAINCODE_VERSION}"

echo -e "${GREEN}✓ Chaincode packaged successfully${NC}"
echo ""

# ========================================================================
# STEP 2: Install on Government Peer
# ========================================================================
echo -e "${YELLOW}[STEP 2/8]${NC} Installing chaincode on Government peer..."

docker exec \
    -e CORE_PEER_LOCALMSPID="GovernmentMSP" \
    -e CORE_PEER_ADDRESS="${GOVERNMENT_PEER}" \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/government.iu.com/peers/peer0.government.iu.com/tls/ca.crt" \
    -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/government.iu.com/users/Admin@government.iu.com/msp" \
    cli peer lifecycle chaincode install "/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-packages/${CHAINCODE_NAME}.tar.gz"

echo -e "${GREEN}✓ Installed on Government peer${NC}"
echo ""

# ========================================================================
# STEP 3: Install on Creditor Peer
# ========================================================================
echo -e "${YELLOW}[STEP 3/8]${NC} Installing chaincode on Creditor peer..."

docker exec \
    -e CORE_PEER_LOCALMSPID="CreditorMSP" \
    -e CORE_PEER_ADDRESS="${CREDITOR_PEER}" \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditor.iu.com/peers/peer0.creditor.iu.com/tls/ca.crt" \
    -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditor.iu.com/users/Admin@creditor.iu.com/msp" \
    cli peer lifecycle chaincode install "/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-packages/${CHAINCODE_NAME}.tar.gz"

echo -e "${GREEN}✓ Installed on Creditor peer${NC}"
echo ""

# ========================================================================
# STEP 4: Install on Debtor Peer
# ========================================================================
echo -e "${YELLOW}[STEP 4/8]${NC} Installing chaincode on Debtor peer..."

docker exec \
    -e CORE_PEER_LOCALMSPID="DebtorMSP" \
    -e CORE_PEER_ADDRESS="${DEBTOR_PEER}" \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/debtor.iu.com/peers/peer0.debtor.iu.com/tls/ca.crt" \
    -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/debtor.iu.com/users/Admin@debtor.iu.com/msp" \
    cli peer lifecycle chaincode install "/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-packages/${CHAINCODE_NAME}.tar.gz"

echo -e "${GREEN}✓ Installed on Debtor peer${NC}"
echo ""

# ========================================================================
# STEP 5: Query Package ID
# ========================================================================
echo -e "${YELLOW}[STEP 5/8]${NC} Querying installed chaincode..."

PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep "${CHAINCODE_NAME}_${CHAINCODE_VERSION}" | sed -n 's/^Package ID: \(.*\), Label: .*$/\1/p' | head -n 1)

if [ -z "$PACKAGE_ID" ]; then
    echo -e "${RED}✗ Failed to get package ID${NC}"
    exit 1
fi

echo -e "Package ID: ${GREEN}${PACKAGE_ID}${NC}"
echo ""

# ========================================================================
# STEP 6: Approve Chaincode for Governance Channel
# ========================================================================
echo -e "${YELLOW}[STEP 6/8]${NC} Approving chaincode for ${CHANNEL_GOVERNANCE}..."

# Approve for Government (only org on governance channel)
docker exec \
    -e CORE_PEER_LOCALMSPID="GovernmentMSP" \
    -e CORE_PEER_ADDRESS="${GOVERNMENT_PEER}" \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/government.iu.com/peers/peer0.government.iu.com/tls/ca.crt" \
    -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/government.iu.com/users/Admin@government.iu.com/msp" \
    cli peer lifecycle chaincode approveformyorg \
    -o orderer.iu.com:7050 \
    --tls \
    --cafile "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/iu.com/orderers/orderer.iu.com/msp/tlscacerts/tlsca.iu.com-cert.pem" \
    --channelID "${CHANNEL_GOVERNANCE}" \
    --name "${CHAINCODE_NAME}" \
    --version "${CHAINCODE_VERSION}" \
    --package-id "${PACKAGE_ID}" \
    --sequence "${CHAINCODE_SEQUENCE}"

echo -e "${GREEN}✓ Approved for governance-channel${NC}"
echo ""

# ========================================================================
# STEP 7: Approve Chaincode for Financial Operations Channel
# ========================================================================
echo -e "${YELLOW}[STEP 7/8]${NC} Approving chaincode for ${CHANNEL_FINANCIAL}..."

# Approve for Government
docker exec \
    -e CORE_PEER_LOCALMSPID="GovernmentMSP" \
    -e CORE_PEER_ADDRESS="${GOVERNMENT_PEER}" \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/government.iu.com/peers/peer0.government.iu.com/tls/ca.crt" \
    -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/government.iu.com/users/Admin@government.iu.com/msp" \
    cli peer lifecycle chaincode approveformyorg \
    -o orderer.iu.com:7050 \
    --tls \
    --cafile "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/iu.com/orderers/orderer.iu.com/msp/tlscacerts/tlsca.iu.com-cert.pem" \
    --channelID "${CHANNEL_FINANCIAL}" \
    --name "${CHAINCODE_NAME}" \
    --version "${CHAINCODE_VERSION}" \
    --package-id "${PACKAGE_ID}" \
    --sequence "${CHAINCODE_SEQUENCE}" \
    --signature-policy "OR('GovernmentMSP.peer','CreditorMSP.peer','DebtorMSP.peer')"

echo -e "${GREEN}✓ Government approved${NC}"

# Approve for Creditor
docker exec \
    -e CORE_PEER_LOCALMSPID="CreditorMSP" \
    -e CORE_PEER_ADDRESS="${CREDITOR_PEER}" \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditor.iu.com/peers/peer0.creditor.iu.com/tls/ca.crt" \
    -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditor.iu.com/users/Admin@creditor.iu.com/msp" \
    cli peer lifecycle chaincode approveformyorg \
    -o orderer.iu.com:7050 \
    --tls \
    --cafile "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/iu.com/orderers/orderer.iu.com/msp/tlscacerts/tlsca.iu.com-cert.pem" \
    --channelID "${CHANNEL_FINANCIAL}" \
    --name "${CHAINCODE_NAME}" \
    --version "${CHAINCODE_VERSION}" \
    --package-id "${PACKAGE_ID}" \
    --sequence "${CHAINCODE_SEQUENCE}" \
    --signature-policy "OR('GovernmentMSP.peer','CreditorMSP.peer','DebtorMSP.peer')"

echo -e "${GREEN}✓ Creditor approved${NC}"

# Approve for Debtor
docker exec \
    -e CORE_PEER_LOCALMSPID="DebtorMSP" \
    -e CORE_PEER_ADDRESS="${DEBTOR_PEER}" \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/debtor.iu.com/peers/peer0.debtor.iu.com/tls/ca.crt" \
    -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/debtor.iu.com/users/Admin@debtor.iu.com/msp" \
    cli peer lifecycle chaincode approveformyorg \
    -o orderer.iu.com:7050 \
    --tls \
    --cafile "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/iu.com/orderers/orderer.iu.com/msp/tlscacerts/tlsca.iu.com-cert.pem" \
    --channelID "${CHANNEL_FINANCIAL}" \
    --name "${CHAINCODE_NAME}" \
    --version "${CHAINCODE_VERSION}" \
    --package-id "${PACKAGE_ID}" \
    --sequence "${CHAINCODE_SEQUENCE}" \
    --signature-policy "OR('GovernmentMSP.peer','CreditorMSP.peer','DebtorMSP.peer')"

echo -e "${GREEN}✓ Debtor approved${NC}"
echo -e "${GREEN}✓ All organizations approved for financial-operations-channel${NC}"
echo ""

# ========================================================================
# STEP 8: Commit Chaincode to Both Channels
# ========================================================================
echo -e "${YELLOW}[STEP 8/8]${NC} Committing chaincode..."

# Commit to governance-channel
echo "Committing to ${CHANNEL_GOVERNANCE}..."
docker exec \
    -e CORE_PEER_LOCALMSPID="GovernmentMSP" \
    -e CORE_PEER_ADDRESS="${GOVERNMENT_PEER}" \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/government.iu.com/peers/peer0.government.iu.com/tls/ca.crt" \
    -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/government.iu.com/users/Admin@government.iu.com/msp" \
    cli peer lifecycle chaincode commit \
    -o orderer.iu.com:7050 \
    --tls \
    --cafile "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/iu.com/orderers/orderer.iu.com/msp/tlscacerts/tlsca.iu.com-cert.pem" \
    --channelID "${CHANNEL_GOVERNANCE}" \
    --name "${CHAINCODE_NAME}" \
    --version "${CHAINCODE_VERSION}" \
    --sequence "${CHAINCODE_SEQUENCE}" \
    --peerAddresses "${GOVERNMENT_PEER}" \
    --tlsRootCertFiles "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/government.iu.com/peers/peer0.government.iu.com/tls/ca.crt"

echo -e "${GREEN}✓ Committed to governance-channel${NC}"

# Commit to financial-operations-channel
echo "Committing to ${CHANNEL_FINANCIAL}..."
docker exec \
    -e CORE_PEER_LOCALMSPID="GovernmentMSP" \
    -e CORE_PEER_ADDRESS="${GOVERNMENT_PEER}" \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/government.iu.com/peers/peer0.government.iu.com/tls/ca.crt" \
    -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/government.iu.com/users/Admin@government.iu.com/msp" \
    cli peer lifecycle chaincode commit \
    -o orderer.iu.com:7050 \
    --tls \
    --cafile "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/iu.com/orderers/orderer.iu.com/msp/tlscacerts/tlsca.iu.com-cert.pem" \
    --channelID "${CHANNEL_FINANCIAL}" \
    --name "${CHAINCODE_NAME}" \
    --version "${CHAINCODE_VERSION}" \
    --sequence "${CHAINCODE_SEQUENCE}" \
    --signature-policy "OR('GovernmentMSP.peer','CreditorMSP.peer','DebtorMSP.peer')" \
    --peerAddresses "${GOVERNMENT_PEER}" \
    --tlsRootCertFiles "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/government.iu.com/peers/peer0.government.iu.com/tls/ca.crt" \
    --peerAddresses "${CREDITOR_PEER}" \
    --tlsRootCertFiles "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditor.iu.com/peers/peer0.creditor.iu.com/tls/ca.crt" \
    --peerAddresses "${DEBTOR_PEER}" \
    --tlsRootCertFiles "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/debtor.iu.com/peers/peer0.debtor.iu.com/tls/ca.crt"

echo -e "${GREEN}✓ Committed to financial-operations-channel${NC}"
echo ""

# ========================================================================
# VERIFY DEPLOYMENT
# ========================================================================
echo -e "${BLUE}Verifying deployment...${NC}"

# Query committed chaincode on governance channel
echo "Checking governance-channel..."
docker exec cli peer lifecycle chaincode querycommitted --channelID "${CHANNEL_GOVERNANCE}" --name "${CHAINCODE_NAME}"

# Query committed chaincode on financial channel
echo ""
echo "Checking financial-operations-channel..."
docker exec cli peer lifecycle chaincode querycommitted --channelID "${CHANNEL_FINANCIAL}" --name "${CHAINCODE_NAME}"

echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  CHAINCODE DEPLOYMENT COMPLETED${NC}"
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}Chaincode '${CHAINCODE_NAME}' v${CHAINCODE_VERSION} is now active on both channels${NC}"
echo ""
