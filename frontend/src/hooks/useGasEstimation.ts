import { useAccount, usePublicClient } from 'wagmi';
import { useContract } from './useContract';
import { parseEther, formatEther } from 'ethers';
import { useState, useCallback } from 'react';

export const useGasEstimation = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { safeVaultContract } = useContract();
  
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationError, setEstimationError] = useState<string | null>(null);

  const estimateDepositGas = useCallback(async (amount: bigint): Promise<bigint | null> => {
    if (!safeVaultContract?.address || !publicClient || !address) {
      console.log('Cannot estimate gas: missing contract, client, or address');
      return null;
    }

    setIsEstimating(true);
    setEstimationError(null);

    try {
      console.log('⛽ Estimating gas for deposit...');
      console.log('  - Amount:', formatEther(amount), 'ETH');
      console.log('  - Contract:', safeVaultContract.address);
      console.log('  - User:', address);

      // Estimate gas for the deposit function
      const gasEstimate = await publicClient.estimateContractGas({
        address: safeVaultContract.address as `0x${string}`,
        abi: safeVaultContract.abi,
        functionName: 'deposit',
        args: [] as const,
        value: amount,
        account: address as `0x${string}`,
      });

      console.log('✅ Gas estimate successful:', gasEstimate.toString());
      return gasEstimate;

    } catch (error: any) {
      console.error('❌ Gas estimation failed:', error);
      setEstimationError(error.message || 'Failed to estimate gas');
      return null;
    } finally {
      setIsEstimating(false);
    }
  }, [safeVaultContract, publicClient, address]);

  const estimateWithdrawGas = useCallback(async (amount: bigint): Promise<bigint | null> => {
    if (!safeVaultContract?.address || !publicClient || !address) {
      console.log('Cannot estimate gas: missing contract, client, or address');
      return null;
    }

    setIsEstimating(true);
    setEstimationError(null);

    try {
      console.log('⛽ Estimating gas for withdrawal...');
      console.log('  - Amount:', formatEther(amount), 'ETH');
      console.log('  - Contract:', safeVaultContract.address);
      console.log('  - User:', address);

      // Estimate gas for the withdrawTotal function
      const gasEstimate = await publicClient.estimateContractGas({
        address: safeVaultContract.address as `0x${string}`,
        abi: safeVaultContract.abi,
        functionName: 'withdrawTotal',
        args: [amount],
        account: address as `0x${string}`,
      });

      console.log('✅ Gas estimate successful:', gasEstimate.toString());
      return gasEstimate;

    } catch (error: any) {
      console.error('❌ Gas estimation failed:', error);
      setEstimationError(error.message || 'Failed to estimate gas');
      return null;
    } finally {
      setIsEstimating(false);
    }
  }, [safeVaultContract, publicClient, address]);

  const calculateMaxDepositAmount = useCallback(async (walletBalance: bigint): Promise<bigint> => {
    if (!publicClient || !address) {
      console.log('Cannot calculate max deposit: missing client or address');
      return 0n;
    }

    try {
      console.log('🔍 Calculating max deposit amount...');
      console.log('  - Wallet balance:', formatEther(walletBalance), 'ETH');

      // For now, use a simple conservative approach since gas estimation might be complex
      // Use a fixed buffer that should be sufficient for most transactions
      const baseBuffer = parseEther('0.01'); // 0.01 ETH buffer
      const maxDepositAmount = walletBalance - baseBuffer;
      
      console.log('  - Base buffer:', formatEther(baseBuffer), 'ETH');
      console.log('  - Max deposit amount:', formatEther(maxDepositAmount), 'ETH');

      // Ensure we don't return a negative amount
      if (maxDepositAmount <= 0n) {
        console.log('⚠️ Max deposit amount would be negative, returning 0');
        return 0n;
      }

      return maxDepositAmount;

    } catch (error: any) {
      console.error('❌ Failed to calculate max deposit amount:', error);
      // Fallback to a conservative buffer
      const fallbackBuffer = parseEther('0.01');
      return walletBalance > fallbackBuffer ? walletBalance - fallbackBuffer : 0n;
    }
  }, [publicClient, address]);

  const calculateMaxWithdrawAmount = useCallback(async (totalBalance: bigint): Promise<bigint> => {
    if (!publicClient || !address) {
      console.log('Cannot calculate max withdraw: missing client or address');
      return 0n;
    }

    try {
      console.log('🔍 Calculating max withdraw amount...');
      console.log('  - Total balance:', formatEther(totalBalance), 'ETH');

      // Use a simple conservative approach
      const baseBuffer = parseEther('0.01'); // 0.01 ETH buffer
      const maxWithdrawAmount = totalBalance - baseBuffer;
      
      console.log('  - Base buffer:', formatEther(baseBuffer), 'ETH');
      console.log('  - Max withdraw amount:', formatEther(maxWithdrawAmount), 'ETH');

      // Ensure we don't return a negative amount
      if (maxWithdrawAmount <= 0n) {
        console.log('⚠️ Max withdraw amount would be negative, returning 0');
        return 0n;
      }

      return maxWithdrawAmount;

    } catch (error: any) {
      console.error('❌ Failed to calculate max withdraw amount:', error);
      // Fallback to a conservative buffer
      const fallbackBuffer = parseEther('0.01');
      return totalBalance > fallbackBuffer ? totalBalance - fallbackBuffer : 0n;
    }
  }, [publicClient, address]);

  return {
    estimateDepositGas,
    estimateWithdrawGas,
    calculateMaxDepositAmount,
    calculateMaxWithdrawAmount,
    isEstimating,
    estimationError,
  };
};
