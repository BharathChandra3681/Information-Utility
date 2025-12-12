#!/bin/bash

# ============================================================================
# INFORMATION UTILITY - MASTER STOP SCRIPT
# ============================================================================
# Stops all components of the IU Blockchain project
# Stops: Frontend UI, Backend API, Blockchain Network, MongoDB
#
# Usage: ./stop.sh [OPTIONS]
#
# Options:
#   --keep-mongodb      Keep MongoDB running
#   --keep-blockchain   Keep blockchain network running
#   --help, -h          Show this help message
# ============================================================================

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BLOCKCHAIN_DIR="$PROJECT_ROOT/blockchain/network"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend/blockchainiu-next"

# Default options
KEEP_MONGODB=false
KEEP_BLOCKCHAIN=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================================
# PARSE ARGUMENTS
# ============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --keep-mongodb)
            KEEP_MONGODB=true
            shift
            ;;
        --keep-blockchain)
            KEEP_BLOCKCHAIN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --keep-mongodb      Keep MongoDB running"
            echo "  --keep-blockchain   Keep blockchain network running"
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
    echo -e "${BLUE}[$1/4]${NC} ${BLUE}$2${NC}"
    echo -e "${BLUE}────────────────────────────────────────────────────────────────────────────${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

print_banner "🛑 STOPPING INFORMATION UTILITY BLOCKCHAIN PROJECT"

echo -e "${CYAN}Stopping at: $(date)${NC}"
echo ""

# ============================================================================
# STEP 1: STOP FRONTEND
# ============================================================================

print_step 1 4 "Stopping Frontend UI Server"

if [ -f "$FRONTEND_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_DIR/.frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        print_success "Stopped frontend (PID: $FRONTEND_PID)"
    else
        print_warning "Frontend process not running"
    fi
    rm "$FRONTEND_DIR/.frontend.pid"
else
    # Try to find and kill any Next.js process on port 3000
    FRONTEND_PID=$(lsof -ti:3000 2>/dev/null)
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID
        print_success "Stopped frontend process on port 3000"
    else
        print_warning "No frontend process found"
    fi
fi

# ============================================================================
# STEP 2: STOP BACKEND
# ============================================================================

print_step 2 4 "Stopping Backend API Server"

if [ -f "$BACKEND_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$BACKEND_DIR/.backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        print_success "Stopped backend (PID: $BACKEND_PID)"
    else
        print_warning "Backend process not running"
    fi
    rm "$BACKEND_DIR/.backend.pid"
else
    # Try to find and kill any Node process on port 4000
    BACKEND_PID=$(lsof -ti:4000 2>/dev/null)
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID
        print_success "Stopped backend process on port 4000"
    else
        print_warning "No backend process found"
    fi
fi

# ============================================================================
# STEP 3: STOP BLOCKCHAIN NETWORK
# ============================================================================

print_step 3 4 "Stopping Blockchain Network"

if [ "$KEEP_BLOCKCHAIN" = true ]; then
    print_info "Keeping blockchain network running (--keep-blockchain)"
else
    cd "$BLOCKCHAIN_DIR"

    if docker ps | grep -q "peer0.government.iu-network.com"; then
        ./scripts/stop-network.sh
        print_success "Blockchain network stopped"
    else
        print_warning "Blockchain network not running"
    fi
fi

# ============================================================================
# STEP 4: STOP MONGODB
# ============================================================================

print_step 4 4 "Stopping MongoDB"

if [ "$KEEP_MONGODB" = true ]; then
    print_info "Keeping MongoDB running (--keep-mongodb)"
else
    if docker ps | grep -q mongodb-iu; then
        docker stop mongodb-iu
        print_success "MongoDB stopped"
    else
        print_warning "MongoDB not running"
    fi
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
print_banner "✅ ALL SERVICES STOPPED"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${YELLOW}Summary${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}✓${NC} Frontend UI:       Stopped"
echo -e "${CYAN}║${NC}  ${GREEN}✓${NC} Backend API:       Stopped"

if [ "$KEEP_BLOCKCHAIN" = true ]; then
    echo -e "${CYAN}║${NC}  ${YELLOW}⚠${NC} Blockchain Network: Still running"
else
    echo -e "${CYAN}║${NC}  ${GREEN}✓${NC} Blockchain Network: Stopped"
fi

if [ "$KEEP_MONGODB" = true ]; then
    echo -e "${CYAN}║${NC}  ${YELLOW}⚠${NC} MongoDB:           Still running"
else
    echo -e "${CYAN}║${NC}  ${GREEN}✓${NC} MongoDB:           Stopped"
fi

echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${YELLOW}Restart Commands${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  Start all:        ${GREEN}./start.sh${NC}"
echo -e "${CYAN}║${NC}  Clean restart:    ${GREEN}./start.sh --clean${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════╝${NC}"

echo ""

cd "$PROJECT_ROOT"

exit 0
