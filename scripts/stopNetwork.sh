#!/bin/bash

# Stop Network Script for IU Network

echo "🛑 Stopping Information Utility Network..."
echo "=========================================="

# Function to stop Docker containers
function stopContainers() {
    echo "🐳 Stopping Docker containers..."
    
    docker-compose -f network/docker-compose.yaml down --volumes --remove-orphans
    
    if [ $? -eq 0 ]; then
        echo "✅ Docker containers stopped"
    else
        echo "⚠️  Some containers may not have stopped cleanly"
    fi
}

# Function to clean up Docker resources
function cleanupDocker() {
    echo "🧹 Cleaning up Docker resources..."
    
    # Remove chaincode containers
    docker rm -f $(docker ps -aq --filter label=service=hyperledger-fabric) 2>/dev/null || true
    
    # Remove chaincode images
    docker rmi -f $(docker images -q --filter reference='dev-peer*') 2>/dev/null || true
    
    # Remove unused volumes
    docker volume prune -f
    
    echo "✅ Docker cleanup completed"
}

# Function to clean up generated files
function cleanupFiles() {
    echo "📁 Cleaning up generated files..."
    
    # Clean up crypto material
    rm -rf network/organizations/peerOrganizations
    rm -rf network/organizations/ordererOrganizations
    
    # Clean up genesis block
    rm -rf network/system-genesis-block
    
    # Clean up channel artifacts
    rm -rf network/channel-artifacts
    
    # Clean up client wallets
    rm -rf client-applications/*/wallet*
    
    # Clean up logs
    rm -f *.log
    rm -f log.txt
    
    echo "✅ File cleanup completed"
}

# Function to display cleanup status
function displayStatus() {
    echo ""
    echo "📊 Cleanup Status:"
    echo "=================="
    
    # Check for remaining containers
    REMAINING_CONTAINERS=$(docker ps -q --filter label=service=hyperledger-fabric | wc -l)
    if [ $REMAINING_CONTAINERS -eq 0 ]; then
        echo "✅ No Fabric containers running"
    else
        echo "⚠️  $REMAINING_CONTAINERS Fabric containers still running"
        docker ps --filter label=service=hyperledger-fabric
    fi
    
    # Check for remaining images
    CHAINCODE_IMAGES=$(docker images -q --filter reference='dev-peer*' | wc -l)
    if [ $CHAINCODE_IMAGES -eq 0 ]; then
        echo "✅ No chaincode images remaining"
    else
        echo "⚠️  $CHAINCODE_IMAGES chaincode images still present"
    fi
}

# Parse command line arguments
FULL_CLEANUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            FULL_CLEANUP=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--full]"
            echo "  --full    Perform full cleanup including crypto material"
            exit 0
            ;;
        *)
            echo "Unknown parameter: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Main execution
echo "Stopping Information Utility Hyperledger Fabric Network"
echo "======================================================"

# Step 1: Stop Docker containers
stopContainers

# Step 2: Clean up Docker resources
cleanupDocker

# Step 3: Clean up files (if requested)
if [ "$FULL_CLEANUP" = true ]; then
    echo ""
    read -p "🚨 This will delete all crypto material and network artifacts. Continue? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanupFiles
    else
        echo "⚠️  Skipping file cleanup. Network can be restarted without regenerating crypto material."
    fi
else
    echo ""
    echo "💡 Tip: Use --full flag to clean up all generated files and crypto material"
fi

# Step 4: Display status
displayStatus

echo ""
echo "✅ Information Utility Network stopped successfully!"
echo "================================================="
echo ""
echo "📋 Next Steps:"
echo "   - To restart: ./scripts/startNetwork.sh"
echo "   - For full cleanup: ./scripts/stopNetwork.sh --full"
echo "   - To start fresh: ./scripts/stopNetwork.sh --full && ./scripts/startNetwork.sh"
