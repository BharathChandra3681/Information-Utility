#!/bin/bash

# Make all scripts executable

echo "Setting execute permissions on scripts..."

chmod +x start-network.sh
chmod +x start-network-simple.sh  
chmod +x diagnose-network.sh
chmod +x test-network.sh
chmod +x scripts/createChannel.sh
chmod +x scripts/deployChaincode.sh 2>/dev/null || echo "Note: deployChaincode.sh not found"

echo "Execute permissions set successfully!"

echo ""
echo "Available startup options:"
echo "1. Full diagnostic: ./diagnose-network.sh"
echo "2. Simple startup: ./start-network-simple.sh" 
echo "3. Full startup: ./start-network.sh up"

echo ""
echo "For step-by-step guidance, see: STARTUP_GUIDE.md"
