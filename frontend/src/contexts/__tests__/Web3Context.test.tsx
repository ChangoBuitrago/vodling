import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { Web3Provider, useWeb3Context } from '../Web3Context';

// Mock wagmi config for testing
const config = createConfig({
  chains: [mainnet],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

// Test component that uses the context
const TestComponent = () => {
  const { balanceState, refreshBalance, isRefreshing } = useWeb3Context();
  
  return (
    <div>
      <div data-testid="principal-balance">{balanceState.principalBalance.toString()}</div>
      <div data-testid="yield-balance">{balanceState.yieldBalance.toString()}</div>
      <div data-testid="total-balance">{balanceState.totalBalance.toString()}</div>
      <div data-testid="is-loading">{balanceState.isLoading.toString()}</div>
      <div data-testid="is-refreshing">{isRefreshing.toString()}</div>
      <button data-testid="refresh-button" onClick={refreshBalance}>
        Refresh Balance
      </button>
    </div>
  );
};

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        {children}
      </Web3Provider>
    </QueryClientProvider>
  </WagmiProvider>
);

describe('Web3Context', () => {
  it('should provide initial balance state', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('principal-balance')).toHaveTextContent('0');
    expect(screen.getByTestId('yield-balance')).toHaveTextContent('0');
    expect(screen.getByTestId('total-balance')).toHaveTextContent('0');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    expect(screen.getByTestId('is-refreshing')).toHaveTextContent('false');
  });

  it('should expose refreshBalance function', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const refreshButton = screen.getByTestId('refresh-button');
    expect(refreshButton).toBeInTheDocument();
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useWeb3Context must be used within a Web3Provider');
    
    consoleSpy.mockRestore();
  });
});
