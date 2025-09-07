#!/bin/bash

echo "🚀 Setting up Vodling Protocol..."

# Check if Foundry is installed
if ! command -v forge &> /dev/null; then
    echo "📦 Installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    foundryup
else
    echo "✅ Foundry already installed"
fi

# Install OpenZeppelin contracts
echo "📦 Installing OpenZeppelin contracts..."
forge install OpenZeppelin/openzeppelin-contracts

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit .env with your private keys and API keys"
else
    echo "✅ .env file already exists"
fi

# Build contracts
echo "🔨 Building contracts..."
forge build

# Run tests
echo "🧪 Running tests..."
forge test

echo "✅ Smart contracts setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your private keys and API keys"
echo "2. Deploy to testnet: forge script script/Deploy.s.sol --rpc-url sepolia --broadcast"
echo "3. Update frontend contract addresses in frontend/src/utils/contracts.ts"
echo "4. Setup frontend: cd frontend && npm install"
echo ""
echo "🎉 Vodling Protocol is ready to go!"
