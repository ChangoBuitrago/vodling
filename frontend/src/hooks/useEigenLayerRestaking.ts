import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { useContract } from './useContract';
import { formatEther } from 'ethers';
import { useState, useEffect } from 'react';

export interface EigenLayerRestakingData {
  userTurboVaultShares: string;
  userEigenLayerShares: string;
  userEigenLayerValue: string;
  userEigenLayerRewards: string;
  totalEigenLayerStaked: string;
  totalEigenLayerValue: string;
  restakingEfficiency: string;
  isLoading: boolean;
  error: string | null;
}

export const useEigenLayerRestaking = () => {
  const { address } = useAccount();
  const { turboVaultContract, mockEigenLayerContract } = useContract();
  const { writeContract } = useWriteContract();
  const [isRestaking, setIsRestaking] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [restakingData, setRestakingData] = useState<EigenLayerRestakingData>({
    userTurboVaultShares: '0',
    userEigenLayerShares: '0',
    userEigenLayerValue: '0',
    userEigenLayerRewards: '0',
    totalEigenLayerStaked: '0',
    totalEigenLayerValue: '0',
    restakingEfficiency: '0.0000',
    isLoading: true,
    error: null,
  });

  // Read user's TurboVault shares
  const { 
    data: userTurboVaultShares, 
    refetch: refetchTurboVaultShares,
    isLoading: isLoadingTurboVaultShares 
  } = useReadContract({
    address: turboVaultContract?.address as `0x${string}` | undefined,
    abi: turboVaultContract?.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!turboVaultContract?.address && !!address,
      refetchInterval: 5000
    }
  });

  // Read user's EigenLayer shares
  const { 
    data: userEigenLayerShares, 
    refetch: refetchEigenLayerShares,
    isLoading: isLoadingEigenLayerShares 
  } = useReadContract({
    address: mockEigenLayerContract?.address as `0x${string}` | undefined,
    abi: mockEigenLayerContract?.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!mockEigenLayerContract?.address && !!address,
      refetchInterval: 5000
    }
  });

  // Read user's EigenLayer value
  const { 
    data: userEigenLayerValue, 
    refetch: refetchEigenLayerValue,
    isLoading: isLoadingEigenLayerValue 
  } = useReadContract({
    address: mockEigenLayerContract?.address as `0x${string}` | undefined,
    abi: mockEigenLayerContract?.abi,
    functionName: 'getUserValue',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!mockEigenLayerContract?.address && !!address,
      refetchInterval: 5000
    }
  });

  // Read user's EigenLayer rewards
  const { 
    data: userEigenLayerRewards, 
    refetch: refetchEigenLayerRewards,
    isLoading: isLoadingEigenLayerRewards 
  } = useReadContract({
    address: mockEigenLayerContract?.address as `0x${string}` | undefined,
    abi: mockEigenLayerContract?.abi,
    functionName: 'getUserRewards',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!mockEigenLayerContract?.address && !!address,
      refetchInterval: 5000
    }
  });

  // Read total EigenLayer staked
  const { 
    data: totalEigenLayerStaked,
    isLoading: isLoadingTotalStaked 
  } = useReadContract({
    address: mockEigenLayerContract?.address as `0x${string}` | undefined,
    abi: mockEigenLayerContract?.abi,
    functionName: 'totalStaked',
    query: { 
      enabled: !!mockEigenLayerContract?.address,
      refetchInterval: 5000
    }
  });

  // Read total EigenLayer value
  const { 
    data: totalEigenLayerValue,
    isLoading: isLoadingTotalValue 
  } = useReadContract({
    address: mockEigenLayerContract?.address as `0x${string}` | undefined,
    abi: mockEigenLayerContract?.abi,
    functionName: 'getTotalValue',
    query: { 
      enabled: !!mockEigenLayerContract?.address,
      refetchInterval: 5000
    }
  });

  // Update restaking data when contract data changes
  useEffect(() => {
    const isLoading = isLoadingTurboVaultShares || isLoadingEigenLayerShares || 
                     isLoadingEigenLayerValue || isLoadingEigenLayerRewards ||
                     isLoadingTotalStaked || isLoadingTotalValue;
    
    if (!isLoading) {
      const turboVaultShares = formatEther(userTurboVaultShares || 0n);
      const eigenLayerShares = formatEther(userEigenLayerShares || 0n);
      const eigenLayerValue = formatEther(userEigenLayerValue || 0n);
      const eigenLayerRewards = formatEther(userEigenLayerRewards || 0n);
      const totalStaked = formatEther(totalEigenLayerStaked || 0n);
      const totalValue = formatEther(totalEigenLayerValue || 0n);
      
      // Calculate restaking efficiency
      const restakingEfficiency = parseFloat(totalStaked) > 0 
        ? (((parseFloat(totalValue) - parseFloat(totalStaked)) / parseFloat(totalStaked)) * 100).toFixed(4)
        : '0.0000';

      setRestakingData({
        userTurboVaultShares: turboVaultShares,
        userEigenLayerShares: eigenLayerShares,
        userEigenLayerValue: eigenLayerValue,
        userEigenLayerRewards: eigenLayerRewards,
        totalEigenLayerStaked: totalStaked,
        totalEigenLayerValue: totalValue,
        restakingEfficiency,
        isLoading: false,
        error: null,
      });
    }
  }, [
    userTurboVaultShares, userEigenLayerShares, userEigenLayerValue, userEigenLayerRewards,
    totalEigenLayerStaked, totalEigenLayerValue,
    isLoadingTurboVaultShares, isLoadingEigenLayerShares, isLoadingEigenLayerValue,
    isLoadingEigenLayerRewards, isLoadingTotalStaked, isLoadingTotalValue
  ]);

  // Restake to EigenLayer function
  const restakeToEigenLayer = async (sharesAmount: string): Promise<boolean> => {
    if (!turboVaultContract?.address || !address) {
      setRestakingData(prev => ({ ...prev, error: 'Contract not available' }));
      return false;
    }
    
    const sharesToRestake = BigInt(Math.floor(parseFloat(sharesAmount) * 1e18));
    if (sharesToRestake <= 0) {
      setRestakingData(prev => ({ ...prev, error: 'Invalid amount' }));
      return false;
    }
    
    setIsRestaking(true);
    setRestakingData(prev => ({ ...prev, error: null }));
    
    try {
      const hash = await writeContract({
        address: turboVaultContract.address as `0x${string}`,
        abi: turboVaultContract.abi,
        functionName: 'restakeToEigenLayer',
        args: [sharesToRestake],
      });
      
      // Wait for transaction confirmation
      await new Promise((resolve, reject) => {
        const checkReceipt = async () => {
          try {
            resolve(hash);
          } catch (error) {
            reject(error);
          }
        };
        checkReceipt();
      });
      
      // Refetch data after successful restaking
      await Promise.all([
        refetchTurboVaultShares(),
        refetchEigenLayerShares(),
        refetchEigenLayerValue(),
        refetchEigenLayerRewards()
      ]);
      
      return true;
    } catch (error) {
      console.error('Error restaking to EigenLayer:', error);
      setRestakingData(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }));
      return false;
    } finally {
      setIsRestaking(false);
    }
  };

  // Withdraw from EigenLayer function
  const withdrawFromEigenLayer = async (sharesAmount: string): Promise<boolean> => {
    if (!mockEigenLayerContract?.address || !address) {
      setRestakingData(prev => ({ ...prev, error: 'Contract not available' }));
      return false;
    }
    
    const sharesToWithdraw = BigInt(Math.floor(parseFloat(sharesAmount) * 1e18));
    if (sharesToWithdraw <= 0) {
      setRestakingData(prev => ({ ...prev, error: 'Invalid amount' }));
      return false;
    }
    
    setIsWithdrawing(true);
    setRestakingData(prev => ({ ...prev, error: null }));
    
    try {
      const hash = await writeContract({
        address: mockEigenLayerContract.address as `0x${string}`,
        abi: mockEigenLayerContract.abi,
        functionName: 'unstake',
        args: [sharesToWithdraw],
      });
      
      // Wait for transaction confirmation
      await new Promise((resolve, reject) => {
        const checkReceipt = async () => {
          try {
            resolve(hash);
          } catch (error) {
            reject(error);
          }
        };
        checkReceipt();
      });
      
      // Refetch data after successful withdrawal
      await Promise.all([
        refetchTurboVaultShares(),
        refetchEigenLayerShares(),
        refetchEigenLayerValue(),
        refetchEigenLayerRewards()
      ]);
      
      return true;
    } catch (error) {
      console.error('Error withdrawing from EigenLayer:', error);
      setRestakingData(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }));
      return false;
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Format values for display
  const formatValue = (value: string): string => {
    const numValue = parseFloat(value);
    if (numValue === 0) return '0.000000';
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(2)}K`;
    } else if (numValue >= 1) {
      return `${numValue.toFixed(4)}`;
    } else {
      return `${numValue.toFixed(6)}`;
    }
  };

  // Helper functions
  const hasTurboVaultShares = parseFloat(restakingData.userTurboVaultShares) > 0;
  const hasEigenLayerShares = parseFloat(restakingData.userEigenLayerShares) > 0;
  const hasRewards = parseFloat(restakingData.userEigenLayerRewards) > 0;

  return {
    restakingData,
    isRestaking,
    isWithdrawing,
    hasTurboVaultShares,
    hasEigenLayerShares,
    hasRewards,
    restakeToEigenLayer,
    withdrawFromEigenLayer,
    formatValue,
    refetchTurboVaultShares,
    refetchEigenLayerShares,
    refetchEigenLayerValue,
    refetchEigenLayerRewards,
  };
};
