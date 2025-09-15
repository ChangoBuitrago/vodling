# Vodling Protocol

ETH staking protocol with principal protection and yield tracking.

## Start

```bash
./start.sh
```

This starts the blockchain, deploys contracts, and runs the frontend.

- Frontend: http://localhost:3000
- Blockchain: http://localhost:8545

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org/)

## Commands

```bash
# Start everything
./start.sh

# Individual components
npm run start:blockchain  # Start blockchain only
npm run deploy           # Deploy contracts only
npm run stop:blockchain  # Stop blockchain

# Development
npm test                 # Run tests
npm run build           # Build contracts
npm run lint            # Format code
```

## Architecture

- `SafeVault.sol` - Main vault contract
- `MockLido.sol` - Mock Lido for testing
- `MockChainlinkOracle.sol` - Mock oracle for testing
- React frontend in `frontend/`

## Stop

Press `Ctrl+C` to stop all services.

## License

MIT