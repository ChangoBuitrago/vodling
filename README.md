# SafeVault Protocol

A secure, principal-protected ETH staking protocol that leverages Lido for staking rewards while maintaining separate principal and yield tracking. Built with security-first principles and comprehensive testing.

## 🚀 Features

- **🛡️ Principal Protection**: Your original ETH deposit is always protected and withdrawable
- **📈 Yield Generation**: Automatic staking via Lido to earn stETH rewards
- **💰 Flexible Withdrawals**: Withdraw principal and yield separately as needed
- **🔗 Chainlink Integration**: Real-time ETH/USD price feeds for accurate valuations
- **🔒 Security First**: Built on OpenZeppelin's battle-tested libraries
- **⏸️ Emergency Controls**: Pausable functionality for emergency situations
- **🎯 Gas Optimized**: Efficient contract design for minimal transaction costs

## 🏗️ Architecture

### Smart Contract Components

- **SafeVault.sol**: Main vault contract handling deposits, staking, and withdrawals
- **IChainlinkOracle.sol**: Interface for Chainlink price feed integration
- **ILido.sol**: Interface for Lido stETH operations
- **MockChainlinkOracle.sol**: Mock oracle for testing
- **MockLido.sol**: Mock Lido contract for testing

### How It Works

1. **Deposit**: Users deposit ETH into the SafeVault
2. **Staking**: Contract automatically stakes ETH via Lido to receive stETH
3. **Tracking**: System tracks each user's principal balance separately
4. **Yield Accumulation**: stETH rewards accumulate over time
5. **Withdrawal**: Users can withdraw principal and yield independently

## 🛠️ Setup

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org/) (for frontend)
- Git

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/ChangoBuitrago/vodling.git
cd vodling
```

2. **Install Foundry dependencies**:
```bash
forge install
```

3. **Set up environment variables**:
```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Install frontend dependencies**:
```bash
cd frontend
npm install
cd ..
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Run with gas report
forge test --gas-report

# Run test coverage
forge coverage
```

### Test Coverage

The test suite includes:
- ✅ Deposit functionality
- ✅ Withdrawal mechanisms
- ✅ Lido integration
- ✅ Chainlink oracle integration
- ✅ Access controls
- ✅ Emergency pause functionality
- ✅ Reentrancy protection

## 🚀 Deployment

### Local Development

```bash
# Deploy to local Anvil network
forge script script/DeployLocal.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Testnet Deployment

```bash
# Deploy to Sepolia testnet
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify

# Deploy to Goerli testnet
forge script script/Deploy.s.sol --rpc-url goerli --broadcast --verify
```

### Mainnet Deployment

```bash
# Deploy to Ethereum mainnet
forge script script/Deploy.s.sol --rpc-url mainnet --broadcast --verify
```

## 🌐 Frontend

The React frontend provides a user-friendly interface for interacting with the SafeVault protocol.

### Frontend Features

- 🔗 Wallet connection (MetaMask, WalletConnect)
- 💰 Deposit ETH into the vault
- 📊 View balance and yield information
- 💸 Withdraw principal and yield
- ⚡ Real-time transaction status
- 🎨 Modern, responsive UI

### Running the Frontend

```bash
cd frontend
npm start
```

The frontend will be available at `http://localhost:3000`.

## 📋 Contract Addresses

| Network | Contract Address | Status |
|---------|------------------|--------|
| Local | TBD | Development |
| Sepolia | TBD | Testnet |
| Goerli | TBD | Testnet |
| Mainnet | TBD | Production |

## 🔒 Security

### Security Features

- **Reentrancy Protection**: Prevents reentrancy attacks
- **Access Controls**: Owner-only functions for critical operations
- **Pausable**: Emergency pause functionality
- **OpenZeppelin**: Built on industry-standard security libraries
- **Comprehensive Testing**: Extensive test coverage including edge cases

### Audit Status

- ✅ Internal security review completed
- 🔄 External audit planned

## 📊 Gas Optimization

The contract is optimized for gas efficiency:
- Minimal storage operations
- Efficient event emissions
- Optimized function logic
- Batch operations where possible

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: [Your Email]
- 💬 Discord: [Your Discord]
- 🐛 Issues: [GitHub Issues](https://github.com/ChangoBuitrago/vodling/issues)

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for security libraries
- [Lido](https://lido.fi/) for staking infrastructure
- [Chainlink](https://chain.link/) for price feeds
- [Foundry](https://book.getfoundry.sh/) for development framework

---

**⚠️ Disclaimer**: This is experimental software. Use at your own risk. Always conduct your own research and consider the risks before using any DeFi protocol.
