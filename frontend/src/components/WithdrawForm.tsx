import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { useGasEstimation } from '../hooks/useGasEstimation';
import { parseEther, formatEther } from 'ethers';
import TransactionLoader from './TransactionLoader';
import { useFadeIn, useGlowEffect } from '../hooks/useAnimations';

const WithdrawForm: React.FC = () => {
  const { isConnected } = useAccount();
  const { 
    withdrawTotal, 
    estimateWithdrawalGas,
    totalBalance,
    actualWithdrawableBalance, 
    isWithdrawTotalLoading,
    isWithdrawTotalWriting,
    isWithdrawTotalConfirming,
    isWithdrawTotalSuccess,
    withdrawTotalTx,
    transactionError,
    clearTransactionError
    // estimatedGasForWithdrawal, // Removed due to viem compatibility issues
    // gasEstimationError // Removed due to viem compatibility issues
  } = useSafeVault();
  
  const { calculateMaxWithdrawAmount, isEstimating: isEstimatingGas } = useGasEstimation();
  
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  
  const fadeInRef = useFadeIn(0.4);
  const glowRef = useGlowEffect('#8B5CF6');

  const handleWithdraw = async () => {
    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    try {
      const amountWei = parseEther(amount);
      const balance = totalBalance as bigint;
      
      console.log('🔍 Withdraw Total Debug:');
      console.log('  - Input amount:', amount);
      console.log('  - Parsed amount (wei):', amountWei.toString());
      console.log('  - Parsed amount (ETH):', formatEther(amountWei));
      console.log('  - Current balance (wei):', balance.toString());
      console.log('  - Current balance (ETH):', formatEther(balance));
      console.log('  - Amount > Balance?', amountWei > balance);
      console.log('  - Remaining for gas (ETH):', formatEther(balance - amountWei));
      
      if (amountWei > balance) {
        setError('Insufficient total balance');
        return;
      }

      setError('');
      
      // Estimate gas first to provide user feedback (simplified)
      try {
        console.log('⛽ Getting gas estimate for withdrawal...');
        await estimateWithdrawalGas(amountWei);
        console.log('✅ Gas estimate completed');
      } catch (gasError) {
        console.warn('⚠️ Gas estimation failed, proceeding with fallback strategy:', gasError);
        // Continue with withdrawal using progressive gas limits
      }
      
      console.log('🚀 Proceeding with withdrawal...');
      await withdrawTotal(amountWei);
      setAmount('');
    } catch (err: any) {
      console.error('Withdraw total error:', err);
      
      // Handle specific errors with better messaging
      let userMessage = 'Withdrawal failed. Please try again.';
      
      if (err.message && err.message.includes('Insufficient funds for gas')) {
        userMessage = 'Insufficient ETH for gas fees. The MAX button will calculate the optimal amount. Try using it or withdraw a smaller amount.';
      } else if (err.message && err.message.includes('insufficient funds')) {
        userMessage = 'Insufficient funds for gas fees. Try using the MAX button to calculate the optimal withdrawal amount.';
      } else if (err.message && (err.message.includes('gas') || err.message.includes('out of gas'))) {
        userMessage = 'Transaction failed due to gas issues. The system tried multiple gas limits but couldn\'t complete the transaction. Please try again.';
      } else if (err.message && err.message.includes('custom error')) {
        userMessage = 'Transaction failed due to a smart contract error. This might be due to insufficient balance in the vault or a contract restriction. Try a smaller amount.';
      } else if (err.message && err.message.includes('execution reverted')) {
        userMessage = 'Transaction failed due to a smart contract error. This might be due to insufficient balance in the vault or a contract restriction. Try a smaller amount.';
      } else if (err.message && err.message.includes('user rejected')) {
        userMessage = 'Transaction was cancelled by user.';
      } else if (err.message && err.message.includes('network')) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message) {
        userMessage = `Transaction failed: ${err.message}`;
      }
      
      setError(userMessage);
      
      // Note: The loading state will be reset by the withdrawTotal function in the hook
      // If the error occurs here, the loading state should already be reset
    }
  };

  const handleMaxClick = async () => {
    const actualBalanceWei = actualWithdrawableBalance as bigint;
    
    if (!actualBalanceWei || actualBalanceWei === 0n) {
      setError('No balance available for withdrawal');
      return;
    }

    try {
      console.log('🔍 MAX Button - Calculating optimal withdrawal amount...');
      console.log(`  - Total balance: ${formatEther(totalBalance as bigint)} ETH`);
      console.log(`  - Actual withdrawable: ${formatEther(actualBalanceWei)} ETH`);
      
      // Use the new gas estimation to calculate the exact maximum amount
      const maxWithdrawAmount = await calculateMaxWithdrawAmount(actualBalanceWei);
      
      console.log(`  - Max withdraw amount (after gas): ${formatEther(maxWithdrawAmount)} ETH`);
      
      if (maxWithdrawAmount > 0n) {
        setAmount(formatEther(maxWithdrawAmount));
        setError(''); // Clear any previous errors
      } else {
        setAmount('');
        setError('Insufficient balance for gas fees. You need more ETH to cover transaction costs.');
      }
    } catch (error: any) {
      console.error('❌ Error calculating max withdraw amount:', error);
      setError('Failed to calculate maximum withdrawal amount. Please try a smaller amount.');
    }
  };

  // Handle success states and auto-return to normal form
  React.useEffect(() => {
    if (isWithdrawTotalSuccess) {
      setAmount('');
      setError('');
      setShowSuccess(true);
      
      // Return to normal form after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isWithdrawTotalSuccess]);

  if (!isConnected) {
    return null;
  }

  // Show transaction loader for withdrawal
  if (isWithdrawTotalLoading) {
    return (
      <TransactionLoader
        isWriting={isWithdrawTotalWriting}
        isConfirming={isWithdrawTotalConfirming}
        isSuccess={isWithdrawTotalSuccess}
        error={error}
        transactionHash={withdrawTotalTx}
        type="withdrawTotal"
      />
    );
  }

  // Show success message for withdrawal
  if (isWithdrawTotalSuccess && showSuccess) {
    return (
      <div className="glass-effect p-8 text-center fade-in">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-vodl-500 to-vodl-600 mb-6">
          <i className="fas fa-check text-2xl text-white"></i>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Withdrawal Successful!</h3>
        <p className="text-gray-400 mb-6">
          Your funds have been successfully withdrawn to your wallet.
        </p>
        {withdrawTotalTx && (
          <p className="text-xs text-gray-500 font-mono break-all bg-white/5 p-3 rounded-lg">
            Transaction: {withdrawTotalTx}
          </p>
        )}
        <p className="text-sm text-gray-400 mt-4">
          Your balance will be updated shortly...
        </p>
      </div>
    );
  }

  return (
    <div ref={fadeInRef} className="glass-effect p-6">
      <div className="flex items-center mb-6">
        <div ref={glowRef} className="strategy-icon icon-bg-purple">
          <i className="fas fa-arrow-up icon-text-purple text-xl"></i>
        </div>
        <h3 className="text-xl font-bold text-white ml-4">Withdraw Funds</h3>
      </div>

      <div className="space-y-6">
        {/* Withdraw Amount Input */}
        <div>
          <label htmlFor="withdraw-amount" className="block text-sm font-medium text-gray-300 mb-3">
            Amount to withdraw (ETH)
          </label>
          <div className="relative">
            <input
              type="number"
              id="withdraw-amount"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
                clearTransactionError(); // Clear transaction error when user changes amount
              }}
              placeholder="0.0"
              step="0.001"
              max={(() => {
                const actualBalanceWei = actualWithdrawableBalance as bigint;
                const baseBuffer = parseEther('0.15');
                const largeTransactionSize = parseEther('1000');
                const veryLargeTransactionSize = parseEther('5000');
                const extremelyLargeTransactionSize = parseEther('8000');
                let bufferAmount = baseBuffer;
                if (actualBalanceWei > extremelyLargeTransactionSize) {
                  const percentageBuffer = actualBalanceWei / 50n;
                  const minBuffer = parseEther('2');
                  bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
                } else if (actualBalanceWei > veryLargeTransactionSize) {
                  const percentageBuffer = actualBalanceWei / 100n;
                  const minBuffer = parseEther('1');
                  bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
                } else if (actualBalanceWei > largeTransactionSize) {
                  const percentageBuffer = actualBalanceWei / 200n;
                  const minBuffer = parseEther('0.5');
                  bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
                }
                return parseFloat(formatEther(actualBalanceWei - bufferAmount));
              })()}
              className="form-input w-full px-4 py-3 pr-20 text-lg"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <button
                type="button"
                onClick={handleMaxClick}
                disabled={isEstimatingGas}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  isEstimatingGas 
                    ? 'bg-gray-500 cursor-not-allowed text-gray-400' 
                    : 'bg-white/10 hover:bg-white/20 text-gray-300'
                }`}
              >
                {isEstimatingGas ? (
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-spinner animate-spin text-xs"></i>
                    <span>...</span>
                  </div>
                ) : (
                  'Max'
                )}
              </button>
              <span className="text-gray-400 text-sm">ETH</span>
            </div>
          </div>
          
          {/* Balance Display */}
          <div className="mt-3">
            <p className="text-sm text-gray-400">
              Available for withdrawal: <span className="text-green-400 font-medium">{(() => {
                const actualBalanceWei = actualWithdrawableBalance as bigint;
                const baseBuffer = parseEther('0.15');
                const largeTransactionSize = parseEther('1000');
                const veryLargeTransactionSize = parseEther('5000');
                const extremelyLargeTransactionSize = parseEther('8000');
                let bufferAmount = baseBuffer;
                if (actualBalanceWei > extremelyLargeTransactionSize) {
                  const percentageBuffer = actualBalanceWei / 50n;
                  const minBuffer = parseEther('2');
                  bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
                } else if (actualBalanceWei > veryLargeTransactionSize) {
                  const percentageBuffer = actualBalanceWei / 100n;
                  const minBuffer = parseEther('1');
                  bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
                } else if (actualBalanceWei > largeTransactionSize) {
                  const percentageBuffer = actualBalanceWei / 200n;
                  const minBuffer = parseEther('0.5');
                  bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
                }
                return parseFloat(formatEther(actualBalanceWei - bufferAmount)).toFixed(6);
              })()} ETH</span>
            </p>
            {/* Gas estimation display removed due to viem compatibility issues */}
          </div>
        </div>

        {/* Error Display */}
        {(error || transactionError) && (
          <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <i className="fas fa-exclamation-triangle text-red-400 mr-3"></i>
            <p className="text-sm text-red-400">{error || transactionError}</p>
          </div>
        )}

        {/* Withdraw Button */}
        <button
          onClick={handleWithdraw}
          disabled={isWithdrawTotalLoading || !amount}
          className="btn-primary w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isWithdrawTotalLoading ? (
            <span className="flex items-center justify-center">
              <i className="fas fa-spinner fa-spin mr-3"></i>
              Processing Withdrawal...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <i className="fas fa-arrow-up mr-3"></i>
              Withdraw Funds
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default WithdrawForm;