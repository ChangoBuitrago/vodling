#!/bin/bash

# Vodling Protocol - Complete Startup Script
# This script handles everything needed to get the project running

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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v forge &> /dev/null; then
        print_error "Foundry is not installed. Please install it first:"
        echo "curl -L https://foundry.paradigm.xyz | bash"
        echo "foundryup"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install it first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install Foundry dependencies
    forge install --no-commit
    
    # Install frontend dependencies
    if [ ! -d "frontend/node_modules" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
        print_success "Frontend dependencies installed"
    else
        print_success "Frontend dependencies already installed"
    fi
}

# Start local blockchain
start_blockchain() {
    print_status "Starting local blockchain..."
    
    # Check if anvil is already running
    if curl -s http://localhost:8545 > /dev/null 2>&1; then
        print_success "Local blockchain already running at http://localhost:8545"
    else
        print_status "Starting Anvil blockchain..."
        anvil --host 0.0.0.0 --port 8545 > anvil.log 2>&1 &
        ANVIL_PID=$!
        
        # Wait for anvil to start
        print_status "Waiting for blockchain to start..."
        for i in {1..30}; do
            if curl -s http://localhost:8545 > /dev/null 2>&1; then
                print_success "Local blockchain started successfully!"
                break
            fi
            sleep 1
        done
        
        # Check if anvil started successfully
        if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
            print_error "Failed to start local blockchain"
            exit 1
        fi
        
        echo $ANVIL_PID > anvil.pid
        print_status "Blockchain PID: $ANVIL_PID (saved to anvil.pid)"
    fi
}

# Deploy contracts
deploy_contracts() {
    print_status "Deploying contracts to local blockchain..."
    
    forge script script/DeployLocal.s.sol \
        --rpc-url http://localhost:8545 \
        --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --broadcast
    
    print_success "Contracts deployed successfully"
}

# Update frontend contract addresses
update_frontend() {
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
        case 'MockChainlinkOracle':
          addresses.MOCK_CHAINLINK_ORACLE = address;
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
  
  // Write the updated content back
  fs.writeFileSync(contractsPath, contractsContent);
  
  console.log('✅ Contract addresses updated successfully!');
  console.log('Updated addresses:');
  console.log(\`  SafeVault: \${addresses.SAFE_VAULT}\`);
  console.log(\`  MockLido: \${addresses.MOCK_LIDO}\`);
  console.log(\`  MockChainlinkOracle: \${addresses.MOCK_CHAINLINK_ORACLE}\`);
  
} catch (error) {
  console.error('❌ Error updating contract addresses:', error.message);
  process.exit(1);
}
"
    
    print_success "Frontend contract addresses updated"
}

# Start frontend
start_frontend() {
    print_status "Starting frontend development server..."
    
    cd frontend
    print_success "Frontend starting at http://localhost:3000"
    print_warning "Press Ctrl+C to stop all services"
    echo
    
    # Start the frontend (this will block)
    npm start
}

# Cleanup function
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

# Trap to cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    echo "🚀 Starting Vodling Protocol..."
    echo "==============================="
    echo
    
    check_dependencies
    install_dependencies
    start_blockchain
    deploy_contracts
    update_frontend
    
    echo
    print_success "🎉 Setup complete! Starting frontend..."
    echo
    print_status "Your Vodling Protocol is now running:"
    echo "  • Local blockchain: http://localhost:8545"
    echo "  • Frontend: http://localhost:3000"
    echo
    
    start_frontend
}

# Run main function
main