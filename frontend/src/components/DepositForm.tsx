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
    deposit, 
    isDepositLoading,
    isDepositWriting,
    isDepositConfirming,
    isDepositSuccess,
    depositTx,
    transactionError,
    clearTransactionError
  } = useSafeVault();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const fadeInRef = useFadeIn(0.4);
  const glowRef = useGlowEffect('#10B981');

  const handleDeposit = async () => {
    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    try {
      const amountWei = parseEther(amount);
      const balance = walletBalance?.value as bigint;
      
      console.log('🔍 Deposit Total Debug:');
      console.log('  - Input amount:', amount);
      console.log('  - Parsed amount (wei):', amountWei.toString());
      console.log('  - Parsed amount (ETH):', formatEther(amountWei));
      console.log('  - Current wallet balance (wei):', balance?.toString());
      console.log('  - Current wallet balance (ETH):', balance ? formatEther(balance) : 'N/A');
      console.log('  - Amount > Balance?', balance ? amountWei > balance : 'N/A');
      console.log('  - Remaining for gas (ETH):', balance ? formatEther(balance - amountWei) : 'N/A');
      
      if (balance && amountWei > balance) {
        setError('Insufficient wallet balance');
        return;
      }

      setError('');
      
      console.log('🚀 Proceeding with deposit...');
      await deposit(amountWei);
      setAmount('');
    } catch (err: any) {
      console.error('Deposit error:', err);
      
      // Handle specific errors with better messaging
      if (err.message && err.message.includes('Insufficient funds for gas')) {
        setError('Insufficient ETH for gas fees. For large transactions, you need more ETH reserved for gas. Try using the MAX button or depositing a smaller amount.');
      } else if (err.message && err.message.includes('insufficient funds')) {
        setError('Insufficient funds for gas fees. Try depositing a smaller amount to leave more ETH for gas costs.');
      } else if (err.message && (err.message.includes('gas') || err.message.includes('out of gas'))) {
        setError('Transaction failed due to gas issues. The system tried multiple gas limits but couldn\'t complete the transaction. Please try again or contact support.');
      } else if (err.message && err.message.includes('custom error')) {
        setError('Transaction failed due to a smart contract error. This might be due to insufficient balance or a contract restriction. Try depositing a smaller amount.');
      } else if (err.message && err.message.includes('execution reverted')) {
        setError('Transaction failed due to a smart contract error. This might be due to insufficient balance or a contract restriction. Try depositing a smaller amount.');
      } else if (err.message && err.message.includes('total cost') && err.message.includes('exceeds the balance')) {
        setError('Transaction failed: The total cost (gas + value) exceeds your balance. For large deposits, more ETH is needed for gas fees. Try using the MAX button or depositing a smaller amount.');
      } else {
        setError(err.message || 'Deposit failed');
      }
    }
  };

  const handleMaxClick = () => {
    // Use the wallet balance but leave a dynamic buffer for gas costs
    const walletBalanceWei = walletBalance?.value as bigint;
    
    // Calculate a more conservative buffer based on the transaction size
    // For large transactions, we need more gas buffer
    const baseBuffer = parseEther('0.15'); // Base buffer
    const largeTransactionSize = parseEther('1000'); // Consider transactions over 1000 ETH as "large"
    const veryLargeTransactionSize = parseEther('5000'); // Consider transactions over 5000 ETH as "very large"
    const extremelyLargeTransactionSize = parseEther('8000'); // Consider transactions over 8000 ETH as "extremely large"
    
    // If the wallet balance is very large, use a more conservative approach
    let bufferAmount = baseBuffer;
    if (walletBalanceWei > extremelyLargeTransactionSize) {
      // For extremely large balances (>8000 ETH), use an exponential buffer (2% of balance, minimum 2 ETH)
      const percentageBuffer = walletBalanceWei / 50n; // 2%
      const minBuffer = parseEther('2');
      bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
    } else if (walletBalanceWei > veryLargeTransactionSize) {
      // For very large balances (5000-8000 ETH), use a higher percentage buffer (1% of balance, minimum 1 ETH)
      const percentageBuffer = walletBalanceWei / 100n; // 1%
      const minBuffer = parseEther('1');
      bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
    } else if (walletBalanceWei > largeTransactionSize) {
      // For large balances (1000-5000 ETH), use a moderate percentage buffer (0.5% of balance, minimum 0.5 ETH)
      const percentageBuffer = walletBalanceWei / 200n; // 0.5%
      const minBuffer = parseEther('0.5');
      bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
    }
    
    const availableAmount = walletBalanceWei - bufferAmount;
    
    console.log('🔍 MAX Button Debug (Dynamic Buffer):');
    console.log(`  - Wallet balance: ${formatEther(walletBalanceWei)} ETH`);
    console.log(`  - Base buffer: ${formatEther(baseBuffer)} ETH`);
    console.log(`  - Dynamic buffer: ${formatEther(bufferAmount)} ETH`);
    console.log(`  - Available amount: ${formatEther(availableAmount)} ETH`);
    console.log(`  - Final max amount: ${formatEther(availableAmount)} ETH`);
    console.log(`  - Remaining for gas: ${formatEther(bufferAmount)} ETH`);
    console.log(`  - Buffer percentage: ${((Number(bufferAmount) / Number(walletBalanceWei)) * 100).toFixed(2)}%`);
    
    if (availableAmount > 0n) {
      setAmount(formatEther(availableAmount));
    } else {
      // If balance is too small, don't set any amount
      setAmount('');
      setError(`Insufficient balance. You need at least ${formatEther(bufferAmount)} ETH for gas fees and timing buffer.`);
    }
  };

  // Handle success state and auto-return to normal form
  React.useEffect(() => {
    if (isDepositSuccess) {
      setAmount('');
      setError('');
      setShowSuccess(true);
      
      // Return to normal form after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isDepositSuccess]);


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
              type="number"
              id="deposit-amount"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
                clearTransactionError(); // Clear transaction error when user changes amount
              }}
              placeholder="0.0"
              step="0.001"
              max={walletBalance ? (() => {
                const walletBalanceWei = walletBalance.value;
                const baseBuffer = parseEther('0.15');
                const largeTransactionSize = parseEther('1000');
                const veryLargeTransactionSize = parseEther('5000');
                const extremelyLargeTransactionSize = parseEther('8000');
                let bufferAmount = baseBuffer;
                if (walletBalanceWei > extremelyLargeTransactionSize) {
                  const percentageBuffer = walletBalanceWei / 50n;
                  const minBuffer = parseEther('2');
                  bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
                } else if (walletBalanceWei > veryLargeTransactionSize) {
                  const percentageBuffer = walletBalanceWei / 100n;
                  const minBuffer = parseEther('1');
                  bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
                } else if (walletBalanceWei > largeTransactionSize) {
                  const percentageBuffer = walletBalanceWei / 200n;
                  const minBuffer = parseEther('0.5');
                  bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
                }
                return parseFloat(formatEther(walletBalanceWei - bufferAmount));
              })() : undefined}
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
          
          {/* Wallet Balance Display */}
          {walletBalance && (
            <div className="mt-3">
              <p className="text-sm text-gray-400">
                Available for deposit: <span className="text-green-400 font-medium">{(() => {
                  const walletBalanceWei = walletBalance.value;
                  const baseBuffer = parseEther('0.15');
                  const largeTransactionSize = parseEther('1000');
                  const veryLargeTransactionSize = parseEther('5000');
                  const extremelyLargeTransactionSize = parseEther('8000');
                  let bufferAmount = baseBuffer;
                  if (walletBalanceWei > extremelyLargeTransactionSize) {
                    const percentageBuffer = walletBalanceWei / 50n;
                    const minBuffer = parseEther('2');
                    bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
                  } else if (walletBalanceWei > veryLargeTransactionSize) {
                    const percentageBuffer = walletBalanceWei / 100n;
                    const minBuffer = parseEther('1');
                    bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
                  } else if (walletBalanceWei > largeTransactionSize) {
                    const percentageBuffer = walletBalanceWei / 200n;
                    const minBuffer = parseEther('0.5');
                    bufferAmount = percentageBuffer > minBuffer ? percentageBuffer : minBuffer;
                  }
                  return parseFloat(formatEther(walletBalanceWei - bufferAmount)).toFixed(6);
                })()} ETH</span>
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

        {/* Deposit Button */}
        <button
          onClick={handleDeposit}
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

        {/* Info Panel */}
        <div className="glass-effect p-4 border border-vodl-500/20">
          <h4 className="text-sm font-medium text-vodl-400 mb-3 flex items-center">
            <i className="fas fa-info-circle mr-2"></i>
            How Vodling Works:
          </h4>
          <ul className="text-sm text-gray-300 space-y-2">
            <li className="flex items-start">
              <i className="fas fa-shield-alt text-vodl-400 mr-2 mt-0.5 text-xs"></i>
              Your ETH is staked via Lido to earn stETH yield
            </li>
            <li className="flex items-start">
              <i className="fas fa-lock text-vodl-400 mr-2 mt-0.5 text-xs"></i>
              Your principal is always protected and never sold
            </li>
            <li className="flex items-start">
              <i className="fas fa-chart-line text-vodl-400 mr-2 mt-0.5 text-xs"></i>
              Yield accumulates over time and can be withdrawn separately
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DepositForm;
