#!/bin/bash

echo "🚀 Information Utility Application Deployment Script"
echo "==================================================="

APP_DIR="/Users/bharathchandranangunuri/Information Utility/hyperledger-fabric-iu/application"
NODE_VERSION="18.17.0"
PORT_MAIN=4000
PORT_FINANCIAL=4001

echo ""
echo "📋 Deployment Overview"
echo "======================"
echo "• Main IU Application: Port $PORT_MAIN"
echo "• Financial Operations App: Port $PORT_FINANCIAL"
echo "• Test Suite: Comprehensive API testing"
echo "• Dependencies: Express, Fabric SDK, CORS"

echo ""
echo "🔧 Step 1: Environment Preparation"
echo "=================================="

# Check Node.js version
if command -v node &> /dev/null; then
    CURRENT_NODE=$(node --version | cut -d'v' -f2)
    echo "✅ Node.js detected: v$CURRENT_NODE"
else
    echo "❌ Node.js not found. Please install Node.js $NODE_VERSION or later"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm detected: v$NPM_VERSION"
else
    echo "❌ npm not found. Please install npm"
    exit 1
fi

echo ""
echo "📦 Step 2: Install Dependencies"
echo "==============================="
cd "$APP_DIR"

echo "Installing Node.js dependencies..."
npm install

# Add any missing dependencies
echo "Adding additional dependencies if needed..."
npm install --save axios dotenv winston morgan helmet express-rate-limit

echo ""
echo "🔍 Step 3: Dependency Verification"
echo "=================================="
echo "Installed packages:"
npm list --depth=0 2>/dev/null | grep -E "(express|fabric-network|cors|body-parser|axios)" || echo "⚠️  Some packages may need installation"

echo ""
echo "🌐 Step 4: Application Configuration"
echo "===================================="

# Create environment configuration
cat > .env << EOF
# Information Utility Application Configuration
NODE_ENV=development
PORT=$PORT_MAIN
FINANCIAL_PORT=$PORT_FINANCIAL

# Blockchain Network Configuration
CHANNEL_FINANCIAL=financial-operations-channel
CHANNEL_AUDIT=audit-compliance-channel
CHAINCODE_NAME=iu-chaincode

# Organization Configuration
ORG_CREDITOR_MSP=CreditorMSP
ORG_DEBTOR_MSP=DebtorMSP
ORG_ADMIN_MSP=AdminMSP

# Network Paths
NETWORK_PATH=../network
CRYPTO_PATH=../network/organizations

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/iu-app.log

# API Rate Limiting
API_RATE_LIMIT=100
API_RATE_WINDOW=900000

# TLS Configuration
TLS_ENABLED=true
TLS_CERT_PATH=../network/organizations
EOF

echo "✅ Environment configuration created (.env)"

# Create logs directory
mkdir -p logs
echo "✅ Logs directory created"

# Create wallet directories
mkdir -p wallet-creditor wallet-debtor wallet-admin
echo "✅ Wallet directories created"

echo ""
echo "🚀 Step 5: Application Startup"
echo "=============================="

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Check ports
check_port $PORT_MAIN
check_port $PORT_FINANCIAL

echo ""
echo "📱 Starting Information Utility Applications..."
echo "=============================================="

# Start main IU application in background
echo "🔄 Starting Main IU Application (Port $PORT_MAIN)..."
PORT=$PORT_MAIN nohup node app-iu-updated.js > logs/iu-main.log 2>&1 &
MAIN_PID=$!
echo "✅ Main IU Application started (PID: $MAIN_PID)"

# Wait a moment for startup
sleep 3

# Start financial operations application in background
echo "🔄 Starting Financial Operations Application (Port $PORT_FINANCIAL)..."
PORT=$PORT_FINANCIAL nohup node app-financial.js > logs/iu-financial.log 2>&1 &
FINANCIAL_PID=$!
echo "✅ Financial Operations Application started (PID: $FINANCIAL_PID)"

# Wait for applications to start
sleep 5

echo ""
echo "🧪 Step 6: Health Check & Testing"
echo "================================="

# Health check for main application
echo "🔍 Testing Main IU Application..."
if curl -s http://localhost:$PORT_MAIN/api/health > /dev/null; then
    echo "✅ Main IU Application is responsive"
else
    echo "❌ Main IU Application is not responding"
fi

# Health check for financial application (if it has health endpoint)
echo "🔍 Testing Financial Operations Application..."
if curl -s http://localhost:$PORT_FINANCIAL/api/health > /dev/null; then
    echo "✅ Financial Operations Application is responsive"
else
    echo "⚠️  Financial Operations Application health check not available"
fi

echo ""
echo "📊 Step 7: Application Status"
echo "============================="

echo "🌐 Application URLs:"
echo "  • Main IU API: http://localhost:$PORT_MAIN/api"
echo "  • Financial API: http://localhost:$PORT_FINANCIAL/api"

echo ""
echo "📋 Available Endpoints (Main IU API):"
echo "  • GET  /api/health - Service health check"
echo "  • POST /api/init - Initialize IU ledger"
echo "  • POST /api/transactions - Create financial transaction"
echo "  • POST /api/compliance/:id - Perform compliance check"
echo "  • POST /api/transactions/:id/process - Process transaction"
echo "  • GET  /api/transactions/:id - Get transaction details"
echo "  • GET  /api/transactions - Get all transactions"
echo "  • GET  /api/transactions/:id/history - Get transaction history"
echo "  • GET  /api/network/status - Network status"

echo ""
echo "🧪 Testing Commands:"
echo "  • Run comprehensive tests: node test-iu-comprehensive.js"
echo "  • Quick health check: curl http://localhost:$PORT_MAIN/api/health"
echo "  • Network status: curl http://localhost:$PORT_MAIN/api/network/status"

echo ""
echo "📝 Process Management:"
echo "  • Main Application PID: $MAIN_PID"
echo "  • Financial Application PID: $FINANCIAL_PID"
echo "  • Stop applications: kill $MAIN_PID $FINANCIAL_PID"
echo "  • View logs: tail -f logs/iu-main.log"

# Save PIDs for later management
echo "$MAIN_PID" > .main_app.pid
echo "$FINANCIAL_PID" > .financial_app.pid

echo ""
echo "🎯 Next Steps"
echo "============="
echo "1. Run comprehensive test suite:"
echo "   node test-iu-comprehensive.js"
echo ""
echo "2. Test individual endpoints:"
echo "   curl -X POST http://localhost:$PORT_MAIN/api/init"
echo ""
echo "3. Monitor application logs:"
echo "   tail -f logs/iu-main.log"
echo ""
echo "4. Once TLS is resolved:"
echo "   • Deploy chaincode to channels"
echo "   • Execute real blockchain transactions"
echo "   • Integrate with production systems"

echo ""
echo "✅ Information Utility Application Layer Deployed Successfully!"
echo "🔧 Applications ready for blockchain integration"
echo "⚠️  Note: Full blockchain functionality pending TLS certificate resolution"
