import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { parseEther, formatEther } from 'ethers';
import TransactionLoader from './TransactionLoader';
import { useFadeIn, useGlowEffect } from '../hooks/useAnimations';

const WithdrawForm: React.FC = () => {
  const { isConnected } = useAccount();
  const { 
    // Direct writeContract function for production-ready transactions
    writeWithdrawTotal,
    safeVaultContract,
    actualWithdrawableBalance, 
    isWithdrawTotalLoading,
    isWithdrawTotalWriting,
    isWithdrawTotalConfirming,
    isWithdrawTotalSuccess,
    withdrawTotalTx,
    transactionError,
    clearTransactionError,
    refreshBalance
  } = useSafeVault();
  
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  
  const fadeInRef = useFadeIn(0.4);
  const glowRef = useGlowEffect('#8B5CF6');

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    
    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    if (!safeVaultContract?.address || !safeVaultContract?.abi) {
      setError('Contract not available');
      return;
    }

    try {
      // Normalize decimal separator (comma to period) for parsing
      const normalizedAmount = amount.replace(',', '.');
      const amountWei = parseEther(normalizedAmount);
      
      setError('');
      
      console.log('🚀 Proceeding with withdrawal using direct writeContract...');
      
      // Call writeWithdrawTotal directly - this ensures it only runs on user click
      await writeWithdrawTotal({
        address: safeVaultContract.address as `0x${string}`,
        abi: safeVaultContract.abi,
        functionName: 'withdrawTotal',
        args: [amountWei],
      });
      
      setAmount('');
    } catch (err: any) {
      console.error('Withdraw total error:', err);
      
      // Handle specific errors with better messaging
      let userMessage = 'Withdrawal failed. Please try again.';
      
      if (err.message && err.message.includes('insufficient funds')) {
        userMessage = 'Insufficient funds. Please check your wallet balance and try a smaller amount.';
      } else if (err.code === 4001 || (err.message && (err.message.includes('user rejected') || err.message.includes('User denied') || err.message.includes('cancelled') || err.message.includes('denied transaction signature')))) {
        // Don't show error message for user cancellations - just reset the form
        console.log('🚫 User cancelled withdrawal transaction - resetting form');
        setError('');
        setAmount(''); // Clear the amount field
        return;
      } else if (err.message && err.message.includes('network')) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message) {
        userMessage = `Transaction failed: ${err.message}`;
      }
      
      setError(userMessage);
    }
  };


  // Handle success states and auto-return to normal form
  React.useEffect(() => {
    if (isWithdrawTotalSuccess) {
      setAmount('');
      setError('');
      setShowSuccess(true);
      
      // Refresh balance immediately after successful withdrawal
      console.log('🔄 WithdrawForm: Refreshing balance after successful withdrawal...');
      refreshBalance().catch(error => {
        console.error('❌ WithdrawForm: Error refreshing balance:', error);
      });
      
      // Return to normal form after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isWithdrawTotalSuccess, refreshBalance]);

  // Handle loading state changes to reset form if loading stops unexpectedly
  React.useEffect(() => {
    // If loading state changes from true to false and we're not in success state, reset any errors
    if (!isWithdrawTotalLoading && !isWithdrawTotalSuccess && error) {
      console.log('🔄 WithdrawForm: Loading state changed, clearing any pending errors');
      setError('');
    }
  }, [isWithdrawTotalLoading, isWithdrawTotalSuccess, error]);

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
              type="text"
              id="withdraw-amount"
              value={amount}
              onChange={(e) => {
                // Only allow numbers, decimal point, and comma (for locale compatibility)
                const value = e.target.value.replace(/[^0-9.,]/g, '');
                setAmount(value);
                setError('');
                clearTransactionError(); // Clear transaction error when user changes amount
              }}
              placeholder="0.0"
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="form-input w-full px-4 py-3 pr-16 text-lg"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-gray-400 text-sm">ETH</span>
            </div>
          </div>
          
          {/* Balance Display */}
          <div className="mt-3">
            <p className="text-sm text-gray-400">
              Available for withdrawal: <span className="text-green-400 font-medium">
                {actualWithdrawableBalance ? parseFloat(formatEther(actualWithdrawableBalance as bigint)).toFixed(4) : '0.0000'} ETH
              </span>
            </p>
          </div>
        </div>

        {/* Error Display */}
        {(error || transactionError) && (
          <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <i className="fas fa-exclamation-triangle text-red-400 mr-3"></i>
            <p className="text-sm text-red-400">{error || transactionError}</p>
          </div>
        )}

        {/* Withdraw Form */}
        <form onSubmit={handleWithdraw}>
          <button
            type="submit"
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
        </form>
      </div>
    </div>
  );
};

export default WithdrawForm;