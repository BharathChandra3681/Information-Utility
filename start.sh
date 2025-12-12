#!/bin/bash

# ============================================================================
# INFORMATION UTILITY - MASTER STARTUP SCRIPT
# ============================================================================
# One-command startup for the entire IU Blockchain project
# Starts: MongoDB, Hyperledger Fabric Network, Backend API, Frontend UI
#
# Usage: ./start.sh [OPTIONS]
#
# Options:
#   --skip-blockchain   Skip blockchain network deployment
#   --skip-backend      Skip backend API server
#   --skip-frontend     Skip frontend UI server
#   --clean             Clean and restart blockchain network
#   --help, -h          Show this help message
# ============================================================================

set -e  # Exit on error

# ============================================================================
# CONFIGURATION
# ============================================================================

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BLOCKCHAIN_DIR="$PROJECT_ROOT/blockchain/network"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend/blockchainiu-next"

# Default options
SKIP_BLOCKCHAIN=false
SKIP_BACKEND=false
SKIP_FRONTEND=false
CLEAN_BLOCKCHAIN=false

# Ports
BACKEND_PORT=4000
FRONTEND_PORT=3000
MONGODB_PORT=27017

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'  # No Color

# ============================================================================
# PARSE ARGUMENTS
# ============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-blockchain)
            SKIP_BLOCKCHAIN=true
            shift
            ;;
        --skip-backend)
            SKIP_BACKEND=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --clean)
            CLEAN_BLOCKCHAIN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-blockchain   Skip blockchain network deployment"
            echo "  --skip-backend      Skip backend API server"
            echo "  --skip-frontend     Skip frontend UI server"
            echo "  --clean             Clean and restart blockchain network"
            echo "  -h, --help          Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

print_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  $1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${MAGENTA}[$1/${2}]${NC} ${BLUE}$3${NC}"
    echo -e "${BLUE}────────────────────────────────────────────────────────────────────────────${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        return 1
    else
        print_success "$1 is installed"
        return 0
    fi
}

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

