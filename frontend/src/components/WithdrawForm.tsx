import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { parseEther, formatEther } from 'ethers';
import { Minus, AlertCircle } from 'lucide-react';
import TransactionLoader from './TransactionLoader';

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

  const handleWithdrawPrincipal = async () => {
    if (!principalAmount) {
      setError('Please enter an amount');
      return;
    }

    try {
      const amountWei = parseEther(principalAmount);
      if (amountWei > (principalBalance as bigint)) {
        setError('Insufficient principal balance');
        return;
      }

      setError('');
      await withdrawPrincipal(amountWei);
      setPrincipalAmount('');
    } catch (err: any) {
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
      if (amountWei > (yieldBalance as bigint)) {
        setError('Insufficient yield balance');
        return;
      }

      setError('');
      await withdrawYield(amountWei);
      setYieldAmount('');
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
    }
  };

  const handleMaxPrincipal = () => {
    setPrincipalAmount(formatEther(principalBalance as bigint));
  };

  const handleMaxYield = () => {
    setYieldAmount(formatEther(yieldBalance as bigint));
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Principal Withdrawal Successful!</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your principal has been successfully withdrawn.
          </p>
          {withdrawPrincipalTx && (
            <p className="text-xs text-gray-500 font-mono break-all">
              Transaction: {withdrawPrincipalTx}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Your balance will be updated shortly...
          </p>
        </div>
      </div>
    );
  }

  // Show success message for yield withdrawal
  if (isWithdrawYieldSuccess && showYieldSuccess) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Yield Withdrawal Successful!</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your yield has been successfully withdrawn.
          </p>
          {withdrawYieldTx && (
            <p className="text-xs text-gray-500 font-mono break-all">
              Transaction: {withdrawYieldTx}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Your balance will be updated shortly...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <Minus className="h-6 w-6 text-red-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Withdraw</h3>
      </div>

      <div className="space-y-6">
        {/* Principal Withdrawal */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Withdraw Principal</h4>
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="number"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                placeholder="0.0"
                step="0.01"
                min="0"
                max={formatEther(principalBalance as bigint)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={handleMaxPrincipal}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Max
            </button>
            <button
              onClick={handleWithdrawPrincipal}
              disabled={isWithdrawPrincipalLoading || !principalAmount}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isWithdrawPrincipalLoading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Available: {parseFloat(formatEther(principalBalance as bigint)).toFixed(4)} ETH
          </p>
        </div>

        {/* Yield Withdrawal */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Withdraw Yield</h4>
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="number"
                value={yieldAmount}
                onChange={(e) => setYieldAmount(e.target.value)}
                placeholder="0.0"
                step="0.01"
                min="0"
                max={formatEther(yieldBalance as bigint)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={handleMaxYield}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Max
            </button>
            <button
              onClick={handleWithdrawYield}
              disabled={isWithdrawYieldLoading || !yieldAmount}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isWithdrawYieldLoading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Available: {parseFloat(formatEther(yieldBalance as bigint)).toFixed(4)} ETH
          </p>
        </div>

        {error && (
          <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawForm;
