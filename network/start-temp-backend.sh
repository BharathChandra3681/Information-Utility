#!/bin/bash

echo "🚀 Starting Temporary Fabric Backend Solution..."
echo "This bypasses the orderer issues and provides working loan submission"

# Install required packages if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing required packages..."
    npm init -y
    npm install express cors
fi

# Start the temporary backend
echo "🔄 Starting temporary backend on port 4002..."
node temp-solution.js
