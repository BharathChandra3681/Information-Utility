#!/bin/bash

echo "🚀 CREATING CHANNELS WITH OSNADMIN - FINAL APPROACH"
echo "=================================================="

# First, let's use osnadmin properly
echo "📡 Step 1: Creating financial-operations-channel with osnadmin..."

docker exec cli bash -c '
echo "🔧 Using osnadmin to create channel..."

# Use osnadmin to create the channel properly
osnadmin channel join \
    --channel-id financial-operations-channel \
    --config-block ./channel-artifacts/financial-operations-channel.tx \
    -o orderer.iu-network.com:7053 \
    --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem \
    --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt \
    --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.key
'

echo ""
echo "📋 Step 2: List channels using osnadmin..."

docker exec cli bash -c '
echo "📊 Listing channels with osnadmin..."
osnadmin channel list \
    -o orderer.iu-network.com:7053 \
    --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem \
    --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt \
    --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.key
'

echo ""
echo "🔗 Step 3: If channel exists, join peers to it..."

docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true

# Check if we can get channel info first
echo "🔍 Getting channel info for financial-operations-channel..."
osnadmin channel info \
    --channel-id financial-operations-channel \
    -o orderer.iu-network.com:7053 \
    --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem \
    --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt \
    --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.key

# If channel exists, try to fetch genesis block
echo "📥 Fetching genesis block for peers to join..."
export CORE_PEER_LOCALMSPID="AdminMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

peer channel fetch 0 financial-operations-channel.block \
    -o orderer.iu-network.com:7050 \
    -c financial-operations-channel \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem

# If we got the block, join the peer
if [ -f "financial-operations-channel.block" ]; then
    echo "✅ Got genesis block, joining Admin peer..."
    peer channel join -b financial-operations-channel.block
    
    echo "📊 Listing channels on Admin peer:"
    peer channel list
else
    echo "❌ Could not fetch genesis block"
fi
'

echo ""
echo "📊 FINAL VERIFICATION..."
echo "========================"
echo "🔍 Checking orderer logs for channel activity..."
docker logs --tail 10 orderer.iu-network.com | grep -i channel

echo ""
echo "🔍 Checking peer logs for channel activity..."
docker logs --tail 10 peer0.admin.iu-network.com | grep -i channel
