#!/bin/bash

echo "========================================="
echo "🔥 CREATING CHANNELS - FABRIC TEST NETWORK APPROACH"
echo "Using your diagram: financial-operations & audit-compliance"
echo "========================================="

# Generate the proper channel artifacts using configtxgen
echo "📦 Step 1: Generating channel artifacts..."

# Update configtx.yaml to match your channel names
cat > configtx.yaml << EOF
Organizations:
    - &OrdererOrg
        Name: OrdererOrg
        ID: OrdererMSP
        MSPDir: organizations/ordererOrganizations/iu-network.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('OrdererMSP.member')"
            Writers:
                Type: Signature
                Rule: "OR('OrdererMSP.member')"
            Admins:
                Type: Signature
                Rule: "OR('OrdererMSP.admin')"
        OrdererEndpoints:
            - orderer.iu-network.com:7050

    - &CreditorOrg
        Name: CreditorMSP
        ID: CreditorMSP
        MSPDir: organizations/peerOrganizations/creditor.iu-network.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('CreditorMSP.admin', 'CreditorMSP.peer', 'CreditorMSP.client')"
            Writers:
                Type: Signature
                Rule: "OR('CreditorMSP.admin', 'CreditorMSP.client')"
            Admins:
                Type: Signature
                Rule: "OR('CreditorMSP.admin')"
            Endorsement:
                Type: Signature
                Rule: "OR('CreditorMSP.peer')"
        AnchorPeers:
            - Host: peer0.creditor.iu-network.com
              Port: 7051

    - &DebtorOrg
        Name: DebtorMSP
        ID: DebtorMSP
        MSPDir: organizations/peerOrganizations/debtor.iu-network.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('DebtorMSP.admin', 'DebtorMSP.peer', 'DebtorMSP.client')"
            Writers:
                Type: Signature
                Rule: "OR('DebtorMSP.admin', 'DebtorMSP.client')"
            Admins:
                Type: Signature
                Rule: "OR('DebtorMSP.admin')"
            Endorsement:
                Type: Signature
                Rule: "OR('DebtorMSP.peer')"
        AnchorPeers:
            - Host: peer0.debtor.iu-network.com
              Port: 8051

    - &AdminOrg
        Name: AdminMSP
        ID: AdminMSP
        MSPDir: organizations/peerOrganizations/admin.iu-network.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('AdminMSP.admin', 'AdminMSP.peer', 'AdminMSP.client')"
            Writers:
                Type: Signature
                Rule: "OR('AdminMSP.admin', 'AdminMSP.client')"
            Admins:
                Type: Signature
                Rule: "OR('AdminMSP.admin')"
            Endorsement:
                Type: Signature
                Rule: "OR('AdminMSP.peer')"
        AnchorPeers:
            - Host: peer0.admin.iu-network.com
              Port: 9051

Capabilities:
    Channel: &ChannelCapabilities
        V2_0: true
    Orderer: &OrdererCapabilities
        V2_0: true
    Application: &ApplicationCapabilities
        V2_0: true

Application: &ApplicationDefaults
    Organizations:
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
        LifecycleEndorsement:
            Type: ImplicitMeta
            Rule: "MAJORITY Endorsement"
        Endorsement:
            Type: ImplicitMeta
            Rule: "MAJORITY Endorsement"
    Capabilities:
        <<: *ApplicationCapabilities

Orderer: &OrdererDefaults
    OrdererType: etcdraft
    Addresses:
        - orderer.iu-network.com:7050
    EtcdRaft:
        Consenters:
        - Host: orderer.iu-network.com
          Port: 7050
          ClientTLSCert: organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt
          ServerTLSCert: organizations/ordererOrganizations/iu-network.com/orderers/orderer.iu-network.com/tls/server.crt
    BatchTimeout: 2s
    BatchSize:
        MaxMessageCount: 10
        AbsoluteMaxBytes: 99 MB
        PreferredMaxBytes: 512 KB
    Organizations:
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
        BlockValidation:
            Type: ImplicitMeta
            Rule: "ANY Writers"

Channel: &ChannelDefaults
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
    Capabilities:
        <<: *ChannelCapabilities

Profiles:
    IUOrdererGenesis:
        <<: *ChannelDefaults
        Orderer:
            <<: *OrdererDefaults
            Organizations:
                - *OrdererOrg
            Capabilities:
                <<: *OrdererCapabilities
        Consortiums:
            IUConsortium:
                Organizations:
                    - *CreditorOrg
                    - *DebtorOrg
                    - *AdminOrg

    FinancialOperationsChannel:
        Consortium: IUConsortium
        <<: *ChannelDefaults
        Application:
            <<: *ApplicationDefaults
            Organizations:
                - *CreditorOrg
                - *DebtorOrg
                - *AdminOrg
            Capabilities:
                <<: *ApplicationCapabilities

    AuditComplianceChannel:
        Consortium: IUConsortium
        <<: *ChannelDefaults
        Application:
            <<: *ApplicationDefaults
            Organizations:
                - *AdminOrg
                - *CreditorOrg
                - *DebtorOrg
            Capabilities:
                <<: *ApplicationCapabilities
EOF

echo "✅ Updated configtx.yaml with your exact channel names"

# Copy configtx.yaml to CLI container
docker cp configtx.yaml cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/configtx.yaml

# Generate channel transactions
docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer

echo "🏗️  Generating financial-operations-channel transaction..."
configtxgen -profile FinancialOperationsChannel -outputCreateChannelTx ./channel-artifacts/financial-operations-channel.tx -channelID financial-operations-channel

echo "🏗️  Generating audit-compliance-channel transaction..."  
configtxgen -profile AuditComplianceChannel -outputCreateChannelTx ./channel-artifacts/audit-compliance-channel.tx -channelID audit-compliance-channel

echo "✅ Channel transaction files created"
ls -la ./channel-artifacts/
'

echo ""
echo "🎯 CHANNEL ARTIFACTS CREATED!"
echo "Next: Submit to orderer and join peers..."
