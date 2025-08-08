#!/bin/bash

echo "🚀 CREATING CHANNELS WITH CORRECT OSNADMIN SYNTAX"
echo "================================================"

echo "📡 Step 1: Creating financial-operations-channel..."

docker exec cli bash -c '
echo "🔧 Using correct osnadmin syntax to create financial-operations-channel..."

osnadmin channel join \
    --channelID financial-operations-channel \
    --config-block ./channel-artifacts/financial-operations-channel.tx \
    --orderer-address orderer.iu-network.com:7053 \
    --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem \
    --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt \
    --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.key

echo "✅ financial-operations-channel creation attempted!"
'

echo ""
echo "📡 Step 2: Creating audit-compliance-channel..."

docker exec cli bash -c '
echo "🔧 Creating audit-compliance-channel..."

osnadmin channel join \
    --channelID audit-compliance-channel \
    --config-block ./channel-artifacts/audit-compliance-channel.tx \
    --orderer-address orderer.iu-network.com:7053 \
    --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem \
    --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt \
    --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.key

echo "✅ audit-compliance-channel creation attempted!"
'

echo ""
echo "📋 Step 3: List all channels on orderer..."

docker exec cli bash -c '
echo "📊 Listing all channels on orderer..."

osnadmin channel list \
    --orderer-address orderer.iu-network.com:7053 \
    --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem \
    --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt \
    --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.key
'

echo ""
echo "🔗 Step 4: If channels exist, join peers..."

docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true

echo "📥 Fetching genesis block for financial-operations-channel..."

# Set up Admin peer environment
export CORE_PEER_LOCALMSPID="AdminMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

# Try to fetch the genesis block
peer channel fetch 0 financial-operations-genesis.block \
    -o orderer.iu-network.com:7050 \
    -c financial-operations-channel \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem

# If successful, join the peer
if [ -f "financial-operations-genesis.block" ]; then
    echo "✅ Got genesis block! Joining Admin peer to financial-operations-channel..."
    peer channel join -b financial-operations-genesis.block
    
    echo "📊 Verifying channel membership:"
    peer channel list
    
    echo ""
    echo "🎉 SUCCESS! Channel is active and peer joined!"
else
    echo "⚠️ Could not fetch genesis block - channel may not be fully created yet"
fi
'

echo ""
echo "📊 FINAL STATUS CHECK..."
echo "======================="

# Check orderer logs for recent channel activity
echo "🔍 Recent orderer activity:"
docker logs --tail 5 orderer.iu-network.com

echo ""
echo "🔍 Recent peer activity:"
docker logs --tail 5 peer0.admin.iu-network.com
