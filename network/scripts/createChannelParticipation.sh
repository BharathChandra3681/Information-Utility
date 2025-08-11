#!/bin/bash

echo "🚀 CREATING CHANNELS - FABRIC 2.5+ CHANNEL PARTICIPATION API"
echo "============================================================="

echo "🏗️ Using Channel Participation API to create channels..."
echo ""

# Method 1: Try using osnadmin (if available)
echo "📡 Method 1: Using osnadmin channel participation..."

docker exec cli bash -c '
echo "🔧 Attempting to use osnadmin..."
which osnadmin || echo "osnadmin not available in CLI container"

# Method 2: Direct channel participation via REST API
echo ""
echo "📡 Method 2: Using channel participation REST API..."

# Create the channel using channel participation
curl -k -X POST \
  "https://orderer.iu-network.com:7053/participation/v1/channels" \
  -H "Content-Type: application/json" \
  --cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt \
  --key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.key \
  --cacert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/ca.crt \
  -d @./channel-artifacts/financial-operations-channel.tx

echo ""
echo "📋 Checking channel participation status..."
curl -k -X GET \
  "https://orderer.iu-network.com:7053/participation/v1/channels" \
  --cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt \
  --key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.key \
  --cacert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/ca.crt
'

echo ""
echo "🔧 Method 3: Bootstrap approach - Creating genesis block manually..."

# Create a bootstrap channel using the existing genesis block
docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer

echo "📦 Attempting to bootstrap channel from existing genesis..."

# Try to create channel using the existing genesis block approach
configtxgen -profile FinancialOperationsChannel \
    -outputBlock ./channel-artifacts/financial-operations-bootstrap.block \
    -channelID financial-operations-channel

ls -la ./channel-artifacts/
'

echo ""
echo "🎯 Alternative: Using Fabric Test Network approach..."

# Create the channel using a different method
docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer

echo "🔧 Creating channel with basic configuration..."

# Generate the channel genesis block directly
configtxgen -profile FinancialOperationsChannel \
    -outputBlock ./channel-artifacts/financial-operations-channel.block \
    -channelID financial-operations-channel

if [ -f "./channel-artifacts/financial-operations-channel.block" ]; then
    echo "✅ Channel block created successfully!"
    
    # Now join peers
    echo "🔗 Joining Admin peer..."
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="AdminMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
    export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051
    
    peer channel join -b ./channel-artifacts/financial-operations-channel.block
    
    # List channels to verify
    peer channel list
else
    echo "❌ Channel block creation failed"
fi
'

echo ""
echo "📊 FINAL STATUS CHECK..."
echo "========================="
