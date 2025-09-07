import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { parseEther, formatEther } from 'ethers';
import { Minus, AlertCircle } from 'lucide-react';

const WithdrawForm: React.FC = () => {
  const { isConnected } = useAccount();
  const { 
    withdrawPrincipal, 
    withdrawYield, 
    principalBalance, 
    yieldBalance, 
    isLoading 
  } = useSafeVault();
  
  const [principalAmount, setPrincipalAmount] = useState('');
  const [yieldAmount, setYieldAmount] = useState('');
  const [error, setError] = useState('');

  const handleWithdrawPrincipal = async () => {
    if (!principalAmount) {
      setError('Please enter an amount');
      return;
    }

    try {
      const amountWei = parseEther(principalAmount);
      if (amountWei > principalBalance) {
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
      if (amountWei > yieldBalance) {
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
    setPrincipalAmount(formatEther(principalBalance));
  };

  const handleMaxYield = () => {
    setYieldAmount(formatEther(yieldBalance));
  };

  if (!isConnected) {
    return null;
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
                max={formatEther(principalBalance)}
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
              disabled={isLoading || !principalAmount}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Withdraw
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Available: {parseFloat(formatEther(principalBalance)).toFixed(4)} ETH
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
                max={formatEther(yieldBalance)}
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
              disabled={isLoading || !yieldAmount}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Withdraw
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Available: {parseFloat(formatEther(yieldBalance)).toFixed(4)} ETH
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
