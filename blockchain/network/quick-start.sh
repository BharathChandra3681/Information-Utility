#!/bin/bash

# Quick Start Script - IU Unified Network
# One-command deployment for development

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🚀 Starting IU Unified Blockchain Network..."
echo ""

# Check if network is already running
if docker ps | grep -q "peer0.government.iu.com"; then
    echo "⚠️  Network appears to be running already."
    read -p "Do you want to restart? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping existing network..."
        cd "$SCRIPT_DIR" && bash ./deploy-network.sh --clean
    else
        echo "Exiting..."
        exit 0
    fi
else
    cd "$SCRIPT_DIR" && bash ./deploy-network.sh
fi
