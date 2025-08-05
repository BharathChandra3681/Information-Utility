#!/bin/bash

# Information Utility Hyperledger Fabric Environment Setup Script
set -e

ROOTDIR=$(cd "$(dirname "$0")" && pwd)
export FABRIC_VERSION="2.4.0"
export CA_VERSION="1.5.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function println() {
  echo -e "$1"
}

function errorln() {
  println "${RED}ERROR: $1${NC}"
}

function successln() {
  println "${GREEN}$1${NC}"
}

function infoln() {
  println "${YELLOW}$1${NC}"
}

function checkPrerequisites() {
    infoln "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        errorln "Docker is not installed. Please install Docker Desktop from https://docs.docker.com/desktop/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        errorln "Docker Compose is not installed. Please install Docker Desktop which includes Compose"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        errorln "Node.js is not installed. Please install Node.js from https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        errorln "npm is not installed. Please install Node.js which includes npm"
        exit 1
    fi
    
    successln "All prerequisites are installed!"
}

function downloadFabricBinaries() {
    infoln "Downloading Hyperledger Fabric binaries..."
    
    # Create bin directory if it doesn't exist
    mkdir -p ${ROOTDIR}/network/bin
    
    # Download and extract Fabric binaries
    cd /tmp
    curl -sSL https://bit.ly/2ysbOFE | bash -s -- ${FABRIC_VERSION} ${CA_VERSION}
    
    # Move binaries to network/bin
    if [ -d "fabric-samples/bin" ]; then
        cp fabric-samples/bin/* ${ROOTDIR}/network/bin/
        rm -rf fabric-samples
        successln "Fabric binaries downloaded successfully!"
    else
        errorln "Failed to download Fabric binaries"
        exit 1
    fi
    
    cd ${ROOTDIR}
}

function setupApplicationDependencies() {
    infoln "Setting up Node.js application dependencies..."
    
    # Check Node.js version
    NODE_VERSION=$(node --version)
    infoln "Current Node.js version: $NODE_VERSION"
    
    # Install root project dependencies
    npm install
    
    # Install application dependencies
    cd ${ROOTDIR}/application
    npm install
    
    # Create wallet directory
    mkdir -p wallet
    
    successln "Application dependencies installed!"
    cd ${ROOTDIR}
}

function setupChaincodeEnvironment() {
    infoln "Setting up Node.js chaincode environment..."
    
    # Install chaincode dependencies
    cd ${ROOTDIR}/chaincode/iu-basic
    npm install
    
    # Run tests to ensure everything works
    infoln "Running chaincode tests..."
    npm test
    
    successln "Chaincode environment setup complete!"
    cd ${ROOTDIR}
}

function pullDockerImages() {
    infoln "Pulling required Docker images for Node.js chaincode..."
    
    # Pull Fabric Docker images
    docker pull hyperledger/fabric-peer:${FABRIC_VERSION}
    docker pull hyperledger/fabric-orderer:${FABRIC_VERSION}
    docker pull hyperledger/fabric-tools:${FABRIC_VERSION}
    docker pull hyperledger/fabric-ccenv:${FABRIC_VERSION}
    docker pull hyperledger/fabric-nodeenv:${FABRIC_VERSION}
    docker pull node:16-alpine
    
    successln "Docker images pulled successfully!"
}

function displayInstructions() {
    successln "\n🎉 Information Utility Hyperledger Fabric setup complete!"
    
    println "\n📋 Next steps:"
    println "1. Start the network:"
    println "   cd network && ./network.sh up"
    println ""
    println "2. Create and join channel:"
    println "   ./network.sh channel"
    println ""
    println "3. Deploy chaincode:"
    println "   ./network.sh deployCC"
    println ""
    println "4. Start the API server:"
    println "   cd ../application && npm start"
    println ""
    println "5. Test the API:"
    println "   npm test"
    println ""
    println "📚 For detailed instructions, see README.md"
    println ""
    println "🌐 Once running, the API will be available at: http://localhost:3000"
    println "🔍 Health check endpoint: http://localhost:3000/api/health"
}

function main() {
    infoln "🚀 Setting up Information Utility Hyperledger Fabric Environment\n"
    
    checkPrerequisites
    downloadFabricBinaries
    setupApplicationDependencies  
    setupChaincodeEnvironment
    pullDockerImages
    displayInstructions
}

main "$@"
