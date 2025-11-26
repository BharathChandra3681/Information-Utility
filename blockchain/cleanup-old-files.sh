#!/bin/bash

# Cleanup Script - Remove Old Duplicate Network Files
# Backs up old files before deletion for safety

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
cd "$WORKSPACE_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Backup directory
BACKUP_DIR="$WORKSPACE_DIR/.old-networks-backup-$(date +%Y%m%d-%H%M%S)"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}  IU UNIFIED NETWORK - OLD FILES CLEANUP${NC}"
echo -e "${CYAN}============================================================================${NC}"
echo ""

echo -e "${BLUE}This script will:${NC}"
echo "  1. Create a backup of old network files"
echo "  2. Remove duplicate/obsolete directories and files"
echo "  3. Keep only the new unified structure in blockchain/"
echo ""

# List what will be removed
echo -e "${YELLOW}Directories/files to be removed:${NC}"
echo "  📁 /network/                    (270 MB - old financial network)"
echo "  📁 /hyperledger-fabric-iu/      (651 MB - old government network)"
echo "  📁 /chaincode/                  (60 KB - old chaincode)"
echo "  📁 /scripts/                    (old scripts)"
echo "  📄 network.sh                   (old network script)"
echo "  📄 iu-basic.tar.gz              (old chaincode package)"
echo "  📄 log.txt                      (temporary log file)"
echo ""

echo -e "${GREEN}Directories to KEEP:${NC}"
echo "  ✅ /blockchain/                 (NEW unified network)"
echo "  ✅ /backend/                    (NEW unified backend API)"
echo "  ✅ /BlockChainIU 2/             (Frontend application)"
echo "  ✅ Documentation files"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with backup and cleanup? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Cleanup cancelled.${NC}"
    exit 0
fi

# Create backup directory
echo -e "${BLUE}[1/3]${NC} Creating backup..."
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✓ Backup directory created: ${BACKUP_DIR}${NC}"
echo ""

# Backup old files
echo -e "${BLUE}[2/3]${NC} Backing up old network files..."

BACKUP_ITEMS=(
    "network"
    "hyperledger-fabric-iu"
    "chaincode"
    "scripts"
    "network.sh"
    "iu-basic.tar.gz"
    "log.txt"
)

TOTAL_SIZE=0
for item in "${BACKUP_ITEMS[@]}"; do
    if [ -e "$WORKSPACE_DIR/$item" ]; then
        echo -e "  ${CYAN}Backing up:${NC} $item"
        if [ -d "$WORKSPACE_DIR/$item" ]; then
            SIZE=$(du -sm "$WORKSPACE_DIR/$item" | cut -f1)
            TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
        fi
        cp -R "$WORKSPACE_DIR/$item" "$BACKUP_DIR/" 2>/dev/null || echo "    (skipped - not found)"
    fi
done

echo -e "${GREEN}✓ Backup completed (${TOTAL_SIZE} MB backed up)${NC}"
echo -e "${GREEN}✓ Backup location: ${BACKUP_DIR}${NC}"
echo ""

# Remove old files
echo -e "${BLUE}[3/3]${NC} Removing old duplicate files..."

REMOVED_COUNT=0
for item in "${BACKUP_ITEMS[@]}"; do
    if [ -e "$WORKSPACE_DIR/$item" ]; then
        echo -e "  ${RED}Removing:${NC} $item"
        rm -rf "$WORKSPACE_DIR/$item"
        ((REMOVED_COUNT++))
    fi
done

echo -e "${GREEN}✓ Removed ${REMOVED_COUNT} items${NC}"
echo ""

# Show current structure
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}  CLEANUP COMPLETED${NC}"
echo -e "${CYAN}============================================================================${NC}"
echo ""
echo -e "${GREEN}✅ Old network files have been removed${NC}"
echo -e "${GREEN}✅ Backup saved to: ${BACKUP_DIR}${NC}"
echo ""
echo -e "${BLUE}Current workspace structure:${NC}"
echo ""
ls -1 "$WORKSPACE_DIR" | grep -E "^(blockchain|backend|BlockChainIU)" | while read dir; do
    if [ -d "$WORKSPACE_DIR/$dir" ]; then
        SIZE=$(du -sh "$WORKSPACE_DIR/$dir" 2>/dev/null | cut -f1)
        echo -e "  ${GREEN}✓${NC} $dir/ ($SIZE)"
    fi
done
echo ""

echo -e "${YELLOW}Remaining files in workspace:${NC}"
ls -1 "$WORKSPACE_DIR" | grep -v "^blockchain$\|^backend$\|^BlockChainIU\|^\.git$\|^node_modules$\|^\.DS_Store$" | head -15
echo ""

echo -e "${CYAN}To restore backup (if needed):${NC}"
echo "  cd '$WORKSPACE_DIR'"
echo "  cp -R '$BACKUP_DIR'/* ."
echo ""

echo -e "${CYAN}To permanently delete backup:${NC}"
echo "  rm -rf '$BACKUP_DIR'"
echo ""

echo -e "${GREEN}✨ Cleanup completed successfully!${NC}"
