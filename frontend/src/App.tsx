import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider, http, createConfig } from 'wagmi';
import { mainnet, sepolia, localhost } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, metaMask } from 'wagmi/connectors';
import './App.css';

import Header from './components/Header';
import TransactionForm from './components/TransactionForm';
import BalanceCard from './components/BalanceCard';
import HarvestButton from './components/HarvestButton';
import TestingPage from './pages/TestingPage';
import { Web3Provider } from './contexts/Web3Context';

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

// Main App Component
const MainApp: React.FC = () => {
  return (
    <div className="app-container">
      {/* Animated background */}
      <div className="animated-bg"></div>
      
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="space-y-6">
          {/* Main Content - User Actions */}
          <div className="space-y-6">
            <BalanceCard />
            <TransactionForm />
            <HarvestButton />
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Web3Provider>
          <Router>
            <Routes>
              <Route path="/" element={<MainApp />} />
              <Route path="/simulation" element={<TestingPage />} />
            </Routes>
          </Router>
        </Web3Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;