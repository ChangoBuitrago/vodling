#!/bin/bash

# Stop local blockchain (Anvil)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kill anvil if we have a PID file
if [ -f "anvil.pid" ]; then
    ANVIL_PID=$(cat anvil.pid)
    if kill -0 $ANVIL_PID 2>/dev/null; then
        kill $ANVIL_PID
        print_success "Stopped local blockchain (PID: $ANVIL_PID)"
    else
        print_status "Blockchain process not running"
    fi
    rm -f anvil.pid
else
    print_status "No PID file found, trying to kill any running anvil processes..."
    pkill -f "anvil" && print_success "Stopped anvil processes" || print_status "No anvil processes found"
fi

# Remove log file
rm -f anvil.log

print_success "Cleanup complete"
