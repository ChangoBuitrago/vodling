import React from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { formatEther } from 'ethers';
import { Wallet, Shield, TrendingUp } from 'lucide-react';

const BalanceCard: React.FC = () => {
  const { isConnected } = useAccount();
  const { 
    principalBalance, 
    yieldBalance, 
    totalBalance, 
    isLoading 
  } = useSafeVault();

  if (!isConnected) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Your Balances</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Principal Balance */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-600">Principal</p>
              <p className="text-2xl font-bold text-blue-900">
                {parseFloat(formatEther(principalBalance as bigint)).toFixed(4)} ETH
              </p>
            </div>
          </div>
        </div>

        {/* Yield Balance */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-600">Yield</p>
              <p className="text-2xl font-bold text-green-900">
                {parseFloat(formatEther(yieldBalance as bigint)).toFixed(4)} ETH
              </p>
            </div>
          </div>
        </div>

        {/* Total Balance */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <Wallet className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {parseFloat(formatEther(totalBalance as bigint)).toFixed(4)} ETH
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