wait_for_service() {
    local service_name=$1
    local check_command=$2
    local max_attempts=30
    local attempt=1

    echo -n "Waiting for $service_name to be ready"
    while [ $attempt -le $max_attempts ]; do
        if eval $check_command &> /dev/null; then
            echo ""
            print_success "$service_name is ready"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo ""
    print_error "$service_name failed to start"
    return 1
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

print_banner "🚀 INFORMATION UTILITY - BLOCKCHAIN PROJECT STARTUP"

echo -e "${CYAN}Starting at: $(date)${NC}"
echo -e "${CYAN}Project root: $PROJECT_ROOT${NC}"
echo ""

# ============================================================================
# STEP 1: PREREQUISITES CHECK
# ============================================================================

TOTAL_STEPS=6
CURRENT_STEP=1

print_step $CURRENT_STEP $TOTAL_STEPS "Checking Prerequisites"

PREREQ_OK=true

if ! check_command docker; then PREREQ_OK=false; fi
if ! check_command docker-compose; then PREREQ_OK=false; fi
if ! check_command node; then PREREQ_OK=false; fi
if ! check_command npm; then PREREQ_OK=false; fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker Desktop."
    PREREQ_OK=false
else
    print_success "Docker daemon is running"
fi

if [ "$PREREQ_OK" = false ]; then
    print_error "Prerequisites check failed. Please install missing dependencies."
    exit 1
fi

print_success "All prerequisites met!"

# ============================================================================
# STEP 2: START MONGODB
# ============================================================================

CURRENT_STEP=2
print_step $CURRENT_STEP $TOTAL_STEPS "Starting MongoDB"

if check_port $MONGODB_PORT; then
    print_warning "MongoDB already running on port $MONGODB_PORT"
else
    # Try to start MongoDB using Docker
    if docker ps -a | grep -q mongodb-iu; then
        docker start mongodb-iu
        print_success "Started existing MongoDB container"
    else
        docker run -d \
            --name mongodb-iu \
            -p $MONGODB_PORT:27017 \
            -v mongodb-iu-data:/data/db \
            mongo:latest
        print_success "Created and started MongoDB container"
    fi

    wait_for_service "MongoDB" "docker exec mongodb-iu mongo --eval 'db.runCommand({ ping: 1 })'"
fi

# ============================================================================
# STEP 3: DEPLOY BLOCKCHAIN NETWORK
# ============================================================================

CURRENT_STEP=3

if [ "$SKIP_BLOCKCHAIN" = true ]; then
    print_step $CURRENT_STEP $TOTAL_STEPS "Skipping Blockchain Network (--skip-blockchain)"
else
    print_step $CURRENT_STEP $TOTAL_STEPS "Deploying Hyperledger Fabric Network"

    cd "$BLOCKCHAIN_DIR"

    if [ "$CLEAN_BLOCKCHAIN" = true ]; then
        print_info "Cleaning existing blockchain network..."
        ./deploy-network.sh --clean
    else
        # Check if network is already running
        if docker ps | grep -q "peer0.government.iu-network.com"; then
            print_warning "Blockchain network already running"
            print_info "Use --clean to restart the network"
        else
            ./deploy-network.sh
        fi
    fi

    print_success "Blockchain network is ready"
fi

# ============================================================================
# STEP 4: START BACKEND API SERVER
# ============================================================================

CURRENT_STEP=4

if [ "$SKIP_BACKEND" = true ]; then
    print_step $CURRENT_STEP $TOTAL_STEPS "Skipping Backend API (--skip-backend)"
else
    print_step $CURRENT_STEP $TOTAL_STEPS "Starting Backend API Server"

    cd "$BACKEND_DIR"

    # Check if already running
    if check_port $BACKEND_PORT; then
        print_warning "Backend already running on port $BACKEND_PORT"
        print_info "Skipping backend startup"
    else
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            print_info "Installing backend dependencies..."
            npm install
        fi

        # Start backend in background
        print_info "Starting backend server on port $BACKEND_PORT..."
        npm start > "$BACKEND_DIR/logs/startup.log" 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > "$BACKEND_DIR/.backend.pid"

        wait_for_service "Backend API" "curl -s http://localhost:$BACKEND_PORT/api/health"

        print_success "Backend API server running (PID: $BACKEND_PID)"
    fi
fi

# ============================================================================
# STEP 5: START FRONTEND UI SERVER
# ============================================================================

CURRENT_STEP=5

if [ "$SKIP_FRONTEND" = true ]; then
    print_step $CURRENT_STEP $TOTAL_STEPS "Skipping Frontend UI (--skip-frontend)"
else
    print_step $CURRENT_STEP $TOTAL_STEPS "Starting Frontend UI Server"

    cd "$FRONTEND_DIR"

    # Check if already running
    if check_port $FRONTEND_PORT; then
        print_warning "Frontend already running on port $FRONTEND_PORT"
        print_info "Skipping frontend startup"
    else
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            print_info "Installing frontend dependencies (this may take a while)..."
            npm install
        fi

        # Start frontend in background
        print_info "Starting frontend development server on port $FRONTEND_PORT..."
        npm run dev > "$FRONTEND_DIR/.next/startup.log" 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > "$FRONTEND_DIR/.frontend.pid"

        wait_for_service "Frontend UI" "curl -s http://localhost:$FRONTEND_PORT"

        print_success "Frontend UI server running (PID: $FRONTEND_PID)"
    fi
fi

# ============================================================================
# STEP 6: SUMMARY & STATUS
# ============================================================================

CURRENT_STEP=6
print_step $CURRENT_STEP $TOTAL_STEPS "Deployment Summary"

echo ""
print_banner "🎉 INFORMATION UTILITY BLOCKCHAIN PROJECT IS RUNNING!"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}Service Status${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════════════════╣${NC}"

# MongoDB Status
if check_port $MONGODB_PORT; then
    echo -e "${CYAN}║${NC}  ${GREEN}✓${NC} MongoDB:           http://localhost:$MONGODB_PORT"
else
    echo -e "${CYAN}║${NC}  ${RED}✗${NC} MongoDB:           Not running"
fi

# Blockchain Status
if docker ps | grep -q "peer0.government.iu-network.com"; then
    echo -e "${CYAN}║${NC}  ${GREEN}✓${NC} Blockchain Network: Running (4 peers + orderer)"
else
    echo -e "${CYAN}║${NC}  ${YELLOW}⚠${NC} Blockchain Network: Not running"
fi

# Backend Status
if check_port $BACKEND_PORT; then
    echo -e "${CYAN}║${NC}  ${GREEN}✓${NC} Backend API:       http://localhost:$BACKEND_PORT"
    echo -e "${CYAN}║${NC}                         http://localhost:$BACKEND_PORT/api/health"
else
    echo -e "${CYAN}║${NC}  ${RED}✗${NC} Backend API:       Not running"
fi

# Frontend Status
if check_port $FRONTEND_PORT; then
    echo -e "${CYAN}║${NC}  ${GREEN}✓${NC} Frontend UI:       http://localhost:$FRONTEND_PORT"
else
    echo -e "${CYAN}║${NC}  ${RED}✗${NC} Frontend UI:       Not running"
fi

echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${YELLOW}Quick Links${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  🌐 Frontend:      http://localhost:$FRONTEND_PORT"
echo -e "${CYAN}║${NC}  🔧 Backend API:   http://localhost:$BACKEND_PORT/api"
echo -e "${CYAN}║${NC}  📊 Health Check:  http://localhost:$BACKEND_PORT/api/health"
echo -e "${CYAN}║${NC}  📦 MongoDB:       mongodb://localhost:$MONGODB_PORT"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${YELLOW}Management Commands${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  Stop all:         ${GREEN}./stop.sh${NC}"
echo -e "${CYAN}║${NC}  View logs:"
echo -e "${CYAN}║${NC}    - Backend:      ${GREEN}tail -f backend/logs/startup.log${NC}"
echo -e "${CYAN}║${NC}    - Frontend:     ${GREEN}tail -f frontend/blockchainiu-next/.next/startup.log${NC}"
echo -e "${CYAN}║${NC}    - Blockchain:   ${GREEN}docker logs -f peer0.government.iu-network.com${NC}"
echo -e "${CYAN}║${NC}  Test blockchain:  ${GREEN}cd blockchain/network && ./scripts/7-test-network.sh${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════╝${NC}"

echo ""
print_info "Logs are being written to respective service directories"
echo ""

# Return to project root
cd "$PROJECT_ROOT"

exit 0
