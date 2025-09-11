import React from 'react';
import { useSafeVault } from '../hooks/useSafeVault';
import { formatEther } from 'ethers';
import { BarChart3, Users, TrendingUp, Shield } from 'lucide-react';

const StatsCard: React.FC = () => {
  const { 
    totalPrincipal, 
    totalYield, 
    ethPrice, 
    isLoading 
  } = useSafeVault();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalPrincipalETH = parseFloat(formatEther(totalPrincipal as bigint));
  const totalYieldETH = parseFloat(formatEther(totalYield as bigint));
  const totalETH = totalPrincipalETH + totalYieldETH;
  const ethPriceUSD = Number(ethPrice as bigint) / 1e8;
  const totalValueUSD = totalETH * ethPriceUSD;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Protocol Stats</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-gray-600">Total Principal</span>
          </div>
          <span className="font-medium">
            {parseFloat(formatEther(totalPrincipal as bigint)).toFixed(2)} ETH
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-gray-600">Total Yield</span>
          </div>
          <span className="font-medium">
            {parseFloat(formatEther(totalYield as bigint)).toFixed(6)} ETH
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-sm text-gray-600">Total Value</span>
          </div>
          <span className="font-medium">
            ${totalValueUSD.toFixed(2)}
          </span>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">ETH Price</span>
            <span className="font-medium">
              ${ethPriceUSD.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
