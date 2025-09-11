import { useAccount, useContractRead, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useContract } from './useContract';
import { parseEther } from 'ethers';
import { useState, useEffect, useCallback } from 'react';

export const useSafeVault = () => {
  const { address } = useAccount();
  const { safeVaultContract } = useContract();
  
  // Loading states
  const [isDepositPending, setIsDepositPending] = useState(false);
  const [isWithdrawPrincipalPending, setIsWithdrawPrincipalPending] = useState(false);
  const [isWithdrawYieldPending, setIsWithdrawYieldPending] = useState(false);

  // Read functions with refetch capabilities
  const { data: principalBalance = 0n, refetch: refetchPrincipalBalance } = useContractRead({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getUserPrincipal',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false, // Disable automatic refetch
      staleTime: 0, // Always consider data stale
    },
  });

  const { data: yieldBalance = 0n, refetch: refetchYieldBalance } = useContractRead({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getUserYield',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false, // Disable automatic refetch
      staleTime: 0, // Always consider data stale
    },
  });

  const { data: totalBalance = 0n, refetch: refetchTotalBalance } = useContractRead({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getUserTotalBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false, // Disable automatic refetch
      staleTime: 0, // Always consider data stale
    },
  });

  const { data: totalPrincipal = 0n, refetch: refetchTotalPrincipal } = useContractRead({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'totalPrincipal',
    query: {
      refetchInterval: false, // Disable automatic refetch
      staleTime: 0, // Always consider data stale
    },
  });

  const { data: totalYield = 0n, refetch: refetchTotalYield } = useContractRead({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getTotalYield',
    query: {
      refetchInterval: false, // Disable automatic refetch
      staleTime: 0, // Always consider data stale
    },
  });

  const { data: ethPrice = 0n } = useContractRead({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getETHPrice',
  });

  const { data: minDeposit = parseEther('0.01') } = useContractRead({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'minDeposit',
  });

  const { data: maxDeposit = parseEther('1000') } = useContractRead({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'maxDeposit',
  });

  // Write functions
  const { writeContract, data: depositTx, isPending: isDepositWriting } = useWriteContract();
  const { writeContract: writeWithdrawPrincipal, data: withdrawPrincipalTx, isPending: isWithdrawPrincipalWriting } = useWriteContract();
  const { writeContract: writeWithdrawYield, data: withdrawYieldTx, isPending: isWithdrawYieldWriting } = useWriteContract();

  // Wait for transactions
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess, data: depositReceipt } = useWaitForTransactionReceipt({
    hash: depositTx,
  });

  const { isLoading: isWithdrawPrincipalConfirming, isSuccess: isWithdrawPrincipalSuccess } = useWaitForTransactionReceipt({
    hash: withdrawPrincipalTx,
  });

  const { isLoading: isWithdrawYieldConfirming, isSuccess: isWithdrawYieldSuccess } = useWaitForTransactionReceipt({
    hash: withdrawYieldTx,
  });

  // Combined loading states
  const isDepositLoading = isDepositPending || isDepositWriting || isDepositConfirming;
  const isWithdrawPrincipalLoading = isWithdrawPrincipalPending || isWithdrawPrincipalWriting || isWithdrawPrincipalConfirming;
  const isWithdrawYieldLoading = isWithdrawYieldPending || isWithdrawYieldWriting || isWithdrawYieldConfirming;
  const isLoading = isDepositLoading || isWithdrawPrincipalLoading || isWithdrawYieldLoading;

  // Function to refetch all data
  const refetchAllData = useCallback(async () => {
    console.log('Refetching all data...');
    console.log('Contract address:', safeVaultContract?.address);
    console.log('User address:', address);
    console.log('Current principal balance:', principalBalance);
    console.log('Current yield balance:', yieldBalance);
    
    // Add a small delay to ensure the transaction is fully processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const results = await Promise.all([
        refetchPrincipalBalance(),
        refetchYieldBalance(),
        refetchTotalBalance(),
        refetchTotalPrincipal(),
        refetchTotalYield(),
      ]);
      
      console.log('Refetch results:', results);
      console.log('New principal balance:', results[0]?.data);
      console.log('New yield balance:', results[1]?.data);
      console.log('New total balance:', results[2]?.data);
    } catch (error) {
      console.error('Error during refetch:', error);
    }
  }, [refetchPrincipalBalance, refetchYieldBalance, refetchTotalBalance, refetchTotalPrincipal, refetchTotalYield, safeVaultContract?.address, address, principalBalance, yieldBalance]);

  // Manual refetch only - no automatic intervals

  const deposit = async (amount: bigint) => {
    try {
      setIsDepositPending(true);
      await writeContract({
        address: safeVaultContract?.address as `0x${string}`,
        abi: safeVaultContract?.abi,
        functionName: 'deposit',
        args: [amount],
        value: amount,
      });
    } catch (error) {
      setIsDepositPending(false);
      throw error;
    }
  };

  const withdrawPrincipal = async (amount: bigint) => {
    try {
      setIsWithdrawPrincipalPending(true);
      await writeWithdrawPrincipal({
        address: safeVaultContract?.address as `0x${string}`,
        abi: safeVaultContract?.abi,
        functionName: 'withdrawPrincipal',
        args: [amount],
      });
    } catch (error) {
      setIsWithdrawPrincipalPending(false);
      throw error;
    }
  };

  const withdrawYield = async (amount: bigint) => {
    try {
      setIsWithdrawYieldPending(true);
      await writeWithdrawYield({
        address: safeVaultContract?.address as `0x${string}`,
        abi: safeVaultContract?.abi,
        functionName: 'withdrawYield',
        args: [amount],
      });
    } catch (error) {
      setIsWithdrawYieldPending(false);
      throw error;
    }
  };

  // Reset pending states and refetch data when transactions complete
  useEffect(() => {
    console.log('Deposit success state:', isDepositSuccess);
    console.log('Deposit receipt:', depositReceipt);
    if (isDepositSuccess) {
      console.log('Deposit success detected, refetching data...');
      setIsDepositPending(false);
      refetchAllData();
    }
  }, [isDepositSuccess, depositReceipt, refetchAllData]);

  useEffect(() => {
    console.log('Withdraw principal success state:', isWithdrawPrincipalSuccess);
    if (isWithdrawPrincipalSuccess) {
      console.log('Withdraw principal success detected, refetching data...');
      setIsWithdrawPrincipalPending(false);
      refetchAllData();
    }
  }, [isWithdrawPrincipalSuccess, refetchAllData]);

  useEffect(() => {
    console.log('Withdraw yield success state:', isWithdrawYieldSuccess);
    if (isWithdrawYieldSuccess) {
      console.log('Withdraw yield success detected, refetching data...');
      setIsWithdrawYieldPending(false);
      refetchAllData();
    }
  }, [isWithdrawYieldSuccess, refetchAllData]);

  return {
    principalBalance,
    yieldBalance,
    totalBalance,
    totalPrincipal,
    totalYield,
    ethPrice,
    minDeposit,
    maxDeposit,
    deposit,
    withdrawPrincipal,
    withdrawYield,
    refetchAllData,
    isLoading,
    isDepositLoading,
    isWithdrawPrincipalLoading,
    isWithdrawYieldLoading,
    isDepositWriting,
    isDepositConfirming,
    isWithdrawPrincipalWriting,
    isWithdrawPrincipalConfirming,
    isWithdrawYieldWriting,
    isWithdrawYieldConfirming,
    isDepositSuccess,
    isWithdrawPrincipalSuccess,
    isWithdrawYieldSuccess,
    depositTx,
    withdrawPrincipalTx,
    withdrawYieldTx,
  };
};
