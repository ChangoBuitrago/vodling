import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { formatEther } from 'ethers';

interface BalanceState {
  principalBalance: bigint;
  yieldBalance: bigint;
  totalBalance: bigint;
  actualWithdrawableBalance: bigint;
  isLoading: boolean;
  lastUpdated: number | null;
}

interface Web3ContextType {
  balanceState: BalanceState;
  refreshBalance: () => Promise<void>;
  isRefreshing: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const { address } = useAccount();
  const { safeVaultContract } = useContract();
  
  const [balanceState, setBalanceState] = useState<BalanceState>({
    principalBalance: 0n,
    yieldBalance: 0n,
    totalBalance: 0n,
    actualWithdrawableBalance: 0n,
    isLoading: true,
    lastUpdated: null,
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Contract read hooks with refetch capabilities
  const { data: principalBalance = 0n, refetch: refetchPrincipalBalance } = useContractRead({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getUserPrincipal',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!safeVaultContract?.address,
      refetchInterval: false,
      staleTime: 0,
    },
  });

  const { data: yieldBalance = 0n, refetch: refetchYieldBalance } = useContractRead({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getUserYield',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!safeVaultContract?.address,
      refetchInterval: false,
      staleTime: 0,
    },
  });

  const { data: actualWithdrawableBalance = 0n, refetch: refetchActualBalance } = useContractRead({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getUserActualWithdrawableBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!safeVaultContract?.address,
      refetchInterval: false,
      staleTime: 0,
    },
  });

  // Update balance state when contract data changes
  React.useEffect(() => {
    if (!address || !safeVaultContract?.address) {
      setBalanceState({
        principalBalance: 0n,
        yieldBalance: 0n,
        totalBalance: 0n,
        actualWithdrawableBalance: 0n,
        isLoading: true,
        lastUpdated: null,
      });
      return;
    }

    const principal = principalBalance as bigint;
    const yield_ = yieldBalance as bigint;
    const total = principal + yield_;
    const actual = actualWithdrawableBalance as bigint;

    setBalanceState({
      principalBalance: principal,
      yieldBalance: yield_,
      totalBalance: total,
      actualWithdrawableBalance: actual,
      isLoading: false,
      lastUpdated: Date.now(),
    });

    console.log('🔄 Web3Context: Balance state updated');
    console.log(`  - Principal: ${formatEther(principal)} ETH`);
    console.log(`  - Yield: ${formatEther(yield_)} ETH`);
    console.log(`  - Total: ${formatEther(total)} ETH`);
    console.log(`  - Actual Withdrawable: ${formatEther(actual)} ETH`);
  }, [principalBalance, yieldBalance, actualWithdrawableBalance, address, safeVaultContract?.address]);

  // Function to manually refresh balance data
  const refreshBalance = useCallback(async () => {
    if (!address || !safeVaultContract?.address) {
      console.log('⚠️ Cannot refresh balance: missing address or contract');
      return;
    }

    setIsRefreshing(true);
    console.log('🔄 Web3Context: Manually refreshing balance data...');

    try {
      const results = await Promise.all([
        refetchPrincipalBalance(),
        refetchYieldBalance(),
        refetchActualBalance(),
      ]);

      const newPrincipal = results[0]?.data as bigint;
      const newYield = results[1]?.data as bigint;
      const newActual = results[2]?.data as bigint;
      const newTotal = (newPrincipal || 0n) + (newYield || 0n);

      console.log('✅ Web3Context: Balance refresh completed');
      console.log(`  - New Principal: ${formatEther(newPrincipal || 0n)} ETH`);
      console.log(`  - New Yield: ${formatEther(newYield || 0n)} ETH`);
      console.log(`  - New Total: ${formatEther(newTotal)} ETH`);
      console.log(`  - New Actual: ${formatEther(newActual || 0n)} ETH`);

      // Update state with new data
      setBalanceState(prev => ({
        ...prev,
        principalBalance: newPrincipal || 0n,
        yieldBalance: newYield || 0n,
        totalBalance: newTotal,
        actualWithdrawableBalance: newActual || 0n,
        lastUpdated: Date.now(),
      }));

    } catch (error) {
      console.error('❌ Web3Context: Error refreshing balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [address, safeVaultContract?.address, refetchPrincipalBalance, refetchYieldBalance, refetchActualBalance]);

  const contextValue: Web3ContextType = {
    balanceState,
    refreshBalance,
    isRefreshing,
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3Context = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3Context must be used within a Web3Provider');
  }
  return context;
};
