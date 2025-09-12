import React, { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { parseEther, formatEther } from 'ethers';
import TransactionLoader from './TransactionLoader';
import { useFadeIn, useGlowEffect } from '../hooks/useAnimations';

const DepositForm: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { data: walletBalance } = useBalance({
    address: address,
  });
  const { 
    // Direct writeContract function for production-ready transactions
    writeContract,
    safeVaultContract,
    isDepositLoading,
    isDepositWriting,
    isDepositConfirming,
    isDepositSuccess,
    depositTx,
    transactionError,
    clearTransactionError,
    refreshBalance
  } = useSafeVault();
  
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const fadeInRef = useFadeIn(0.4);
  const glowRef = useGlowEffect('#10B981');

  const handleDeposit = async (e: React.FormEvent) => {
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
      
      console.log('🚀 Proceeding with deposit using direct writeContract...');
      
      // Call writeContract directly - this ensures it only runs on user click
      await writeContract({
        address: safeVaultContract.address as `0x${string}`,
        abi: safeVaultContract.abi,
        functionName: 'deposit',
        value: amountWei,
      });
      
      setAmount('');
    } catch (err: any) {
      console.error('Deposit error:', err);
      
      // Handle specific errors with better messaging
      let userMessage = 'Deposit failed. Please try again.';
      
      if (err.message && err.message.includes('insufficient funds')) {
        userMessage = 'Insufficient funds. Please check your wallet balance and try a smaller amount.';
      } else if (err.code === 4001 || (err.message && (err.message.includes('user rejected') || err.message.includes('User denied') || err.message.includes('cancelled') || err.message.includes('denied transaction signature')))) {
        // Don't show error message for user cancellations - just reset the form
        console.log('🚫 User cancelled deposit transaction - resetting form');
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


  // Handle success state and auto-return to normal form
  React.useEffect(() => {
    if (isDepositSuccess) {
      setAmount('');
      setError('');
      setShowSuccess(true);
      
      // Refresh balance immediately after successful deposit
      console.log('🔄 DepositForm: Refreshing balance after successful deposit...');
      refreshBalance().catch(error => {
        console.error('❌ DepositForm: Error refreshing balance:', error);
      });
      
      // Return to normal form after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isDepositSuccess, refreshBalance]);

  // Handle loading state changes to reset form if loading stops unexpectedly
  React.useEffect(() => {
    // If loading state changes from true to false and we're not in success state, reset any errors
    if (!isDepositLoading && !isDepositSuccess && error) {
      console.log('🔄 DepositForm: Loading state changed, clearing any pending errors');
      setError('');
    }
  }, [isDepositLoading, isDepositSuccess, error]);


  if (!isConnected) {
    return null;
  }

  // Show transaction loader when processing
  if (isDepositLoading) {
    return (
      <TransactionLoader
        isWriting={isDepositWriting}
        isConfirming={isDepositConfirming}
        isSuccess={isDepositSuccess}
        error={error}
        transactionHash={depositTx}
        type="deposit"
      />
    );
  }

  // Show success message briefly after successful transaction
  if (isDepositSuccess && showSuccess) {
    return (
      <div className="glass-effect p-8 text-center fade-in">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-vodl-500 to-vodl-600 mb-6">
          <i className="fas fa-check text-2xl text-white"></i>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Deposit Successful!</h3>
        <p className="text-gray-400 mb-6">
          Your ETH has been successfully deposited to the SafeVault and is now earning yield.
        </p>
        {depositTx && (
          <p className="text-xs text-gray-500 font-mono break-all bg-white/5 p-3 rounded-lg">
            Transaction: {depositTx}
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
        <div ref={glowRef} className="strategy-icon icon-bg-green">
          <i className="fas fa-arrow-down icon-text-green text-xl"></i>
        </div>
        <h3 className="text-xl font-bold text-white ml-4">Deposit Principal</h3>
      </div>

      <div className="space-y-6">
        {/* Deposit Amount Input */}
        <div>
          <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-300 mb-3">
            Amount to deposit (ETH)
          </label>
          <div className="relative">
            <input
              type="text"
              id="deposit-amount"
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
          
          {/* Wallet Balance Display */}
          {walletBalance && (
            <div className="mt-3">
              <p className="text-sm text-gray-400">
                Wallet balance: <span className="text-green-400 font-medium">
                  {parseFloat(formatEther(walletBalance.value)).toFixed(4)} ETH
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {(error || transactionError) && (
          <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <i className="fas fa-exclamation-triangle text-red-400 mr-3"></i>
            <p className="text-sm text-red-400">{error || transactionError}</p>
          </div>
        )}

        {/* Deposit Form */}
        <form onSubmit={handleDeposit}>
          <button
            type="submit"
            disabled={isDepositLoading || !amount}
            className="btn-primary w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
          {isDepositLoading ? (
            <span className="flex items-center justify-center">
              <i className="fas fa-spinner fa-spin mr-3"></i>
              Processing Deposit...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <i className="fas fa-arrow-down mr-3"></i>
              Deposit Principal
            </span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default DepositForm;
