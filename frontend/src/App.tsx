import React from 'react';
import { WagmiProvider, http, createConfig } from 'wagmi';
import { mainnet, sepolia, localhost } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, metaMask } from 'wagmi/connectors';
import './App.css';

import Header from './components/Header';
import WalletConnect from './components/WalletConnect';
import DepositForm from './components/DepositForm';
import WithdrawForm from './components/WithdrawForm';
import BalanceCard from './components/BalanceCard';
import StatsCard from './components/StatsCard';
import YieldTester from './components/YieldTester';

// Create a localhost chain configuration
const localhostChain = {
  ...localhost,
  id: 31337,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
    public: {
      http: ['http://localhost:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Local', url: 'http://localhost:8545' },
  },
  testnet: true,
};

// Create a custom config without WalletConnect to avoid WebSocket issues
const config = createConfig({
  chains: [localhostChain, sepolia, mainnet],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [localhostChain.id]: http('http://localhost:8545'),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Vodling Protocol
              </h1>
              <p className="text-lg text-gray-600">
                Principal-protected ETH staking with Lido
              </p>
            </div>

            <WalletConnect />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - User Actions */}
              <div className="lg:col-span-2 space-y-6">
                <BalanceCard />
                <DepositForm />
                <WithdrawForm />
                <YieldTester />
              </div>

              {/* Right Column - Stats */}
              <div className="space-y-6">
                <StatsCard />
              </div>
            </div>
          </main>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
