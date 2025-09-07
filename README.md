# Vodling Protocol

A principal-protected ETH staking protocol that uses Lido for staking and allows separate withdrawal of principal and yield.

## Features

- **Principal Protection**: Your original deposit is always protected
- **Lido Integration**: Stakes ETH via Lido to earn stETH
- **Yield Separation**: Withdraw principal and yield separately
- **Chainlink Integration**: ETH/USD price feeds
- **OpenZeppelin Security**: Built on battle-tested libraries

## Setup

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Install dependencies:
```bash
forge install OpenZeppelin/openzeppelin-contracts
```

3. Copy environment file:
```bash
cp env.example .env
# Edit .env with your keys
```

## Testing

```bash
# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Run with gas report
forge test --gas-report

# Run coverage
forge coverage
```

## Deployment

```bash
# Deploy to Goerli
forge script script/Deploy.s.sol --rpc-url goerli --broadcast --verify

# Deploy to Sepolia
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
```

## Contract Addresses

- **Goerli**: TBD
- **Sepolia**: TBD
- **Mainnet**: TBD

## Architecture

The SafeVault contract:
1. Accepts ETH deposits from users
2. Stakes ETH via Lido to receive stETH
3. Tracks each user's principal balance separately
4. Allows users to withdraw principal and yield separately
5. Uses Chainlink for price feeds

## Security

- Built on OpenZeppelin libraries
- Reentrancy protection
- Pausable functionality
- Owner access controls
- Comprehensive test coverage

## Frontend

The frontend is located in the `frontend/` directory. See the frontend README for setup instructions.
