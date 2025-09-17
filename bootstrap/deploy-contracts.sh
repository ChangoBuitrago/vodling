#!/bin/bash

# Deploy contracts to local blockchain

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

# Check if blockchain is running
if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
    print_error "Local blockchain is not running. Please start it first:"
    echo "  ./bootstrap/start-blockchain.sh"
    exit 1
fi

# Check if Foundry is installed
if ! command -v forge &> /dev/null; then
    print_error "Foundry is not installed. Please install it first:"
    echo "curl -L https://foundry.paradigm.xyz | bash"
    echo "foundryup"
    exit 1
fi

print_status "Deploying contracts to local blockchain..."

# Deploy contracts
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
