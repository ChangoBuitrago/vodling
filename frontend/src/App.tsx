import React, { useState } from 'react';
import { WagmiProvider, http, createConfig } from 'wagmi';
import { mainnet, sepolia, localhost } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, metaMask } from 'wagmi/connectors';
import './App.css';

import Header from './components/Header';
import DepositForm from './components/DepositForm';
import WithdrawForm from './components/WithdrawForm';
import BalanceCard from './components/BalanceCard';
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
  const [isTestingToolsOpen, setIsTestingToolsOpen] = useState(false);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="app-container">
          {/* Animated background */}
          <div className="animated-bg"></div>
          
          <Header onToggleTestingTools={() => setIsTestingToolsOpen(!isTestingToolsOpen)} />
          
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {/* Main Content - User Actions */}
              <div className="space-y-6">
                <BalanceCard />
                <DepositForm />
                <WithdrawForm />
              </div>
            </div>
          </main>

          {/* Testing Tools Sidebar */}
          <div className={`fixed right-0 top-0 h-full w-full sm:w-80 bg-black/90 backdrop-blur-xl border-l border-vodl-500/20 transform transition-transform duration-300 ease-in-out z-50 ${
            isTestingToolsOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="p-6 h-full overflow-y-auto testing-tools-sidebar">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="strategy-icon icon-bg-indigo">
                    <i className="fas fa-flask icon-text-indigo text-xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-white ml-4">Testing Tools</h3>
                </div>
                <button
                  onClick={() => setIsTestingToolsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <YieldTester />
            </div>
          </div>

          {/* Overlay for mobile */}
          {isTestingToolsOpen && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsTestingToolsOpen(false)}
            />
          )}
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
