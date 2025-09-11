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
    depositTx
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
      const minWei = parseEther('0.01'); // minDeposit from contract
      const maxWei = parseEther('1000'); // maxDeposit from contract

      if (amountWei < minWei) {
        setError(`Minimum deposit is ${formatEther(minWei)} ETH`);
        return;
      }

      if (amountWei > maxWei) {
        setError(`Maximum deposit is ${formatEther(maxWei)} ETH`);
        return;
      }

      setError('');
      await deposit(amountWei);
      // Don't clear amount immediately - let user see the success state
    } catch (err: any) {
      setError(err.message || 'Deposit failed');
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

  const handleMaxClick = () => {
    if (walletBalance) {
      const balance = parseFloat(formatEther(walletBalance.value));
      setAmount(balance.toFixed(4));
    }
  };

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
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.01"
              min="0.01"
              max="1000"
              className="form-input w-full px-4 py-3 pr-20 text-lg"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
              <button
                type="button"
                onClick={handleMaxClick}
                className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-gray-300"
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
                Wallet Balance: <span className="text-white font-medium">{parseFloat(formatEther(walletBalance.value)).toFixed(4)} ETH</span>
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <i className="fas fa-exclamation-triangle text-red-400 mr-3"></i>
            <p className="text-sm text-red-400">{error}</p>
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
            <li className="flex items-start">
              <i className="fas fa-coins text-vodl-400 mr-2 mt-0.5 text-xs"></i>
              Min: 0.01 ETH, Max: 1000 ETH per deposit
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DepositForm;
