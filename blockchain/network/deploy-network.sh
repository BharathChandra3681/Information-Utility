#!/bin/bash

# ============================================================================
# IU UNIFIED NETWORK - MASTER DEPLOYMENT SCRIPT
# ============================================================================
# Automates complete network deployment from scratch with error handling
# Usage: ./deploy-network.sh [--clean] [--skip-tests]
#
# Options:
#   --clean       : Clean up existing network before deployment
#   --skip-tests  : Skip the test suite after deployment
# ============================================================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Configuration
CLEAN_BEFORE_DEPLOY=false
SKIP_TESTS=false
LOG_FILE="${SCRIPT_DIR}/deployment.log"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN_BEFORE_DEPLOY=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--clean] [--skip-tests]"
            echo ""
            echo "Options:"
            echo "  --clean       Clean up existing network before deployment"
            echo "  --skip-tests  Skip the test suite after deployment"
            echo "  -h, --help    Show this help message"
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

# Print banner
print_banner() {
    echo ""
    echo -e "${CYAN}============================================================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}============================================================================${NC}"
    echo ""
}

# Print step header
print_step() {
    echo ""
    echo -e "${MAGENTA}[$1]${NC} ${BLUE}$2${NC}"
    echo -e "${BLUE}────────────────────────────────────────────────────────────────────────────${NC}"
}

# Print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Print error message
print_error() {
    echo -e "${RED}✗ ERROR: $1${NC}"
}

# Print warning message
print_warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
}

# Print info message
print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Log message to file
log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Execute step with error handling
execute_step() {
    local step_name="$1"
    local script_path="$2"
    
    log_message "Starting: $step_name"
    
    if [ ! -f "$script_path" ]; then
        print_error "Script not found: $script_path"
        log_message "ERROR: Script not found - $script_path"
        exit 1
    fi
    
    if [ ! -x "$script_path" ]; then
        print_warning "Script not executable, fixing permissions: $script_path"
        chmod +x "$script_path"
    fi
    
    if bash "$script_path" >> "$LOG_FILE" 2>&1; then
        print_success "$step_name completed successfully"
        log_message "SUCCESS: $step_name"
        return 0
    else
        print_error "$step_name failed!"
        print_info "Check log file for details: $LOG_FILE"
        log_message "FAILED: $step_name"
        
        # Show last 20 lines of log
        echo ""
        echo -e "${YELLOW}Last 20 lines of log:${NC}"
        tail -20 "$LOG_FILE"
        
        return 1
    fi
}

# Check prerequisites
check_prerequisites() {
    print_step "PRE-CHECK" "Verifying prerequisites..."
    
    local all_ok=true
    
    # Check Docker
    if command -v docker &> /dev/null; then
        if docker ps &> /dev/null; then
            print_success "Docker is installed and running"
        else
            print_error "Docker is installed but not running"
            print_info "Please start Docker and try again"
            all_ok=false
        fi
    else
        print_error "Docker is not installed"
        print_info "Please install Docker: https://docs.docker.com/get-docker/"
        all_ok=false
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_success "Docker Compose is available"
    else
        print_error "Docker Compose is not installed"
        all_ok=false
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed ($NODE_VERSION)"
    else
        print_warning "Node.js not found (required for chaincode)"
        print_info "Install Node.js 14+ from: https://nodejs.org/"
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed (v$NPM_VERSION)"
    else
        print_warning "npm not found"
    fi
    
    # Check available disk space
    AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
    print_info "Available disk space: $AVAILABLE_SPACE"
    
    if [ "$all_ok" = false ]; then
        print_error "Prerequisites check failed. Please fix the issues above."
        exit 1
    fi
    
    print_success "All prerequisites satisfied"
}

# Clean up existing network
cleanup_network() {
    print_step "CLEANUP" "Cleaning up existing network..."
    
    if [ -f "./scripts/cleanup.sh" ]; then
        execute_step "Cleanup existing artifacts" "./scripts/cleanup.sh" || {
            print_warning "Cleanup encountered issues, but continuing..."
        }
    else
        print_warning "Cleanup script not found, skipping..."
    fi
}

# Verify deployment
verify_deployment() {
    print_step "VERIFICATION" "Verifying deployment..."
    
    # Check running containers
    local expected_containers=("orderer.iu.com" "peer0.government.iu.com" "peer0.creditor.iu.com" "peer0.debtor.iu.com")
    local all_running=true
    
    for container in "${expected_containers[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            print_success "$container is running"
        else
            print_error "$container is NOT running"
            all_running=false
        fi
    done
    
    if [ "$all_running" = false ]; then
        print_error "Some containers are not running!"
        print_info "Container status:"
        docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep "iu.com"
        return 1
    fi
    
    print_success "All containers are running"
    return 0
}

