import { useAccount, useContractRead, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useContract } from './useContract';
import { parseEther, formatEther } from 'ethers';
import { useState, useEffect, useCallback } from 'react';

export const useSafeVault = () => {
  const { address } = useAccount();
  const { safeVaultContract, mockLidoContract } = useContract();
  
  // Loading states
  const [isDepositPending, setIsDepositPending] = useState(false);
  const [isWithdrawTotalPending, setIsWithdrawTotalPending] = useState(false);

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

  // Calculate total balance as principal + yield (since getUserTotalBalance doesn't exist in contract)
  const totalBalance = (principalBalance as bigint) + (yieldBalance as bigint);

  // Get the actual withdrawable balance from the contract (same calculation as withdrawTotal uses)
  const { data: actualWithdrawableBalance = 0n, refetch: refetchActualBalance } = useContractRead({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getUserActualWithdrawableBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false,
      staleTime: 0,
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

  const { data: minWithdraw = parseEther('0.001') } = useContractRead({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'minWithdraw',
  });

  // Gas estimation states (removed for now due to viem compatibility issues)
  // const [estimatedGasForWithdrawal, setEstimatedGasForWithdrawal] = useState<bigint | null>(null);
  // const [gasEstimationError, setGasEstimationError] = useState<string | null>(null);
  
  // Transaction error state for user feedback
  const [transactionError, setTransactionError] = useState<string | null>(null);
  
  // Function to clear transaction error
  const clearTransactionError = useCallback(() => {
    setTransactionError(null);
  }, []);

  // Write functions
  const { writeContract, data: depositTx, isPending: isDepositWriting } = useWriteContract();
  const { writeContract: writeWithdrawTotal, data: withdrawTotalTx, isPending: isWithdrawTotalWriting } = useWriteContract();
  
  

  // Wait for transactions
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess, data: depositReceipt, error: depositError } = useWaitForTransactionReceipt({
    hash: depositTx,
    timeout: 60000, // 60 second timeout
  });

  const { isLoading: isWithdrawTotalConfirming, isSuccess: isWithdrawTotalSuccess, data: withdrawTotalReceipt, error: withdrawTotalError } = useWaitForTransactionReceipt({
    hash: withdrawTotalTx,
    timeout: 60000, // 60 second timeout
  });



  // Combined loading states
  const isDepositLoading = isDepositPending || isDepositWriting || isDepositConfirming;
  const isWithdrawTotalLoading = isWithdrawTotalPending || isWithdrawTotalWriting || isWithdrawTotalConfirming;
  const isLoading = isDepositLoading || isWithdrawTotalLoading;

  // Function to refetch all data
  const refetchAllData = useCallback(async () => {
    if (!safeVaultContract?.address || !address) {
      console.log('Cannot refetch: missing contract address or user address');
      return;
    }
    
    console.log('🔄 Refetching all data...');
    console.log('Contract address:', safeVaultContract.address);
    console.log('User address:', address);
    console.log('Current balances before refetch:');
    console.log('  - Principal:', formatEther(principalBalance as bigint), 'ETH');
    console.log('  - Yield:', formatEther(yieldBalance as bigint), 'ETH');
    console.log('  - Total:', formatEther(totalBalance), 'ETH');
    
    try {
      const results = await Promise.all([
        refetchPrincipalBalance(),
        refetchYieldBalance(),
        refetchActualBalance(),
        refetchTotalPrincipal(),
        refetchTotalYield(),
      ]);
      
      console.log('📊 Refetch results:');
      console.log('  - Principal:', results[0]?.data ? formatEther(results[0].data as bigint) : 'undefined', 'ETH');
      console.log('  - Yield:', results[1]?.data ? formatEther(results[1].data as bigint) : 'undefined', 'ETH');
      console.log('  - Total:', results[2]?.data ? formatEther(results[2].data as bigint) : 'undefined', 'ETH');
      console.log('  - Actual Withdrawable:', results[3]?.data ? formatEther(results[3].data as bigint) : 'undefined', 'ETH');
      
      // Check if balances actually changed
      const newPrincipal = results[0]?.data;
      const newYield = results[1]?.data;
      const newTotal = results[2]?.data;
      
      if (newPrincipal !== undefined && newPrincipal !== principalBalance) {
        console.log('✅ Principal balance updated:', formatEther(newPrincipal as bigint), 'ETH');
      }
      if (newYield !== undefined && newYield !== yieldBalance) {
        console.log('✅ Yield balance updated:', formatEther(newYield as bigint), 'ETH');
      }
      if (newTotal !== undefined && newTotal !== totalBalance) {
        console.log('✅ Total balance updated:', formatEther(newTotal as bigint), 'ETH');
      }
      
      if (newPrincipal === principalBalance && newYield === yieldBalance && newTotal === totalBalance) {
        console.log('⚠️ No balance changes detected - balances may not have updated yet');
      }
      
    } catch (error) {
      console.error('❌ Error during refetch:', error);
    }
  }, [refetchPrincipalBalance, refetchYieldBalance, refetchActualBalance, refetchTotalPrincipal, refetchTotalYield, safeVaultContract?.address, address, principalBalance, yieldBalance, totalBalance]);

  // Manual refetch only - no automatic intervals

  const deposit = async (amount: bigint) => {
    let transactionSubmitted = false;
    
    try {
      setIsDepositPending(true);
      setTransactionError(null); // Clear any previous error
      
      console.log('🔍 Deposit Debug:');
      console.log(`  - Input amount: ${formatEther(amount)} ETH`);
      console.log(`  - Amount in wei: ${amount.toString()}`);
      
      // Gas limits to try in order (from lowest to highest)
      const gasLimits = [
        300000n,  // Minimum for simple deposits
        500000n,  // Standard deposit
        750000n,  // Higher for complex operations
        1000000n, // Maximum for very complex scenarios
        1500000n  // Emergency fallback
      ];
      
      let lastError: any = null;
      
      // Try each gas limit until one works
      for (let i = 0; i < gasLimits.length; i++) {
        const gasLimit = gasLimits[i];
        
        try {
          console.log(`⛽ Attempt ${i + 1}/${gasLimits.length}: Using gas limit ${gasLimit.toString()}`);
          
          await writeContract({
            address: safeVaultContract?.address as `0x${string}`,
            abi: safeVaultContract?.abi,
            functionName: 'deposit',
            value: amount,
            gas: gasLimit,
          });
          
          console.log(`✅ Transaction submitted successfully with gas limit ${gasLimit.toString()}`);
          transactionSubmitted = true;
          return; // Success! Exit the function
          
        } catch (error: any) {
          lastError = error;
          console.log(`❌ Attempt ${i + 1} failed with gas limit ${gasLimit.toString()}`);
          console.log(`🔍 Full error object:`, error);
          console.log(`🔍 Error message:`, error?.message);
          console.log(`🔍 Error code:`, error?.code);
          console.log(`🔍 Error details:`, error?.details);
          
          // Check if it's a gas-related error or insufficient funds error
          const errorMessage = error?.message?.toLowerCase() || '';
          const errorCode = error?.code?.toString() || '';
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const errorDetails = error?.details?.toLowerCase() || '';
          
          const isGasError = errorMessage.includes('gas') || 
                            errorMessage.includes('out of gas') ||
                            errorMessage.includes('gas limit') ||
                            errorMessage.includes('intrinsic gas') ||
                            errorCode.includes('UNPREDICTABLE_GAS_LIMIT') ||
                            errorCode.includes('GAS_LIMIT_EXCEEDED');
          
          const isInsufficientFundsError = errorMessage.includes('insufficient funds') ||
                                          errorMessage.includes('insufficient balance') ||
                                          errorMessage.includes('not enough') ||
                                          errorMessage.includes('funds for gas') ||
                                          errorMessage.includes('insufficient') ||
                                          errorCode.includes('INSUFFICIENT_FUNDS') ||
                                          errorCode.includes('INSUFFICIENT_BALANCE');
          
          console.log(`🔍 Error analysis:`);
          console.log(`  - Is gas error: ${isGasError}`);
          console.log(`  - Is insufficient funds error: ${isInsufficientFundsError}`);
          console.log(`  - Attempts left: ${gasLimits.length - i - 1}`);
          
          // If it's an insufficient funds error, don't retry - the user needs more ETH
          if (isInsufficientFundsError) {
            console.log(`💰 Insufficient funds error detected - user needs more ETH for gas`);
            setIsDepositPending(false); // Reset our pending state immediately
            throw error; // Don't retry, user needs more ETH
          }
          
          // If it's a gas limit error and we have more limits to try
          if (isGasError && i < gasLimits.length - 1) {
            console.log(`🔄 Gas limit insufficient, trying higher limit...`);
            continue; // Try next gas limit
          } else {
            // If it's not a gas error or we've tried all limits, throw the error
            console.log(`🚫 No more retries available or not a gas error`);
            setIsDepositPending(false); // Reset our pending state immediately
            throw error;
          }
        }
      }
      
      // If we get here, all attempts failed
      setIsDepositPending(false); // Reset our pending state
      throw lastError;
      
    } catch (error) {
      // Ensure pending state is always reset on any error
      if (!transactionSubmitted) {
        setIsDepositPending(false);
      }
      throw error;
    }
  };

  // Function to debug MockLido state (simplified for now)
  const debugMockLidoState = useCallback(async () => {
    if (!mockLidoContract?.address || !safeVaultContract?.address) return;
    
    try {
      console.log('🔍 MockLido State Debug:');
      console.log(`  - MockLido address: ${mockLidoContract.address}`);
      console.log(`  - SafeVault address: ${safeVaultContract.address}`);
      console.log('  - Note: Detailed MockLido state debugging will be added in next iteration');
      
    } catch (error) {
      console.error('❌ Error debugging MockLido state:', error);
    }
  }, [mockLidoContract, safeVaultContract?.address]);

  // Function to estimate gas for withdrawal with fallback strategy
  const estimateWithdrawalGas = useCallback(async (amount: bigint): Promise<bigint> => {
    console.log('⛽ Estimating gas for withdrawal amount:', formatEther(amount), 'ETH');
    
    // Try multiple gas limits as fallbacks
    const gasLimits = [
      300000n,  // Minimum for simple withdrawals
      500000n,  // Standard withdrawal
      750000n,  // Higher for complex operations
      1000000n, // Maximum for very complex scenarios
      1500000n  // Emergency fallback
    ];
    
    // For now, return the standard gas limit with a note about fallbacks
    const selectedGas = gasLimits[1]; // 500,000
    console.log('⛽ Using gas limit:', selectedGas.toString());
    console.log('💡 If transaction fails due to insufficient gas, the system will automatically retry with higher limits');
    
    return selectedGas;
  }, []);

  const withdrawTotal = async (amount: bigint) => {
    let transactionSubmitted = false;
    
    try {
      setIsWithdrawTotalPending(true);
      setTransactionError(null); // Clear any previous error
      
      console.log('🔍 Withdraw Total Debug:');
      console.log(`  - Input amount: ${formatEther(amount)} ETH`);
      console.log(`  - Amount in wei: ${amount.toString()}`);
      
      // Get fresh balance data right before transaction
      console.log('🔍 Getting fresh balance data before transaction...');
      const freshBalanceData = await Promise.all([
        refetchPrincipalBalance(),
        refetchYieldBalance(),
        refetchActualBalance(),
      ]);
      
      const freshPrincipalBalance = freshBalanceData[0]?.data as bigint;
      const freshYieldBalance = freshBalanceData[1]?.data as bigint;
      const freshActualBalance = freshBalanceData[2]?.data as bigint;
      const freshTotalBalance = (freshPrincipalBalance || 0n) + (freshYieldBalance || 0n);
      
      console.log('🔍 Fresh Balance Data:');
      console.log(`  - Fresh total balance: ${formatEther(freshTotalBalance)} ETH`);
      console.log(`  - Fresh actual balance: ${formatEther(freshActualBalance)} ETH`);
      console.log(`  - Balance difference: ${formatEther(freshTotalBalance - freshActualBalance)} ETH`);
      
      // Validate amount against fresh data
      if (amount > freshActualBalance) {
        throw new Error(`Insufficient balance. Available: ${formatEther(freshActualBalance)} ETH, Requested: ${formatEther(amount)} ETH`);
      }
      
      // Debug MockLido state before transaction
      await debugMockLidoState();
      
      // Gas limits to try in order (from lowest to highest)
      const gasLimits = [
        300000n,  // Minimum for simple withdrawals
        500000n,  // Standard withdrawal
        750000n,  // Higher for complex operations
        1000000n, // Maximum for very complex scenarios
        1500000n  // Emergency fallback
      ];
      
      let lastError: any = null;
      
      // Try each gas limit until one works
      for (let i = 0; i < gasLimits.length; i++) {
        const gasLimit = gasLimits[i];
        
        try {
          console.log(`⛽ Attempt ${i + 1}/${gasLimits.length}: Using gas limit ${gasLimit.toString()}`);
          
          await writeWithdrawTotal({
            address: safeVaultContract?.address as `0x${string}`,
            abi: safeVaultContract?.abi,
            functionName: 'withdrawTotal',
            args: [amount],
            gas: gasLimit,
          });
          
          console.log(`✅ Transaction submitted successfully with gas limit ${gasLimit.toString()}`);
          transactionSubmitted = true;
          return; // Success! Exit the function
          
        } catch (error: any) {
          lastError = error;
          console.log(`❌ Attempt ${i + 1} failed with gas limit ${gasLimit.toString()}`);
          console.log(`🔍 Full error object:`, error);
          console.log(`🔍 Error message:`, error?.message);
          console.log(`🔍 Error code:`, error?.code);
          console.log(`🔍 Error details:`, error?.details);
          
          // Check if it's a gas-related error or insufficient funds error
          const errorMessage = error?.message?.toLowerCase() || '';
          const errorCode = error?.code?.toString() || '';
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const errorDetails = error?.details?.toLowerCase() || '';
          
          const isGasError = errorMessage.includes('gas') || 
                            errorMessage.includes('out of gas') ||
                            errorMessage.includes('gas limit') ||
                            errorMessage.includes('intrinsic gas') ||
                            errorCode.includes('UNPREDICTABLE_GAS_LIMIT') ||
                            errorCode.includes('GAS_LIMIT_EXCEEDED');
          
          const isInsufficientFundsError = errorMessage.includes('insufficient funds') ||
                                          errorMessage.includes('insufficient balance') ||
                                          errorMessage.includes('not enough') ||
                                          errorMessage.includes('funds for gas') ||
                                          errorMessage.includes('insufficient') ||
                                          errorCode.includes('INSUFFICIENT_FUNDS') ||
                                          errorCode.includes('INSUFFICIENT_BALANCE');
          
          console.log(`🔍 Error analysis:`);
          console.log(`  - Is gas error: ${isGasError}`);
          console.log(`  - Is insufficient funds error: ${isInsufficientFundsError}`);
          console.log(`  - Attempts left: ${gasLimits.length - i - 1}`);
          
          // If it's an insufficient funds error, don't retry - the user needs more ETH
          if (isInsufficientFundsError) {
            console.log(`💰 Insufficient funds error detected - user needs more ETH for gas`);
            setIsWithdrawTotalPending(false); // Reset our pending state immediately
            throw error; // Don't retry, user needs more ETH
          }
          
          // If it's a gas limit error and we have more limits to try
          if (isGasError && i < gasLimits.length - 1) {
            console.log(`🔄 Gas limit insufficient, trying higher limit...`);
            continue; // Try next gas limit
          } else {
            // If it's not a gas error or we've tried all limits, throw the error
            console.log(`🚫 No more retries available or not a gas error`);
            setIsWithdrawTotalPending(false); // Reset our pending state immediately
            throw error;
          }
        }
      }
      
      // If we get here, all attempts failed
      setIsWithdrawTotalPending(false); // Reset our pending state
      throw lastError;
      
    } catch (error) {
      // Ensure pending state is always reset on any error
      if (!transactionSubmitted) {
        setIsWithdrawTotalPending(false);
      }
      throw error;
    }
  };

  // Reset pending states and refetch data when transactions complete
  useEffect(() => {
    console.log('🔍 Deposit transaction tracking:');
    console.log('  - Deposit success state:', isDepositSuccess);
    console.log('  - Deposit confirming:', isDepositConfirming);
    console.log('  - Deposit receipt:', depositReceipt);
    console.log('  - Deposit error:', depositError);
    console.log('  - Deposit tx hash:', depositTx);
    
    if (isDepositSuccess && depositReceipt) {
      console.log('✅ Deposit success detected, refetching data...');
      setIsDepositPending(false);
      
      // Try immediate refetch first
      refetchAllData();
      
      // Also try refetch after delay as backup
      setTimeout(() => {
        refetchAllData();
      }, 2000);
    }
    
    if (depositError) {
      console.log('❌ Deposit confirmation error:', depositError);
      console.log('🔍 Error type:', depositError?.name);
      console.log('🔍 Error message:', depositError?.message);
      // @ts-ignore - details might exist on some error types
      console.log('🔍 Error details:', depositError?.details);
      
      // Set user-friendly error message
      const errorMessage = depositError?.message || 'Transaction failed';
      if (errorMessage.includes('custom error') || errorMessage.includes('execution reverted')) {
        setTransactionError('Transaction failed due to a smart contract error. This might be due to insufficient balance or a contract restriction. Try depositing a smaller amount.');
      } else {
        setTransactionError(`Transaction failed: ${errorMessage}`);
      }
      
      // Reset loading state for any confirmation error
      setIsDepositPending(false);
    }
  }, [isDepositSuccess, isDepositConfirming, depositReceipt, depositError, depositTx, refetchAllData]);

  useEffect(() => {
    console.log('🔍 Withdraw transaction tracking:');
    console.log('  - Withdraw success state:', isWithdrawTotalSuccess);
    console.log('  - Withdraw confirming:', isWithdrawTotalConfirming);
    console.log('  - Withdraw receipt:', withdrawTotalReceipt);
    console.log('  - Withdraw error:', withdrawTotalError);
    console.log('  - Withdraw tx hash:', withdrawTotalTx);
    
    if (isWithdrawTotalSuccess && withdrawTotalReceipt) {
      console.log('✅ Withdraw total success detected, refetching data...');
      setIsWithdrawTotalPending(false);
      
      // Try immediate refetch first
      refetchAllData();
      
      // Also try refetch after delay as backup
      setTimeout(() => {
        refetchAllData();
      }, 2000);
    }
    
    if (withdrawTotalError) {
      console.log('❌ Withdraw confirmation error:', withdrawTotalError);
      console.log('🔍 Error type:', withdrawTotalError?.name);
      console.log('🔍 Error message:', withdrawTotalError?.message);
      // @ts-ignore - details might exist on some error types
      console.log('🔍 Error details:', withdrawTotalError?.details);
      
      // Set user-friendly error message
      const errorMessage = withdrawTotalError?.message || 'Transaction failed';
      if (errorMessage.includes('custom error') || errorMessage.includes('execution reverted')) {
        setTransactionError('Transaction failed due to a smart contract error. This might be due to insufficient balance in the vault or a contract restriction. Try withdrawing a smaller amount.');
      } else {
        setTransactionError(`Transaction failed: ${errorMessage}`);
      }
      
      // Reset loading state for any confirmation error
      setIsWithdrawTotalPending(false);
    }
  }, [isWithdrawTotalSuccess, isWithdrawTotalConfirming, withdrawTotalReceipt, withdrawTotalError, withdrawTotalTx, refetchAllData]);

  // Add a manual timeout to reset loading state if transaction confirmation takes too long
  useEffect(() => {
    if (withdrawTotalTx && isWithdrawTotalPending) {
      console.log('⏰ Setting 30-second timeout for withdraw transaction confirmation...');
      const timeout = setTimeout(() => {
        console.log('⏰ Withdraw transaction confirmation timeout - forcing loading state reset');
        setIsWithdrawTotalPending(false);
      }, 30000); // 30 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [withdrawTotalTx, isWithdrawTotalPending]);

  useEffect(() => {
    if (depositTx && isDepositPending) {
      console.log('⏰ Setting 30-second timeout for deposit transaction confirmation...');
      const timeout = setTimeout(() => {
        console.log('⏰ Deposit transaction confirmation timeout - forcing loading state reset');
        setIsDepositPending(false);
      }, 30000); // 30 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [depositTx, isDepositPending]);

  return {
    principalBalance,
    yieldBalance,
    totalBalance,
    actualWithdrawableBalance,
    totalPrincipal,
    totalYield,
    ethPrice,
    minDeposit,
    maxDeposit,
    minWithdraw,
    deposit,
    withdrawTotal,
    estimateWithdrawalGas,
    refetchAllData,
    isLoading,
    isDepositLoading,
    isWithdrawTotalLoading,
    isDepositWriting,
    isDepositConfirming,
    isWithdrawTotalWriting,
    isWithdrawTotalConfirming,
    isDepositSuccess,
    isWithdrawTotalSuccess,
    depositTx,
    withdrawTotalTx,
    // estimatedGasForWithdrawal, // Removed due to viem compatibility issues
    // gasEstimationError, // Removed due to viem compatibility issues
    transactionError,
    clearTransactionError,
  };
};
