# Vodling Protocol

ETH staking protocol with principal protection and yield tracking.

## Quick Start

```bash
./start.sh
```

This is the **single entry point** for the entire project. It handles everything needed to get the project running:

- Checks and installs dependencies
- Starts local blockchain (Anvil)
- Deploys smart contracts
- Updates frontend contract addresses
- Starts the React frontend

**Access Points:**
- Frontend: http://localhost:3000
- Blockchain: http://localhost:8545

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, anvil, cast)
- [Node.js](https://nodejs.org/)
- [jq](https://stedolan.github.io/jq/) (for JSON processing)

## Commands

The `start.sh` script is your **single command** for all project operations:

```bash
# Complete development environment (default)
./start.sh
./start.sh start
./start.sh dev

# Individual components
./start.sh blockchain    # Start blockchain only
./start.sh deploy       # Deploy contracts only
./start.sh frontend     # Start frontend only

# Development & Testing
./start.sh test         # Run tests
./start.sh build        # Build contracts
./start.sh verify       # Verify deployment

# Management
./start.sh stop         # Stop all services
./start.sh clean        # Clean all generated files
./start.sh help         # Show help menu

# NPM shortcuts (all point to start.sh)
npm start               # Same as ./start.sh
npm run dev            # Same as ./start.sh start
npm run blockchain     # Same as ./start.sh blockchain
npm run deploy         # Same as ./start.sh deploy
npm run test           # Same as ./start.sh test
npm run build          # Same as ./start.sh build
npm run verify         # Same as ./start.sh verify
npm run stop           # Same as ./start.sh stop
npm run clean          # Same as ./start.sh clean
```

## What the Script Does

The `start.sh` script integrates all the functionality from the previous separate scripts:

- **Dependency checking**: Verifies Foundry, Node.js, npm, and jq are installed
- **Dependency installation**: Installs Foundry dependencies and frontend packages
- **Blockchain management**: Starts/stops Anvil with proper PID tracking
- **Contract deployment**: Deploys contracts and automatically updates frontend addresses
- **Frontend management**: Starts the React development server
- **Testing & verification**: Runs tests and verifies contract deployments
- **Cleanup**: Properly stops services and cleans up generated files

## Architecture

- `SafeVault.sol` - Main vault contract
- `MockLido.sol` - Mock Lido for testing
- `MockChainlinkOracle.sol` - Mock oracle for testing
- React frontend in `frontend/`

## Stop

Press `Ctrl+C` to stop all services.

## License

MIT