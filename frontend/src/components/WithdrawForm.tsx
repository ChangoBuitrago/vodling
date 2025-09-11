import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { parseEther, formatEther } from 'ethers';
import TransactionLoader from './TransactionLoader';
import { useFadeIn } from '../hooks/useAnimations';

const WithdrawForm: React.FC = () => {
  const { isConnected } = useAccount();
  const { 
    withdrawPrincipal, 
    withdrawYield, 
    principalBalance, 
    yieldBalance, 
    isWithdrawPrincipalLoading,
    isWithdrawPrincipalWriting,
    isWithdrawPrincipalConfirming,
    isWithdrawPrincipalSuccess,
    withdrawPrincipalTx,
    isWithdrawYieldLoading,
    isWithdrawYieldWriting,
    isWithdrawYieldConfirming,
    isWithdrawYieldSuccess,
    withdrawYieldTx
  } = useSafeVault();
  
  const [principalAmount, setPrincipalAmount] = useState('');
  const [yieldAmount, setYieldAmount] = useState('');
  const [error, setError] = useState('');
  const [showPrincipalSuccess, setShowPrincipalSuccess] = useState(false);
  const [showYieldSuccess, setShowYieldSuccess] = useState(false);
  const [selectedType, setSelectedType] = useState<'principal' | 'yield' | null>(null);
  
  const fadeInRef = useFadeIn(0.6);

  const handleWithdrawPrincipal = async () => {
    if (!principalAmount) {
      setError('Please enter an amount');
      return;
    }

    try {
      const amountWei = parseEther(principalAmount);
      const balance = principalBalance as bigint;
      
      console.log('Withdraw Principal Debug:');
      console.log('Input amount:', principalAmount);
      console.log('Parsed amount (wei):', amountWei.toString());
      console.log('Current balance (wei):', balance.toString());
      console.log('Amount > Balance?', amountWei > balance);
      
      if (amountWei > balance) {
        setError('Insufficient principal balance');
        return;
      }

      setError('');
      console.log('Calling withdrawPrincipal with amount:', amountWei.toString());
      await withdrawPrincipal(amountWei);
      setPrincipalAmount('');
    } catch (err: any) {
      console.error('Withdraw principal error:', err);
      setError(err.message || 'Withdrawal failed');
    }
  };

  const handleWithdrawYield = async () => {
    if (!yieldAmount) {
      setError('Please enter an amount');
      return;
    }

    try {
      const amountWei = parseEther(yieldAmount);
      const balance = yieldBalance as bigint;
      
      console.log('Withdraw Yield Debug:');
      console.log('Input amount:', yieldAmount);
      console.log('Parsed amount (wei):', amountWei.toString());
      console.log('Current balance (wei):', balance.toString());
      console.log('Amount > Balance?', amountWei > balance);
      
      if (amountWei > balance) {
        setError('Insufficient yield balance');
        return;
      }

      setError('');
      console.log('Calling withdrawYield with amount:', amountWei.toString());
      await withdrawYield(amountWei);
      setYieldAmount('');
    } catch (err: any) {
      console.error('Withdraw yield error:', err);
      setError(err.message || 'Withdrawal failed');
    }
  };

  const handleMaxClick = () => {
    if (selectedType === 'principal') {
      setPrincipalAmount(formatEther(principalBalance as bigint));
    } else if (selectedType === 'yield') {
      setYieldAmount(formatEther(yieldBalance as bigint));
    }
  };

  // Handle success states and auto-return to normal form
  React.useEffect(() => {
    if (isWithdrawPrincipalSuccess) {
      setPrincipalAmount('');
      setError('');
      setShowPrincipalSuccess(true);
      
      // Return to normal form after 3 seconds
      const timer = setTimeout(() => {
        setShowPrincipalSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isWithdrawPrincipalSuccess]);

  React.useEffect(() => {
    if (isWithdrawYieldSuccess) {
      setYieldAmount('');
      setError('');
      setShowYieldSuccess(true);
      
      // Return to normal form after 3 seconds
      const timer = setTimeout(() => {
        setShowYieldSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isWithdrawYieldSuccess]);

  if (!isConnected) {
    return null;
  }

  // Show transaction loader for principal withdrawal
  if (isWithdrawPrincipalLoading) {
    return (
      <TransactionLoader
        isWriting={isWithdrawPrincipalWriting}
        isConfirming={isWithdrawPrincipalConfirming}
        isSuccess={isWithdrawPrincipalSuccess}
        error={error}
        transactionHash={withdrawPrincipalTx}
        type="withdrawPrincipal"
      />
    );
  }

  // Show transaction loader for yield withdrawal
  if (isWithdrawYieldLoading) {
    return (
      <TransactionLoader
        isWriting={isWithdrawYieldWriting}
        isConfirming={isWithdrawYieldConfirming}
        isSuccess={isWithdrawYieldSuccess}
        error={error}
        transactionHash={withdrawYieldTx}
        type="withdrawYield"
      />
    );
  }

  // Show success message for principal withdrawal
  if (isWithdrawPrincipalSuccess && showPrincipalSuccess) {
    return (
      <div className="glass-effect p-8 text-center fade-in">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-vodl-500 to-vodl-600 mb-6">
          <i className="fas fa-check text-2xl text-white"></i>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Principal Withdrawal Successful!</h3>
        <p className="text-gray-400 mb-6">
          Your principal has been successfully withdrawn to your wallet.
        </p>
        {withdrawPrincipalTx && (
          <p className="text-xs text-gray-500 font-mono break-all bg-white/5 p-3 rounded-lg">
            Transaction: {withdrawPrincipalTx}
          </p>
        )}
        <p className="text-sm text-gray-400 mt-4">
          Your balance will be updated shortly...
        </p>
      </div>
    );
  }

  // Show success message for yield withdrawal
  if (isWithdrawYieldSuccess && showYieldSuccess) {
    return (
      <div className="glass-effect p-8 text-center fade-in">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-vodl-500 to-vodl-600 mb-6">
          <i className="fas fa-check text-2xl text-white"></i>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Yield Withdrawal Successful!</h3>
        <p className="text-gray-400 mb-6">
          Your yield has been successfully withdrawn to your wallet.
        </p>
        {withdrawYieldTx && (
          <p className="text-xs text-gray-500 font-mono break-all bg-white/5 p-3 rounded-lg">
            Transaction: {withdrawYieldTx}
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
        <div className="strategy-icon icon-bg-purple">
          <i className="fas fa-arrow-up icon-text-purple text-xl"></i>
        </div>
        <h3 className="text-xl font-bold text-white ml-4">Withdraw Funds</h3>
      </div>

      <div className="space-y-6">
        {/* Balance Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="balance-card glass-effect p-4 border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-indigo-400 mr-2"></div>
                <span className="text-sm font-medium text-gray-300">Principal</span>
              </div>
              <span className="text-xs text-gray-400">Protected</span>
            </div>
            <p className="text-lg font-bold text-white">
              {parseFloat(formatEther(principalBalance as bigint)).toFixed(4)} ETH
            </p>
          </div>
          
          <div className="balance-card glass-effect p-4 border border-vodl-500/20 hover:border-vodl-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-vodl-400 mr-2"></div>
                <span className="text-sm font-medium text-gray-300">Yield</span>
              </div>
              <span className="text-xs text-vodl-400">Earned</span>
            </div>
            <p className="text-lg font-bold text-gradient-green">
              {parseFloat(formatEther(yieldBalance as bigint)).toFixed(6)} ETH
            </p>
          </div>
        </div>

        {/* Withdrawal Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Select withdrawal type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setSelectedType('principal');
                setPrincipalAmount('');
                setYieldAmount('');
                setError('');
              }}
              className={`withdraw-type-card p-4 rounded-xl border-2 transition-all duration-300 ${
                selectedType === 'principal'
                  ? 'border-indigo-500 bg-indigo-500/10 selected'
                  : 'border-white/10 bg-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedType === 'principal' ? 'bg-indigo-500' : 'bg-indigo-500/20'
                }`}>
                  <i className="fas fa-shield-alt text-white text-sm"></i>
                </div>
              </div>
              <p className="text-sm font-medium text-white">Principal</p>
              <p className="text-xs text-gray-400 mt-1">Your original deposit</p>
            </button>

            <button
              onClick={() => {
                setSelectedType('yield');
                setPrincipalAmount('');
                setYieldAmount('');
                setError('');
              }}
              className={`withdraw-type-card p-4 rounded-xl border-2 transition-all duration-300 ${
                selectedType === 'yield'
                  ? 'border-vodl-500 bg-vodl-500/10 selected'
                  : 'border-white/10 bg-white/5 hover:border-vodl-500/50 hover:bg-vodl-500/5'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedType === 'yield' ? 'bg-vodl-500' : 'bg-vodl-500/20'
                }`}>
                  <i className="fas fa-chart-line text-white text-sm"></i>
                </div>
              </div>
              <p className="text-sm font-medium text-white">Yield</p>
              <p className="text-xs text-gray-400 mt-1">Earned rewards</p>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        {selectedType && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Amount to withdraw
            </label>
            <div className="relative">
              <input
                type="number"
                value={selectedType === 'principal' ? principalAmount : yieldAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (selectedType === 'principal') {
                    setPrincipalAmount(value);
                  } else {
                    setYieldAmount(value);
                  }
                  setError('');
                }}
                placeholder="0.0"
                step="0.01"
                min="0"
                max={selectedType === 'principal' 
                  ? parseFloat(formatEther(principalBalance as bigint))
                  : parseFloat(formatEther(yieldBalance as bigint))
                }
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
            
            {/* Available Balance Display */}
            <div className="mt-3">
              <p className="text-sm text-gray-400">
                Available {selectedType === 'principal' ? 'Principal' : 'Yield'}: 
                <span className="text-white font-medium ml-1">
                  {selectedType === 'principal' 
                    ? `${parseFloat(formatEther(principalBalance as bigint)).toFixed(4)} ETH`
                    : `${parseFloat(formatEther(yieldBalance as bigint)).toFixed(6)} ETH`
                  }
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Withdraw Button */}
        {selectedType && (
          <button
            onClick={() => {
              if (selectedType === 'principal' && principalAmount) {
                handleWithdrawPrincipal();
              } else if (selectedType === 'yield' && yieldAmount) {
                handleWithdrawYield();
              }
            }}
            disabled={
              (isWithdrawPrincipalLoading || isWithdrawYieldLoading) || 
              !(selectedType === 'principal' ? principalAmount : yieldAmount)
            }
            className="btn-primary w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(isWithdrawPrincipalLoading || isWithdrawYieldLoading) ? (
              <span className="flex items-center justify-center">
                <i className="fas fa-spinner fa-spin mr-3"></i>
                Processing Withdrawal...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <i className="fas fa-arrow-up mr-3"></i>
                Withdraw {selectedType === 'principal' ? 'Principal' : 'Yield'}
              </span>
            )}
          </button>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <i className="fas fa-exclamation-triangle text-red-400 mr-3"></i>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Info Panel */}
        {selectedType && (
          <div className="glass-effect p-4 border border-gray-500/20">
            <div className="flex items-start">
              <i className={`fas ${
                selectedType === 'principal' ? 'fa-shield-alt text-indigo-400' : 'fa-chart-line text-vodl-400'
              } mr-3 mt-0.5`}></i>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">
                  {selectedType === 'principal' ? 'Principal Withdrawal' : 'Yield Withdrawal'}
                </h4>
                <p className="text-xs text-gray-400">
                  {selectedType === 'principal' 
                    ? 'Withdraw your original ETH deposit. This will reduce your principal balance.'
                    : 'Withdraw your earned yield. This will not affect your principal balance.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawForm;
