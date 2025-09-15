#!/bin/bash

# Verification script to check contract deployment and connections

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

# Check if blockchain is running
if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
    print_error "Local blockchain is not running. Please start it first:"
    echo "  ./bootstrap/start-blockchain.sh"
    exit 1
fi

print_status "Verifying contract deployment and connections..."

# Read contract addresses from deployment
DEPLOYMENT_FILE="broadcast/DeployLocal.s.sol/31337/run-latest.json"
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    print_error "Deployment file not found. Please deploy contracts first:"
    echo "  ./bootstrap/deploy-contracts.sh"
    exit 1
fi

# Extract addresses using jq
MOCK_LIDO=$(jq -r '.transactions[] | select(.contractName == "MockLido") | .contractAddress' "$DEPLOYMENT_FILE" | head -1)
MOCK_CHAINLINK=$(jq -r '.transactions[] | select(.contractName == "MockChainlinkOracle") | .contractAddress' "$DEPLOYMENT_FILE" | head -1)
SAFE_VAULT=$(jq -r '.transactions[] | select(.contractName == "SafeVault") | .contractAddress' "$DEPLOYMENT_FILE" | head -1)
TURBO_VAULT=$(jq -r '.transactions[] | select(.contractName == "TurboVault") | .contractAddress' "$DEPLOYMENT_FILE" | head -1)

print_status "Deployed Contract Addresses:"
echo "  MockLido: $MOCK_LIDO"
echo "  MockChainlinkOracle: $MOCK_CHAINLINK"
echo "  SafeVault: $SAFE_VAULT"
echo "  TurboVault: $TURBO_VAULT"
echo

# Check if addresses are valid
if [ "$MOCK_LIDO" = "null" ] || [ "$SAFE_VAULT" = "null" ] || [ "$TURBO_VAULT" = "null" ]; then
    print_error "Some contracts were not deployed properly"
    exit 1
fi

# Verify SafeVault is linked to TurboVault
print_status "Verifying SafeVault -> TurboVault connection..."
TURBO_VAULT_IN_SAFEVAULT=$(cast call "$SAFE_VAULT" "turboVault()" --rpc-url http://localhost:8545)
# Remove padding from the returned address
TURBO_VAULT_IN_SAFEVAULT_CLEAN=$(echo "$TURBO_VAULT_IN_SAFEVAULT" | sed 's/^0x000000000000000000000000/0x/')
if [ "$TURBO_VAULT_IN_SAFEVAULT_CLEAN" = "$TURBO_VAULT" ]; then
    print_success "SafeVault is properly linked to TurboVault"
else
    print_error "SafeVault is not linked to TurboVault"
    echo "  Expected: $TURBO_VAULT"
    echo "  Actual: $TURBO_VAULT_IN_SAFEVAULT_CLEAN"
    exit 1
fi

# Verify TurboVault asset is MockLido
print_status "Verifying TurboVault asset..."
TURBO_VAULT_ASSET=$(cast call "$TURBO_VAULT" "asset()" --rpc-url http://localhost:8545)
# Remove padding from the returned address
TURBO_VAULT_ASSET_CLEAN=$(echo "$TURBO_VAULT_ASSET" | sed 's/^0x000000000000000000000000/0x/')
if [ "$TURBO_VAULT_ASSET_CLEAN" = "$MOCK_LIDO" ]; then
    print_success "TurboVault asset is properly set to MockLido"
else
    print_error "TurboVault asset is not set to MockLido"
    echo "  Expected: $MOCK_LIDO"
    echo "  Actual: $TURBO_VAULT_ASSET_CLEAN"
    exit 1
fi

# Check MockLido balance
print_status "Checking MockLido ETH balance..."
MOCK_LIDO_BALANCE=$(cast balance "$MOCK_LIDO" --rpc-url http://localhost:8545)
MOCK_LIDO_BALANCE_ETH=$(cast to-unit "$MOCK_LIDO_BALANCE" ether)
print_success "MockLido balance: $MOCK_LIDO_BALANCE_ETH ETH"

# Check frontend contract addresses
print_status "Checking frontend contract addresses..."
FRONTEND_CONTRACTS="frontend/src/utils/contracts.ts"

if grep -q "$SAFE_VAULT" "$FRONTEND_CONTRACTS"; then
    print_success "SafeVault address is updated in frontend"
else
    print_warning "SafeVault address may not be updated in frontend"
fi

if grep -q "$MOCK_LIDO" "$FRONTEND_CONTRACTS"; then
    print_success "MockLido address is updated in frontend"
else
    print_warning "MockLido address may not be updated in frontend"
fi

if grep -q "$TURBO_VAULT" "$FRONTEND_CONTRACTS"; then
    print_success "TurboVault address is updated in frontend"
else
    print_warning "TurboVault address may not be updated in frontend"
fi

echo
print_success "🎉 Contract deployment verification complete!"
print_status "All contracts are properly deployed and connected."
print_status "You can now start the frontend with: npm start (in frontend directory)"
