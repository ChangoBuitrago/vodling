#!/bin/bash

# Vodling Protocol - Complete Project Management Script
# This script is the single entry point for all project operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${PURPLE}[HEADER]${NC} $1"
}

print_command() {
    echo -e "${CYAN}[COMMAND]${NC} $1"
}

# Show help menu
show_help() {
    echo "🚀 Vodling Protocol - Project Management Script"
    echo "=============================================="
    echo
    echo "Usage: ./start.sh [COMMAND]"
    echo
    echo "Commands:"
    echo "  start, dev, run     Start the complete development environment (default)"
    echo "  blockchain, bc      Start only the local blockchain"
    echo "  deploy, d           Deploy contracts to local blockchain"
    echo "  frontend, fe        Start only the frontend"
    echo "  test, t             Run tests"
    echo "  build, b            Build contracts"
    echo "  verify, v           Verify contract deployment"
    echo "  stop, s             Stop all services"
    echo "  clean, c            Clean up all generated files"
    echo "  help, h             Show this help menu"
    echo
    echo "Examples:"
    echo "  ./start.sh                    # Start complete development environment"
    echo "  ./start.sh start              # Same as above"
    echo "  ./start.sh blockchain         # Start only blockchain"
    echo "  ./start.sh deploy             # Deploy contracts"
    echo "  ./start.sh test               # Run tests"
    echo "  ./start.sh stop               # Stop all services"
    echo
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v forge &> /dev/null; then
        missing_deps+=("Foundry (forge)")
    fi
    
    if ! command -v anvil &> /dev/null; then
        missing_deps+=("Foundry (anvil)")
    fi
    
    if ! command -v cast &> /dev/null; then
        missing_deps+=("Foundry (cast)")
    fi
    
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing dependencies:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo
        if [[ " ${missing_deps[@]} " =~ " Foundry" ]]; then
            echo "Install Foundry:"
            echo "  curl -L https://foundry.paradigm.xyz | bash"
            echo "  foundryup"
        fi
        if [[ " ${missing_deps[@]} " =~ " jq" ]]; then
            echo "Install jq:"
            echo "  macOS: brew install jq"
            echo "  Ubuntu: sudo apt-get install jq"
        fi
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install Foundry dependencies
    print_command "forge install --no-commit"
    forge install --no-commit
    
    # Install frontend dependencies
    if [ ! -d "frontend/node_modules" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend
        print_command "npm install"
        npm install
        cd ..
        print_success "Frontend dependencies installed"
    else
        print_success "Frontend dependencies already installed"
    fi
}

# Start local blockchain
start_blockchain() {
    print_header "Starting Local Blockchain"
    
    # Check if anvil is already running
    if curl -s http://localhost:8545 > /dev/null 2>&1; then
        print_success "Local blockchain already running at http://localhost:8545"
        return 0
    fi
    
    print_status "Starting Anvil blockchain..."
    print_command "anvil --host 0.0.0.0 --port 8545"
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
            return 0
        fi
        sleep 1
    done
    
    # If we get here, anvil failed to start
    print_error "Failed to start local blockchain"
    kill $ANVIL_PID 2>/dev/null || true
    exit 1
}

# Deploy contracts and update frontend
deploy_contracts() {
    print_header "Deploying Contracts"
    
    # Check if blockchain is running
    if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
        print_error "Local blockchain is not running. Please start it first:"
        echo "  ./start.sh blockchain"
        exit 1
    fi
    
    print_status "Deploying contracts to local blockchain..."
    print_command "forge script script/DeployLocal.s.sol --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast"
    
    forge script script/DeployLocal.s.sol \
        --rpc-url http://localhost:8545 \
        --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --broadcast
    
    print_success "Contracts deployed successfully"
    
    # Update frontend contract addresses
    print_status "Updating frontend contract addresses..."
    
    node -e "
const fs = require('fs');
const path = require('path');

// Path to the latest deployment output
const deploymentPath = path.join('broadcast', 'DeployLocal.s.sol', '31337', 'run-latest.json');
const contractsPath = path.join('frontend', 'src', 'utils', 'contracts.ts');

try {
  // Read the deployment output
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  // Extract contract addresses from transactions
  const addresses = {};
  
  deploymentData.transactions.forEach(tx => {
    if (tx.transactionType === 'CREATE' && tx.contractAddress) {
      const contractName = tx.contractName;
      const address = tx.contractAddress;
      
      switch (contractName) {
        case 'SafeVault':
          addresses.SAFE_VAULT = address;
          break;
        case 'MockLido':
          addresses.MOCK_LIDO = address;
          break;
        case 'TurboVault':
          addresses.TURBO_VAULT = address;
          break;
      }
    }
  });
  
  console.log('Extracted addresses:', addresses);
  
  // Read the current contracts.ts file
  let contractsContent = fs.readFileSync(contractsPath, 'utf8');
  
  // Update the LOCAL addresses
  if (addresses.SAFE_VAULT) {
    contractsContent = contractsContent.replace(
      /(SAFE_VAULT_ADDRESSES = \{[\s\S]*?LOCAL: ')0x[a-fA-F0-9]+('.*?\/\/ Local development).*?/,
      \`\$1\${addresses.SAFE_VAULT}\$2 - auto-updated\`
    );
  }
  
  if (addresses.MOCK_LIDO) {
    contractsContent = contractsContent.replace(
      /(MOCK_LIDO_ADDRESSES = \{[\s\S]*?LOCAL: ')0x[a-fA-F0-9]+('.*?\/\/ Local development).*?/,
      \`\$1\${addresses.MOCK_LIDO}\$2 - auto-updated\`
    );
  }
  
  if (addresses.MOCK_CHAINLINK_ORACLE) {
    contractsContent = contractsContent.replace(
      /(MOCK_CHAINLINK_ORACLE_ADDRESSES = \{[\s\S]*?LOCAL: ')0x[a-fA-F0-9]+('.*?\/\/ Local development).*?/,
      \`\$1\${addresses.MOCK_CHAINLINK_ORACLE}\$2 - auto-updated\`
    );
  }
  
  if (addresses.TURBO_VAULT) {
    contractsContent = contractsContent.replace(
      /(TURBO_VAULT_ADDRESSES = \{[\s\S]*?LOCAL: ')0x[a-fA-F0-9]+('.*?\/\/ Local development).*?/,
      \`\$1\${addresses.TURBO_VAULT}\$2 - auto-updated\`
    );
  }
  
  // Write the updated content back
  fs.writeFileSync(contractsPath, contractsContent);
  
  console.log('✅ Contract addresses updated successfully!');
  console.log('Updated addresses:');
  console.log(\`  SafeVault: \${addresses.SAFE_VAULT}\`);
  console.log(\`  MockLido: \${addresses.MOCK_LIDO}\`);
  console.log(\`  TurboVault: \${addresses.TURBO_VAULT}\`);
  
} catch (error) {
  console.error('❌ Error updating contract addresses:', error.message);
  process.exit(1);
}
"
    
    print_success "Frontend contract addresses updated"
}

# Start frontend
start_frontend() {
    print_header "Starting Frontend"
    
    print_status "Starting frontend development server..."
    cd frontend
    print_success "Frontend starting at http://localhost:3000"
    print_warning "Press Ctrl+C to stop all services"
    echo
    
    # Start the frontend (this will block)
    print_command "npm start"
    npm start
}

# Run tests
run_tests() {
    print_header "Running Tests"
    
    print_status "Running Foundry tests..."
    print_command "forge test"
    forge test
    
    print_success "Tests completed"
}

# Build contracts
build_contracts() {
    print_header "Building Contracts"
    
    print_status "Building contracts with Foundry..."
    print_command "forge build"
    forge build
    
    print_success "Contracts built successfully"
}

# Verify contract deployment
verify_deployment() {
    print_header "Verifying Contract Deployment"
    
    # Check if blockchain is running
    if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
        print_error "Local blockchain is not running. Please start it first:"
        echo "  ./start.sh blockchain"
        exit 1
    fi
    
    print_status "Verifying contract deployment and connections..."
    
    # Read contract addresses from deployment
    DEPLOYMENT_FILE="broadcast/DeployLocal.s.sol/31337/run-latest.json"
    if [ ! -f "$DEPLOYMENT_FILE" ]; then
        print_error "Deployment file not found. Please deploy contracts first:"
        echo "  ./start.sh deploy"
        exit 1
    fi
    
    # Extract addresses using jq
    MOCK_LIDO=$(jq -r '.transactions[] | select(.contractName == "MockLido") | .contractAddress' "$DEPLOYMENT_FILE" | head -1)
    SAFE_VAULT=$(jq -r '.transactions[] | select(.contractName == "SafeVault") | .contractAddress' "$DEPLOYMENT_FILE" | head -1)
    TURBO_VAULT=$(jq -r '.transactions[] | select(.contractName == "TurboVault") | .contractAddress' "$DEPLOYMENT_FILE" | head -1)
    
    print_status "Deployed Contract Addresses:"
    echo "  MockLido: $MOCK_LIDO"
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
}

# Stop all services
stop_services() {
    print_header "Stopping All Services"
    
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
    
    print_success "All services stopped"
}

# Clean up all generated files
clean_project() {
    print_header "Cleaning Project"
    
    print_status "Cleaning up generated files..."
    
    # Stop services first
    stop_services
    
    # Remove build artifacts
    rm -rf out/
    rm -rf cache/
    rm -rf broadcast/
    
    # Remove frontend build
    rm -rf frontend/build/
    rm -rf frontend/node_modules/
    
    # Remove log files
    rm -f anvil.log
    rm -f anvil.pid
    
    print_success "Project cleaned successfully"
}

# Cleanup function for trap
cleanup() {
    print_status "Cleaning up..."
    
    # Kill anvil if we started it
    if [ -f "anvil.pid" ]; then
        ANVIL_PID=$(cat anvil.pid)
        if kill -0 $ANVIL_PID 2>/dev/null; then
            kill $ANVIL_PID
            print_success "Stopped local blockchain (PID: $ANVIL_PID)"
        fi
        rm -f anvil.pid
    fi
    
    # Remove log file
    rm -f anvil.log
}

# Main execution function
main() {
    print_header "Starting Vodling Protocol Development Environment"
    
    check_dependencies
    install_dependencies
    start_blockchain
    deploy_contracts
    
    echo
    print_success "🎉 Setup complete! Starting frontend..."
    echo
    print_status "Your Vodling Protocol is now running:"
    echo "  • Local blockchain: http://localhost:8545"
    echo "  • Frontend: http://localhost:3000"
    echo
    
    start_frontend
}

# Command line argument handling
case "${1:-start}" in
    "start"|"dev"|"run"|"")
        # Trap to cleanup on exit
        trap cleanup EXIT
        main
        ;;
    "blockchain"|"bc")
        check_dependencies
        start_blockchain
        ;;
    "deploy"|"d")
        check_dependencies
        deploy_contracts
        ;;
    "frontend"|"fe")
        check_dependencies
        start_frontend
        ;;
    "test"|"t")
        check_dependencies
        run_tests
        ;;
    "build"|"b")
        check_dependencies
        build_contracts
        ;;
    "verify"|"v")
        check_dependencies
        verify_deployment
        ;;
    "stop"|"s")
        stop_services
        ;;
    "clean"|"c")
        clean_project
        ;;
    "help"|"h"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac