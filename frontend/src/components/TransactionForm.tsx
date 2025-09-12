import React, { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { parseEther, formatEther } from 'ethers';
import TransactionLoader from './TransactionLoader';
import { useFadeIn } from '../hooks/useAnimations';
import { handleTransactionError } from '../utils/errorParser';

const TransactionForm: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { data: walletBalance } = useBalance({
    address: address,
  });
  const { 
    // Direct writeContract function for production-ready transactions
    writeContract,
    writeWithdrawTotal,
    safeVaultContract,
    actualWithdrawableBalance,
    // Deposit states
    isDepositLoading,
    isDepositWriting,
    isDepositConfirming,
    isDepositSuccess,
    depositTx,
    // Withdraw states
    isWithdrawTotalLoading,
    isWithdrawTotalWriting,
    isWithdrawTotalConfirming,
    isWithdrawTotalSuccess,
    withdrawTotalTx,
    transactionError,
    clearTransactionError,
    refreshBalance
  } = useSafeVault();
  
  const [selectedAction, setSelectedAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<'deposit' | 'withdraw' | null>(null);
  
  const fadeInRef = useFadeIn(0.4);

  const handleTransaction = async () => {
    if (!selectedAction) {
      setError('Please select an action first');
      return;
    }

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
      
      console.log(`🚀 Proceeding with ${selectedAction} using direct writeContract...`);
      
      if (selectedAction === 'deposit') {
        // Call writeContract for deposit
        await writeContract({
          address: safeVaultContract.address as `0x${string}`,
          abi: safeVaultContract.abi,
          functionName: 'deposit',
          value: amountWei,
        });
      } else {
        // Call writeWithdrawTotal for withdrawal
        await writeWithdrawTotal({
          address: safeVaultContract.address as `0x${string}`,
          abi: safeVaultContract.abi,
          functionName: 'withdrawTotal',
          args: [amountWei],
        });
      }
      
      setAmount('');
    } catch (err: any) {
      const parsedError = handleTransactionError(err, selectedAction);
      
      if (parsedError.isUserCancellation) {
        // Don't show error message for user cancellations - just reset the form
        console.log(`🚫 User cancelled ${selectedAction} transaction - resetting form`);
        setError('');
        setAmount(''); // Clear the amount field
        return;
      }
      
      if (parsedError.shouldShowError) {
        setError(parsedError.message);
      }
    }
  };

  // Clear form when action changes
  React.useEffect(() => {
    setAmount('');
    setError('');
    clearTransactionError();
  }, [selectedAction, clearTransactionError]);

  // Handle success states and auto-return to normal form
  React.useEffect(() => {
    if (isDepositSuccess) {
      setAmount('');
      setError('');
      setShowSuccess(true);
      setSuccessType('deposit');
      setSelectedAction(null); // Reset action selection
      
      // Refresh balance immediately after successful deposit
      console.log('🔄 TransactionForm: Refreshing balance after successful deposit...');
      refreshBalance().catch(error => {
        console.error('❌ TransactionForm: Error refreshing balance:', error);
      });
      
      // Return to normal form after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setSuccessType(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isDepositSuccess, refreshBalance]);

  React.useEffect(() => {
    if (isWithdrawTotalSuccess) {
      setAmount('');
      setError('');
      setShowSuccess(true);
      setSuccessType('withdraw');
      setSelectedAction(null); // Reset action selection
      
      // Refresh balance immediately after successful withdrawal
      console.log('🔄 TransactionForm: Refreshing balance after successful withdrawal...');
      refreshBalance().catch(error => {
        console.error('❌ TransactionForm: Error refreshing balance:', error);
      });
      
      // Return to normal form after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setSuccessType(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isWithdrawTotalSuccess, refreshBalance]);

  // Handle loading state changes to reset form if loading stops unexpectedly
  React.useEffect(() => {
    // If loading state changes from true to false and we're not in success state, reset any errors
    if (!isDepositLoading && !isDepositSuccess && !isWithdrawTotalLoading && !isWithdrawTotalSuccess && error) {
      console.log('🔄 TransactionForm: Loading state changed, clearing any pending errors');
      setError('');
    }
  }, [isDepositLoading, isDepositSuccess, isWithdrawTotalLoading, isWithdrawTotalSuccess, error]);

  if (!isConnected) {
    return null;
  }

  // Show transaction loader when processing deposit
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

  // Show transaction loader when processing withdrawal
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

  // Show success message briefly after successful transaction
  if ((isDepositSuccess || isWithdrawTotalSuccess) && showSuccess && successType) {
    const txHash = successType === 'deposit' ? depositTx : withdrawTotalTx;
    
    return (
      <div className="glass-effect p-8 text-center fade-in">
        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 ${
          successType === 'deposit' 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
            : 'bg-gradient-to-r from-purple-500 to-purple-600'
        }`}>
          <i className="fas fa-check text-2xl text-white"></i>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">
          {successType === 'deposit' ? 'Deposit' : 'Withdrawal'} Successful!
        </h3>
        <p className="text-gray-400 mb-6">
          {successType === 'deposit' 
            ? 'Your ETH has been successfully deposited to the SafeVault and is now earning yield.'
            : 'Your funds have been successfully withdrawn to your wallet.'
          }
        </p>
        
        {/* Transaction Details with Block Explorer Link */}
        {txHash && (
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-gray-500 font-mono break-all mb-3">
                Transaction Hash: {txHash}
              </p>
              <a 
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="etherscan-link inline-flex items-center space-x-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                <i className="fas fa-external-link-alt"></i>
                <span>View on Etherscan</span>
              </a>
            </div>
          </div>
        )}
        
        <p className="text-sm text-gray-400 mt-6">
          Your balance will be updated shortly...
        </p>
      </div>
    );
  }

  return (
    <div ref={fadeInRef} className="glass-effect p-6">
      <div className="flex items-center mb-6">
        <div className="strategy-icon icon-bg-purple">
          <i className="fas fa-vault icon-text-purple text-xl"></i>
        </div>
        <h3 className="text-xl font-bold text-white ml-4">Your Vault</h3>
      </div>

      <div className="space-y-6">
        {/* Step 1: Action Selection */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">1. Choose Action</h4>
          <p className="helper-text text-gray-400 text-sm mb-4">
            Choose to deposit or withdraw ETH.
          </p>
        </div>

        {/* Action Selection Buttons */}
        <div className="grid grid-cols-2 gap-4">
          {/* Deposit Button */}
          <button
            onClick={() => setSelectedAction('deposit')}
            className={`py-4 text-lg font-semibold w-full strategy-card ${
              selectedAction === 'deposit' ? 'deposit-selected' : 'deposit-unselected'
            }`}
          >
            <span className="flex items-center justify-center">
              <i className="fas fa-arrow-up mr-2"></i>
              Deposit
            </span>
          </button>

          {/* Withdraw Button */}
          <button
            onClick={() => setSelectedAction('withdraw')}
            className={`py-4 text-lg font-semibold w-full strategy-card ${
              selectedAction === 'withdraw' ? 'withdraw-selected' : 'withdraw-unselected'
            }`}
          >
            <span className="flex items-center justify-center">
              <i className="fas fa-arrow-down mr-2"></i>
              Withdraw
            </span>
          </button>
        </div>

        {/* Error Display */}
        {(error || transactionError) && (
          <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <i className="fas fa-exclamation-triangle text-red-400 mr-3"></i>
            <p className="text-sm text-red-400">{error || transactionError}</p>
          </div>
        )}

        {/* Step 2: Amount Input (only show if action is selected) */}
        {selectedAction && (
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">2. Enter Amount</h4>
            <p className="helper-text text-gray-400 text-sm mb-4">
              Enter the amount of ETH you'd like to {selectedAction}.
            </p>
            
            <label htmlFor="transaction-amount" className="block text-sm font-medium text-gray-300 mb-3">
              Amount (ETH)
            </label>
            <div className="relative">
              <input
                type="text"
                id="transaction-amount"
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
            
            {/* Available Balance Information - below input */}
            <div className="mt-3">
              <div className="balance-minimal">
                <span className="text-xs text-gray-400">
                  {selectedAction === 'deposit' ? 'Available for deposit:' : 'Available for withdrawal:'} 
                  <span className={`font-medium ${selectedAction === 'deposit' ? 'text-blue-400' : 'text-purple-400'}`}>
                    {selectedAction === 'deposit' 
                      ? walletBalance ? ` ${parseFloat(formatEther(walletBalance.value)).toFixed(4)} ETH` : ' 0.0000 ETH'
                      : actualWithdrawableBalance ? ` ${parseFloat(formatEther(actualWithdrawableBalance as bigint)).toFixed(4)} ETH` : ' 0.0000 ETH'
                    }
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Submit Button (only show if action and amount are selected) */}
        {selectedAction && amount && (
          <div>
            <button
              onClick={handleTransaction}
              disabled={isDepositLoading || isWithdrawTotalLoading}
              className="w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isDepositLoading || isWithdrawTotalLoading 
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
                  : selectedAction === 'deposit'
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.9))'
                    : 'linear-gradient(135deg, rgba(168, 139, 250, 0.8), rgba(139, 92, 246, 0.9))',
                border: `1px solid ${isDepositLoading || isWithdrawTotalLoading ? 'rgba(255,255,255,0.1)' : selectedAction === 'deposit' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 139, 250, 0.3)'}`,
                boxShadow: 'none',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
              }}
            >
              {isDepositLoading || isWithdrawTotalLoading ? (
                <span className="flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <i className={`fas ${selectedAction === 'deposit' ? 'fa-arrow-up' : 'fa-arrow-down'} mr-2`}></i>
                  {selectedAction === 'deposit' ? 'Deposit' : 'Withdraw'} ETH
                </span>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default TransactionForm;
