import React from 'react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { mainnet, goerli, sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import './App.css';

import Header from './components/Header';
import WalletConnect from './components/WalletConnect';
import DepositForm from './components/DepositForm';
import WithdrawForm from './components/WithdrawForm';
import BalanceCard from './components/BalanceCard';
import StatsCard from './components/StatsCard';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, goerli, sepolia],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'Vodling Protocol',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains
});

const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains}>
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
                </div>

                {/* Right Column - Stats */}
                <div className="space-y-6">
                  <StatsCard />
                </div>
              </div>
            </main>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}

export default App;
