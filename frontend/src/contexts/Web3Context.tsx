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

interface TurboVaultState {
  totalAssets: bigint;
  totalSupply: bigint;
  isLoading: boolean;
  lastUpdated: number | null;
}

interface EigenLayerState {
  totalStaked: bigint;
  totalValue: bigint;
  userShares: bigint;
  userValue: bigint;
  userRewards: bigint;
  isLoading: boolean;
  lastUpdated: number | null;
}

interface Web3ContextType {
  balanceState: BalanceState;
  turboVaultState: TurboVaultState;
  eigenLayerState: EigenLayerState;
  refreshBalance: () => Promise<void>;
  refreshTurboVault: () => Promise<void>;
  refreshEigenLayer: () => Promise<void>;
  isRefreshing: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const { address } = useAccount();
  const { safeVaultContract, turboVaultContract, mockEigenLayerContract } = useContract();
  
  const [balanceState, setBalanceState] = useState<BalanceState>({
    principalBalance: 0n,
    yieldBalance: 0n,
    totalBalance: 0n,
    actualWithdrawableBalance: 0n,
    isLoading: true,
    lastUpdated: null,
  });
  
  const [turboVaultState, setTurboVaultState] = useState<TurboVaultState>({
    totalAssets: 0n,
    totalSupply: 0n,
    isLoading: true,
    lastUpdated: null,
  });

  const [eigenLayerState, setEigenLayerState] = useState<EigenLayerState>({
    totalStaked: 0n,
    totalValue: 0n,
    userShares: 0n,
    userValue: 0n,
    userRewards: 0n,
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

  // TurboVault contract read hooks
  const { data: turboVaultTotalAssets = 0n, refetch: refetchTurboVaultAssets } = useContractRead({
    address: turboVaultContract?.address as `0x${string}` | undefined,
    abi: turboVaultContract?.abi,
    functionName: 'totalAssets',
    query: {
      enabled: !!turboVaultContract?.address,
      refetchInterval: false,
      staleTime: 0,
    },
  });

  const { data: turboVaultTotalSupply = 0n, refetch: refetchTurboVaultSupply } = useContractRead({
    address: turboVaultContract?.address as `0x${string}` | undefined,
    abi: turboVaultContract?.abi,
    functionName: 'totalSupply',
    query: {
      enabled: !!turboVaultContract?.address,
      refetchInterval: false,
      staleTime: 0,
    },
  });

  // EigenLayer contract read hooks - now reading from TurboVault instead of user-specific
  const { data: eigenLayerTotalStaked = 0n, refetch: refetchEigenLayerTotalStaked } = useContractRead({
    address: turboVaultContract?.address as `0x${string}` | undefined,
    abi: turboVaultContract?.abi,
    functionName: 'totalEigenLayerShares',
    query: {
      enabled: !!turboVaultContract?.address,
      refetchInterval: false,
      staleTime: 0,
    },
  });

  const { data: eigenLayerTotalValue = 0n, refetch: refetchEigenLayerTotalValue } = useContractRead({
    address: turboVaultContract?.address as `0x${string}` | undefined,
    abi: turboVaultContract?.abi,
    functionName: 'getEigenLayerSharesValue',
    query: {
      enabled: !!turboVaultContract?.address,
      refetchInterval: false,
      staleTime: 0,
    },
  });

  // User shares are now 0 since TurboVault holds all EigenLayer shares
  const eigenLayerUserShares = 0n;
  const eigenLayerUserValue = 0n;
  const eigenLayerUserRewards = 0n;

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
    console.log(`  - Raw Yield Value: ${yield_.toString()} wei`);
    console.log(`  - Raw Principal Value: ${principal.toString()} wei`);
  }, [principalBalance, yieldBalance, actualWithdrawableBalance, address, safeVaultContract?.address]);

  // Update TurboVault state when contract data changes
  React.useEffect(() => {
    if (!turboVaultContract?.address) {
      setTurboVaultState({
        totalAssets: 0n,
        totalSupply: 0n,
        isLoading: true,
        lastUpdated: null,
      });
      return;
    }

    const assets = turboVaultTotalAssets as bigint;
    const supply = turboVaultTotalSupply as bigint;

    setTurboVaultState({
      totalAssets: assets,
      totalSupply: supply,
      isLoading: false,
      lastUpdated: Date.now(),
    });

    console.log('🔄 Web3Context: TurboVault state updated');
    console.log(`  - Total Assets: ${formatEther(assets)} ETH`);
    console.log(`  - Total Supply: ${formatEther(supply)} shares`);
  }, [turboVaultTotalAssets, turboVaultTotalSupply, turboVaultContract?.address]);

