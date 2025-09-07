import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { parseEther, formatEther } from 'ethers';
import { Plus, AlertCircle } from 'lucide-react';

const DepositForm: React.FC = () => {
  const { isConnected } = useAccount();
  const { deposit, minDeposit, maxDeposit, isLoading } = useSafeVault();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

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
      setAmount('');
    } catch (err: any) {
      setError(err.message || 'Deposit failed');
    }
  };

  const handleMaxClick = () => {
    setAmount('1000'); // Max deposit
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <Plus className="h-6 w-6 text-green-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Deposit ETH</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount (ETH)
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleMaxClick}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Max
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">How it works:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your ETH is staked via Lido to earn stETH</li>
            <li>• Your principal is always protected</li>
            <li>• Yield accumulates over time and can be withdrawn separately</li>
            <li>• Minimum deposit: 0.01 ETH, Maximum: 1000 ETH</li>
          </ul>
        </div>

        <button
          onClick={handleDeposit}
          disabled={isLoading || !amount}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {isLoading ? 'Processing...' : 'Deposit ETH'}
        </button>
      </div>
    </div>
  );
};

export default DepositForm;
