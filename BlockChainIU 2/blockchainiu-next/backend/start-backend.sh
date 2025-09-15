#!/bin/bash

# Set environment variables for the backend
export FABRIC_CHANNEL="financial-operations-channel"
export FABRIC_CHAINCODE="iu-basic"

# Creditor Organization
export FABRIC_CREDITOR_WALLET_PATH="./wallets/creditor"
export FABRIC_CREDITOR_CONNECTION_PROFILE="/Users/bharathchandranangunuri/Information Utility/network/organizations/peerOrganizations/creditor.iu-network.com/connection-creditor.json"
export FABRIC_CREDITOR_IDENTITY="admin"

# Debtor Organization  
export FABRIC_DEBTOR_WALLET_PATH="./wallets/debtor"
export FABRIC_DEBTOR_CONNECTION_PROFILE="/Users/bharathchandranangunuri/Information Utility/network/organizations/peerOrganizations/debtor.iu-network.com/connection-debtor.json"
export FABRIC_DEBTOR_IDENTITY="admin"

# Admin Organization
export FABRIC_ADMIN_WALLET_PATH="./wallets/admin"
export FABRIC_ADMIN_CONNECTION_PROFILE="/Users/bharathchandranangunuri/Information Utility/network/organizations/peerOrganizations/admin.iu-network.com/connection-admin.json"
export FABRIC_ADMIN_IDENTITY="admin"

# Server Configuration
export PORT=4001

# Start the backend
node src/server.js