  // Update EigenLayer state when contract data changes
  React.useEffect(() => {
    if (!mockEigenLayerContract?.address) {
      setEigenLayerState({
        totalStaked: 0n,
        totalValue: 0n,
        userShares: 0n,
        userValue: 0n,
        userRewards: 0n,
        isLoading: true,
        lastUpdated: null,
      });
      return;
    }

    const totalStaked = eigenLayerTotalStaked as bigint;
    const totalValue = eigenLayerTotalValue as bigint;
    const userShares = eigenLayerUserShares as bigint;
    const userValue = eigenLayerUserValue as bigint;
    const userRewards = eigenLayerUserRewards as bigint;

    setEigenLayerState({
      totalStaked,
      totalValue,
      userShares,
      userValue,
      userRewards,
      isLoading: false,
      lastUpdated: Date.now(),
    });

    console.log('🔄 Web3Context: EigenLayer state updated');
    console.log(`  - Total Staked: ${formatEther(totalStaked)} ETH`);
    console.log(`  - Total Value: ${formatEther(totalValue)} ETH`);
    console.log(`  - User Shares: ${formatEther(userShares)} shares`);
    console.log(`  - User Value: ${formatEther(userValue)} ETH`);
    console.log(`  - User Rewards: ${formatEther(userRewards)} ETH`);
  }, [eigenLayerTotalStaked, eigenLayerTotalValue, eigenLayerUserShares, eigenLayerUserValue, eigenLayerUserRewards, mockEigenLayerContract?.address]);

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
      console.log(`  - Raw New Yield: ${(newYield || 0n).toString()} wei`);
      console.log(`  - Raw New Principal: ${(newPrincipal || 0n).toString()} wei`);

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

  // Function to manually refresh TurboVault data
  const refreshTurboVault = useCallback(async () => {
    if (!turboVaultContract?.address) {
      console.log('⚠️ Cannot refresh TurboVault: missing contract');
      return;
    }

    setIsRefreshing(true);
    console.log('🔄 Web3Context: Manually refreshing TurboVault data...');

    try {
      const results = await Promise.all([
        refetchTurboVaultAssets(),
        refetchTurboVaultSupply(),
      ]);

      const newAssets = results[0]?.data as bigint;
      const newSupply = results[1]?.data as bigint;

      console.log('✅ Web3Context: TurboVault refresh completed');
      console.log(`  - New Assets: ${formatEther(newAssets || 0n)} ETH`);
      console.log(`  - New Supply: ${formatEther(newSupply || 0n)} shares`);

      // Update state with new data
      setTurboVaultState(prev => ({
        ...prev,
        totalAssets: newAssets || 0n,
        totalSupply: newSupply || 0n,
        lastUpdated: Date.now(),
      }));

    } catch (error) {
      console.error('❌ Web3Context: Error refreshing TurboVault:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [turboVaultContract?.address, refetchTurboVaultAssets, refetchTurboVaultSupply]);

  // Function to manually refresh EigenLayer data
  const refreshEigenLayer = useCallback(async () => {
    if (!turboVaultContract?.address) {
      console.log('⚠️ Cannot refresh EigenLayer: missing TurboVault contract');
      return;
    }

    setIsRefreshing(true);
    console.log('🔄 Web3Context: Manually refreshing EigenLayer data...');

    try {
      const results = await Promise.all([
        refetchEigenLayerTotalStaked(),
        refetchEigenLayerTotalValue(),
      ]);

      const newTotalStaked = results[0]?.data as bigint;
      const newTotalValue = results[1]?.data as bigint;

      console.log('✅ Web3Context: EigenLayer refresh completed');
      console.log(`  - New Total Staked: ${formatEther(newTotalStaked || 0n)} shares`);
      console.log(`  - New Total Value: ${formatEther(newTotalValue || 0n)} ETH`);

      // Update state with new data
      setEigenLayerState(prev => ({
        ...prev,
        totalStaked: newTotalStaked || 0n,
        totalValue: newTotalValue || 0n,
        userShares: 0n, // TurboVault holds all shares
        userValue: 0n,   // Users don't have direct EigenLayer shares
        userRewards: 0n, // Users get rewards through TurboVault shares
        lastUpdated: Date.now(),
      }));

    } catch (error) {
      console.error('❌ Web3Context: Error refreshing EigenLayer:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [turboVaultContract?.address, refetchEigenLayerTotalStaked, refetchEigenLayerTotalValue]);

  const contextValue: Web3ContextType = {
    balanceState,
    turboVaultState,
    eigenLayerState,
    refreshBalance,
    refreshTurboVault,
    refreshEigenLayer,
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
