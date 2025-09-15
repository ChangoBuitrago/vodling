#!/bin/bash

# Start local blockchain (Anvil) for development

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if anvil is already running
if curl -s http://localhost:8545 > /dev/null 2>&1; then
    print_success "Local blockchain already running at http://localhost:8545"
    exit 0
fi

# Check if Foundry is installed
if ! command -v anvil &> /dev/null; then
    print_error "Foundry is not installed. Please install it first:"
    echo "curl -L https://foundry.paradigm.xyz | bash"
    echo "foundryup"
    exit 1
fi

print_status "Starting Anvil blockchain..."

# Start anvil in the background
anvil --host 0.0.0.0 --port 8545 > anvil.log 2>&1 &
ANVIL_PID=$!

# Wait for anvil to start
print_status "Waiting for blockchain to start..."
for i in {1..30}; do
    if curl -s http://localhost:8545 > /dev/null 2>&1; then
        print_success "Local blockchain started successfully!"
        echo $ANVIL_PID > anvil.pid
        print_status "Blockchain PID: $ANVIL_PID (saved to anvil.pid)"
        print_status "Blockchain running at: http://localhost:8545"
        exit 0
    fi
    sleep 1
done

# If we get here, anvil failed to start
print_error "Failed to start local blockchain"
kill $ANVIL_PID 2>/dev/null || true
exit 1
