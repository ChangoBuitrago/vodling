import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
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
      if (err.message && err.message.includes('Insufficient funds for gas')) {
        setError('Insufficient ETH for gas fees. Please ensure you have at least 0.1 ETH for transaction fees. Try withdrawing a smaller amount.');
      } else if (err.message && err.message.includes('insufficient funds')) {
        setError('Insufficient funds for gas fees. Try withdrawing a smaller amount to leave more ETH for gas costs.');
      } else if (err.message && (err.message.includes('gas') || err.message.includes('out of gas'))) {
        setError('Transaction failed due to gas issues. The system tried multiple gas limits but couldn\'t complete the transaction. Please try again or contact support.');
      } else if (err.message && err.message.includes('custom error')) {
        setError('Transaction failed due to a smart contract error. This might be due to insufficient balance in the vault or a contract restriction. Try withdrawing a smaller amount.');
      } else if (err.message && err.message.includes('execution reverted')) {
        setError('Transaction failed due to a smart contract error. This might be due to insufficient balance in the vault or a contract restriction. Try withdrawing a smaller amount.');
      } else {
        setError(err.message || 'Withdrawal failed');
      }
      
      // Note: The loading state will be reset by the withdrawTotal function in the hook
      // If the error occurs here, the loading state should already be reset
    }
  };

  const handleMaxClick = () => {
    // Use the actual withdrawable balance from the contract (same calculation as withdrawTotal uses)
    const actualBalanceWei = actualWithdrawableBalance as bigint;
    
    // Calculate a more conservative buffer based on the transaction size (same as DepositForm)
    // For large transactions, we need more gas buffer
    const baseBuffer = parseEther('0.15'); // Base buffer
    const largeTransactionSize = parseEther('1000'); // Consider transactions over 1000 ETH as "large"
    const veryLargeTransactionSize = parseEther('5000'); // Consider transactions over 5000 ETH as "very large"
    const extremelyLargeTransactionSize = parseEther('8000'); // Consider transactions over 8000 ETH as "extremely large"
    
    // If the withdrawable balance is very large, use a more conservative approach
    let bufferAmount = baseBuffer;
    if (actualBalanceWei > extremelyLargeTransactionSize) {
      // For extremely large balances (>8000 ETH), use an exponential buffer (2% of balance, minimum 2 ETH)
      const percentageBuffer = actualBalanceWei / 50n; // 2%
      const minBuffer = parseEther('2');
      bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
    } else if (actualBalanceWei > veryLargeTransactionSize) {
      // For very large balances (5000-8000 ETH), use a higher percentage buffer (1% of balance, minimum 1 ETH)
      const percentageBuffer = actualBalanceWei / 100n; // 1%
      const minBuffer = parseEther('1');
      bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
    } else if (actualBalanceWei > largeTransactionSize) {
      // For large balances (1000-5000 ETH), use a moderate percentage buffer (0.5% of balance, minimum 0.5 ETH)
      const percentageBuffer = actualBalanceWei / 200n; // 0.5%
      const minBuffer = parseEther('0.5');
      bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
    }
    
    const availableAmount = actualBalanceWei - bufferAmount;
    
    console.log('🔍 MAX Button Debug (Dynamic Buffer):');
    console.log(`  - Frontend total balance: ${formatEther(totalBalance as bigint)} ETH`);
    console.log(`  - Contract actual withdrawable: ${formatEther(actualBalanceWei)} ETH`);
    console.log(`  - Base buffer: ${formatEther(baseBuffer)} ETH`);
    console.log(`  - Dynamic buffer: ${formatEther(bufferAmount)} ETH`);
    console.log(`  - Available amount: ${formatEther(availableAmount)} ETH`);
    console.log(`  - Final max amount: ${formatEther(availableAmount)} ETH`);
    console.log(`  - Remaining for gas: ${formatEther(bufferAmount)} ETH`);
    console.log(`  - Buffer percentage: ${((Number(bufferAmount) / Number(actualBalanceWei)) * 100).toFixed(2)}%`);
    console.log(`  - Balance difference: ${formatEther((totalBalance as bigint) - actualBalanceWei)} ETH`);
    
    if (availableAmount > 0n) {
      setAmount(formatEther(availableAmount));
    } else {
      // If balance is too small, don't set any amount
      setAmount('');
      setError(`Insufficient balance. You need at least ${formatEther(bufferAmount)} ETH for gas fees and timing buffer.`);
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
                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors text-gray-300"
              >
                Max
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