import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useContract } from './useContract';
import { formatEther } from 'ethers';
import { useState, useEffect } from 'react';

export interface YieldClaimData {
  claimableShares: string;
  userPrincipal: string;
  totalPrincipal: string;
  userSharePercentage: string;
  isLoading: boolean;
  error: string | null;
}

export const useYieldClaim = () => {
  const { address } = useAccount();
  const { safeVaultContract } = useContract();
  const { writeContract } = useWriteContract();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimData, setClaimData] = useState<YieldClaimData>({
    claimableShares: '0',
    userPrincipal: '0',
    totalPrincipal: '0',
    userSharePercentage: '0.00',
    isLoading: true,
    error: null,
  });

  // Read claimable yield shares
  const { 
    data: claimableSharesData, 
    refetch: refetchClaimable,
    isLoading: isLoadingClaimable 
  } = useReadContract({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getClaimableYieldShares',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!safeVaultContract?.address && !!address,
      refetchInterval: 5000
    }
  });

  // Read user's principal balance
  const { 
    data: userPrincipal, 
    isLoading: isLoadingPrincipal 
  } = useReadContract({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getUserPrincipal',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!safeVaultContract?.address && !!address,
      refetchInterval: 5000
    }
  });

  // Read total principal
  const { 
    data: totalPrincipal, 
    isLoading: isLoadingTotal 
  } = useReadContract({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'totalPrincipal',
    query: { 
      enabled: !!safeVaultContract?.address,
      refetchInterval: 5000
    }
  });

  // Update claim data when contract data changes
  useEffect(() => {
    const isLoading = isLoadingClaimable || isLoadingPrincipal || isLoadingTotal;
    
    if (!isLoading) {
      const claimableShares = formatEther(typeof claimableSharesData === 'bigint' ? claimableSharesData : 0n);
      const userPrincipalStr = formatEther(typeof userPrincipal === 'bigint' ? userPrincipal : 0n);
      const totalPrincipalStr = formatEther(typeof totalPrincipal === 'bigint' ? totalPrincipal : 0n);
      
      // Calculate user's share percentage
      const userSharePercentage = parseFloat(totalPrincipalStr) > 0
        ? ((parseFloat(userPrincipalStr) / parseFloat(totalPrincipalStr)) * 100).toFixed(2)
        : '0.00';

      setClaimData({
        claimableShares,
        userPrincipal: userPrincipalStr,
        totalPrincipal: totalPrincipalStr,
        userSharePercentage,
        isLoading: false,
        error: null,
      });
    }
  }, [claimableSharesData, userPrincipal, totalPrincipal, isLoadingClaimable, isLoadingPrincipal, isLoadingTotal]);

  // Claim yield shares function
  const claimYieldShares = async (): Promise<boolean> => {
    if (!safeVaultContract?.address || !address) {
      setClaimData(prev => ({ ...prev, error: 'Contract not available' }));
      return false;
    }
    
    setIsClaiming(true);
    setClaimData(prev => ({ ...prev, error: null }));
    
    try {
      const hash = await writeContract({
        address: safeVaultContract.address as `0x${string}`,
        abi: safeVaultContract.abi,
        functionName: 'claimYieldShares',
      });
      
      // Wait for transaction confirmation
      await new Promise((resolve, reject) => {
        const checkReceipt = async () => {
          try {
            // The transaction will be handled by wagmi's useWaitForTransactionReceipt
            resolve(hash);
          } catch (error) {
            reject(error);
          }
        };
        checkReceipt();
      });
      
      // Refetch data after successful claim
      await refetchClaimable();
      return true;
    } catch (error) {
      console.error('Error claiming yield shares:', error);
      setClaimData(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }));
      return false;
    } finally {
      setIsClaiming(false);
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
  const hasClaimableShares = parseFloat(claimData.claimableShares) > 0;
  const hasPrincipal = parseFloat(claimData.userPrincipal) > 0;

  return {
    claimData,
    isClaiming,
    hasClaimableShares,
    hasPrincipal,
    claimYieldShares,
    formatValue,
    refetchClaimable,
  };
};
