# Vodling Protocol

A secure, principal-protected ETH staking protocol that leverages Lido for staking rewards while maintaining separate principal and yield tracking.

## 🚀 Quick Start

**One command to rule them all:**

```bash
npm start
```

That's it! This single command will:
- ✅ Check all dependencies
- ✅ Install required packages
- ✅ Start local blockchain (Anvil)
- ✅ Deploy all contracts
- ✅ Update frontend configuration
- ✅ Start the React frontend

Your protocol will be running at:
- **Frontend**: http://localhost:3000
- **Blockchain**: http://localhost:8545

## 🛠️ Prerequisites

Make sure you have these installed:
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org/)
- Git

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with verbose output
npm run test:verbose

# Run with gas report
npm run test:gas

# Run test coverage
npm run coverage
```

## 🏗️ Development

```bash
# Build contracts
npm run build

# Format code
npm run lint

# Check contract sizes
npm run size
```

## 🔒 Security Features

- **Principal Protection**: Your original ETH deposit is always protected
- **Yield Generation**: Automatic staking via Lido to earn stETH rewards
- **Flexible Withdrawals**: Withdraw principal and yield separately
- **Chainlink Integration**: Real-time ETH/USD price feeds
- **Emergency Controls**: Pausable functionality
- **Reentrancy Protection**: Built-in security measures

## 📊 Architecture

- **SafeVault.sol**: Main vault contract
- **MockLido.sol**: Mock Lido for testing
- **MockChainlinkOracle.sol**: Mock oracle for testing
- **React Frontend**: Modern web interface

## 🆘 Stopping the Protocol

Press `Ctrl+C` in the terminal where you ran `npm start` to stop all services.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**⚠️ Disclaimer**: This is experimental software. Use at your own risk.