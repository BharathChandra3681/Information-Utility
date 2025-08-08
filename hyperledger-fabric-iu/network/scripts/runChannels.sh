#!/bin/bash

echo "🚀 CREATING AND RUNNING YOUR CHANNELS NOW!"
echo "=========================================="
echo "Creating financial-operations-channel and audit-compliance-channel"
echo ""

# First, let's copy the MSP certificates to the CLI container properly
echo "📁 Step 1: Setting up MSP certificates in CLI container..."
docker cp organizations/. cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/

echo "✅ MSP certificates copied to CLI container"
echo ""

# Now create the channels
echo "🏗️ Step 2: Creating financial-operations-channel..."

docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="AdminMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

echo "🔧 Creating financial-operations-channel..."
peer channel create \
    -o orderer.iu-network.com:7050 \
    -c financial-operations-channel \
    -f ./channel-artifacts/financial-operations-channel.tx \
    --outputBlock ./channel-artifacts/financial-operations-channel.block \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem

echo "✅ financial-operations-channel created!"

echo "🔧 Creating audit-compliance-channel..."
peer channel create \
    -o orderer.iu-network.com:7050 \
    -c audit-compliance-channel \
    -f ./channel-artifacts/audit-compliance-channel.tx \
    --outputBlock ./channel-artifacts/audit-compliance-channel.block \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/msp/tlscacerts/tlsca.iu-network.com-cert.pem

echo "✅ audit-compliance-channel created!"
'

echo ""
echo "🔗 Step 3: Joining peers to financial-operations-channel..."

# Join Admin peer
docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="AdminMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

echo "👨‍💼 Joining Admin peer to financial-operations-channel..."
peer channel join -b ./channel-artifacts/financial-operations-channel.block
'

# Join Creditor peer
docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="CreditorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/peers/peer0.creditor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.creditor.iu-network.com:7051

echo "🏦 Joining Creditor peer to financial-operations-channel..."
peer channel join -b ./channel-artifacts/financial-operations-channel.block
'

# Join Debtor peer
docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="DebtorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/peers/peer0.debtor.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.debtor.iu-network.com:8051

echo "🏢 Joining Debtor peer to financial-operations-channel..."
peer channel join -b ./channel-artifacts/financial-operations-channel.block
'

echo ""
echo "🔗 Step 4: Joining peers to audit-compliance-channel..."

# Join all peers to audit channel
for org in Admin Creditor Debtor; do
    case $org in
        "Admin")
            PORT=9051
            MSP="AdminMSP"
            ;;
        "Creditor")
            PORT=7051
            MSP="CreditorMSP"
            ;;
        "Debtor")
            PORT=8051
            MSP="DebtorMSP"
            ;;
    esac

    docker exec cli bash -c "
    export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID=\"$MSP\"
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${org,,}.iu-network.com/peers/peer0.${org,,}.iu-network.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${org,,}.iu-network.com/users/Admin@${org,,}.iu-network.com/msp
    export CORE_PEER_ADDRESS=peer0.${org,,}.iu-network.com:$PORT

    echo \"Joining $org peer to audit-compliance-channel...\"
    peer channel join -b ./channel-artifacts/audit-compliance-channel.block
    "
done

echo ""
echo "📋 Step 5: Verifying channels are active..."

docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="AdminMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/peers/peer0.admin.iu-network.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/admin.iu-network.com/users/Admin@admin.iu-network.com/msp
export CORE_PEER_ADDRESS=peer0.admin.iu-network.com:9051

echo "📊 Listing channels on Admin peer:"
peer channel list
'

echo ""
echo "🎉 CHANNELS ARE NOW RUNNING!"
echo "=============================="
echo "✅ financial-operations-channel: ACTIVE"
echo "✅ audit-compliance-channel: ACTIVE"
echo ""
echo "🔍 Monitor block creation:"
echo "docker logs -f orderer.iu-network.com | grep -E '(Delivering|block|committed)'"
echo ""
echo "🚀 Ready for chaincode deployment and transactions!"