# Display deployment summary
print_summary() {
    local start_time=$1
    local end_time=$2
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    print_banner "DEPLOYMENT SUMMARY"
    
    echo -e "${GREEN}✓ Network deployment completed successfully!${NC}"
    echo ""
    echo -e "${CYAN}Deployment Time:${NC} ${minutes}m ${seconds}s"
    echo ""
    echo -e "${CYAN}Network Components:${NC}"
    echo "  • Organizations: 3 (Government, Creditor, Debtor)"
    echo "  • Channels: 2 (governance-channel, financial-operations-channel)"
    echo "  • Chaincode: iu-unified v1.0"
    echo "  • Peers: 3 (ports 7051, 8051, 9051)"
    echo "  • Orderer: 1 (port 7050)"
    echo "  • CouchDB: 3 instances (ports 5984, 6984, 7984)"
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo "  • View logs:        docker logs -f peer0.government.iu.com"
    echo "  • Stop network:     ./scripts/stop-network.sh"
    echo "  • Run tests:        ./scripts/7-test-network.sh"
    echo "  • Cleanup:          ./scripts/cleanup.sh"
    echo ""
    echo -e "${CYAN}CouchDB Web UIs:${NC}"
    echo "  • Government: http://localhost:5984/_utils"
    echo "  • Creditor:   http://localhost:6984/_utils"
    echo "  • Debtor:     http://localhost:7984/_utils"
    echo ""
    echo -e "${CYAN}Log File:${NC} $LOG_FILE"
    echo ""
}

# ============================================================================
# MAIN DEPLOYMENT FLOW
# ============================================================================

# Initialize log file
echo "=== IU Unified Network Deployment - $(date) ===" > "$LOG_FILE"

# Start timer
START_TIME=$(date +%s)

# Print welcome banner
print_banner "IU UNIFIED BLOCKCHAIN NETWORK - AUTOMATED DEPLOYMENT"

print_info "Deployment started at: $(date +'%Y-%m-%d %H:%M:%S')"
print_info "Log file: $LOG_FILE"

# Step 0: Check prerequisites
check_prerequisites

# Step 0.5: Optional cleanup
if [ "$CLEAN_BEFORE_DEPLOY" = true ]; then
    cleanup_network
fi

# Step 1: Generate cryptographic materials
print_step "STEP 1/7" "Generating cryptographic materials..."
if execute_step "Generate crypto materials" "./scripts/1-generate-crypto.sh"; then
    sleep 2
else
    print_error "Failed to generate crypto materials"
    exit 1
fi

# Step 2: Generate genesis block
print_step "STEP 2/7" "Generating genesis block and channel configurations..."
if execute_step "Generate genesis block" "./scripts/2-generate-genesis.sh"; then
    sleep 2
else
    print_error "Failed to generate genesis block"
    exit 1
fi

# Step 3: Start network
print_step "STEP 3/7" "Starting Docker network..."
if execute_step "Start network containers" "./scripts/3-start-network.sh"; then
    sleep 5  # Give containers time to fully initialize
else
    print_error "Failed to start network"
    print_info "Checking container status:"
    docker ps -a
    exit 1
fi

# Step 4: Create channels
print_step "STEP 4/7" "Creating channels..."
if execute_step "Create governance and financial channels" "./scripts/4-create-channels.sh"; then
    sleep 3
else
    print_error "Failed to create channels"
    exit 1
fi

# Step 5: Join peers to channels
print_step "STEP 5/7" "Joining peers to channels..."
if execute_step "Join peers to their respective channels" "./scripts/5-join-peers.sh"; then
    sleep 3
else
    print_error "Failed to join peers to channels"
    exit 1
fi

# Step 6: Deploy chaincode
print_step "STEP 6/7" "Deploying unified chaincode..."
print_info "This step may take 2-3 minutes (installing npm dependencies)..."
if execute_step "Package, install, and deploy chaincode" "./scripts/6-deploy-chaincode.sh"; then
    sleep 5
else
    print_error "Failed to deploy chaincode"
    exit 1
fi

# Step 7: Verify deployment
if ! verify_deployment; then
    print_error "Deployment verification failed"
    exit 1
fi

# Step 8: Run tests (optional)
if [ "$SKIP_TESTS" = false ]; then
    print_step "STEP 7/7" "Running comprehensive tests..."
    if execute_step "Execute test suite" "./scripts/7-test-network.sh"; then
        print_success "All tests passed!"
    else
        print_warning "Some tests failed, but network is operational"
        print_info "You can manually run tests: ./scripts/7-test-network.sh"
    fi
else
    print_info "Skipping tests (--skip-tests flag provided)"
fi

# End timer
END_TIME=$(date +%s)

# Print summary
print_summary "$START_TIME" "$END_TIME"

# Exit successfully
log_message "Deployment completed successfully"
exit 0
