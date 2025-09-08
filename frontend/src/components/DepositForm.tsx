import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { parseEther, formatEther } from 'ethers';
import { Plus, AlertCircle } from 'lucide-react';
import TransactionLoader from './TransactionLoader';

const DepositForm: React.FC = () => {
  const { isConnected } = useAccount();
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
    setAmount('1000'); // Max deposit
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Deposit Successful!</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your ETH has been successfully deposited to the SafeVault.
          </p>
          {depositTx && (
            <p className="text-xs text-gray-500 font-mono break-all">
              Transaction: {depositTx}
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
          disabled={isDepositLoading || !amount}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {isDepositLoading ? 'Processing...' : 'Deposit ETH'}
        </button>
      </div>
    </div>
  );
};

export default DepositForm;
