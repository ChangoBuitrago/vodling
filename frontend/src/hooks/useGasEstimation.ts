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
    if (!publicClient || !address || !safeVaultContract?.address) {
      console.log('Cannot calculate max deposit: missing client, address, or contract');
      return 0n;
    }

    try {
      console.log('🔍 Calculating max deposit amount...');
      console.log('  - Wallet balance:', formatEther(walletBalance), 'ETH');

      if (walletBalance === 0n) {
        return 0n;
      }

      // Create a realistic amount for gas estimation (99% of balance)
      // This ensures the gas estimation runs on a transaction that is theoretically valid
      const reasonableAmount = (walletBalance * 99n) / 100n;
      
      console.log('  - Reasonable amount for gas estimation:', formatEther(reasonableAmount), 'ETH');

      // Estimate gas on this more realistic amount
      const gasLimit = await publicClient.estimateContractGas({
        address: safeVaultContract.address as `0x${string}`,
        abi: safeVaultContract.abi,
        functionName: 'deposit',
        args: [] as const,
        value: reasonableAmount,
        account: address as `0x${string}`,
      });

      // Get current gas price and add a safety buffer for EIP-1559 transactions
      // Note: For even more precise EIP-1559 estimation, we could use provider.getFeeData()
      // which returns maxFeePerGas and maxPriorityFeePerGas directly, but applying buffers
      // on top of getGasPrice() is still a robust approach for maximum reliability
      const gasPrice = await publicClient.getGasPrice();
      
      // Add 20% buffer to account for EIP-1559 priority fees and gas price fluctuations
      // Using BigInt math (120n, 100n) to avoid floating-point precision errors
      const gasPriceBuffer = 120n; // 20% buffer
      const adjustedGasPrice = (gasPrice * gasPriceBuffer) / 100n;
      
      // Add 10% buffer to gas limit to account for estimation inaccuracies
      // Using BigInt math (110n, 100n) to avoid floating-point precision errors
      const gasLimitBuffer = 110n; // 10% buffer
      const adjustedGasLimit = (gasLimit * gasLimitBuffer) / 100n;
      
      const estimatedGasFee = adjustedGasLimit * adjustedGasPrice;
      
      console.log('  - Original gas limit:', gasLimit.toString());
      console.log('  - Adjusted gas limit (with 10% buffer):', adjustedGasLimit.toString());
      console.log('  - Base gas price:', gasPrice.toString());
      console.log('  - Adjusted gas price (with 20% buffer):', adjustedGasPrice.toString());
      console.log('  - Estimated gas fee:', formatEther(estimatedGasFee), 'ETH');

      // Calculate the max deposit amount from the actual full balance
      const maxDepositAmount = walletBalance - estimatedGasFee;
      
      console.log('  - Max deposit amount (after gas):', formatEther(maxDepositAmount), 'ETH');

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
  }, [publicClient, address, safeVaultContract]);

  const calculateMaxWithdrawAmount = useCallback(async (totalBalance: bigint): Promise<bigint> => {
    try {
      console.log('🔍 Calculating max withdraw amount...');
      console.log('  - Total withdrawable balance:', formatEther(totalBalance), 'ETH');

      // For withdrawals, the gas fee is paid from the user's wallet balance,
      // NOT from the funds being withdrawn from the contract.
      // Therefore, the MAX withdraw amount should be the full withdrawable balance.
      const maxWithdrawAmount = totalBalance;
      
      console.log('  - Max withdraw amount (full balance):', formatEther(maxWithdrawAmount), 'ETH');

      // Ensure we don't return a negative amount
      if (maxWithdrawAmount <= 0n) {
        console.log('⚠️ Max withdraw amount would be negative, returning 0');
        return 0n;
      }

      return maxWithdrawAmount;

    } catch (error: any) {
      console.error('❌ Failed to calculate max withdraw amount:', error);
      // Fallback to the full balance
      return totalBalance;
    }
  }, []);

  return {
    estimateDepositGas,
    estimateWithdrawGas,
    calculateMaxDepositAmount,
    calculateMaxWithdrawAmount,
    isEstimating,
    estimationError,
  };
};
