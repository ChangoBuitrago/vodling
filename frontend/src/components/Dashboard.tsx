import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { formatEther } from 'ethers';

interface VaultMetrics {
  safeVault: {
    totalDeposits: string;
    totalYield: string;
    stETHShares: string;
    stETHBalance: string;
  };
  turboVault: {
    totalAssets: string;
    totalSupply: string;
    shares: string;
    assetBalance: string;
  };
  mockLido: {
    totalSupply: string;
    pooledETH: string;
    shares: string;
  };
}

const Dashboard: React.FC = () => {
  const { address } = useAccount();
  const { safeVaultContract, mockLidoContract, turboVaultContract } = useContract();
  const [metrics, setMetrics] = useState<VaultMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize metrics with default values
  useEffect(() => {
    if (!metrics) {
      setMetrics({
        safeVault: {
          totalDeposits: '0.0',
          totalYield: '0.0',
          stETHShares: '0.0',
          stETHBalance: '0.0',
        },
        turboVault: {
          totalAssets: '0.0',
          totalSupply: '0.0',
          shares: '0.0',
          assetBalance: '0.0',
        },
        mockLido: {
          totalSupply: '0.0',
          pooledETH: '0.0',
          shares: '0.0',
        }
      });
    }
  }, [metrics]);

  // Read SafeVault metrics
  const { data: safeVaultTotalDeposits } = useReadContract({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'totalPrincipal',
    query: { enabled: !!safeVaultContract?.address, refetchInterval: 2000 }
  });

  const { data: safeVaultTotalYield } = useReadContract({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getTotalYield',
    query: { enabled: !!safeVaultContract?.address, refetchInterval: 2000 }
  });

  const { data: safeVaultStETHShares } = useReadContract({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'userStETHShares',
    args: address ? [address] : undefined,
    query: { enabled: !!safeVaultContract?.address && !!address, refetchInterval: 2000 }
  });

  // Read TurboVault metrics
  const { data: turboVaultTotalAssets, error: turboVaultAssetsError } = useReadContract({
    address: turboVaultContract?.address as `0x${string}` | undefined,
    abi: turboVaultContract?.abi,
    functionName: 'totalAssets',
    query: { enabled: !!turboVaultContract?.address, refetchInterval: 2000 }
  });

  const { data: turboVaultTotalSupply, error: turboVaultSupplyError } = useReadContract({
    address: turboVaultContract?.address as `0x${string}` | undefined,
    abi: turboVaultContract?.abi,
    functionName: 'totalSupply',
    query: { enabled: !!turboVaultContract?.address, refetchInterval: 2000 }
  });

  // Debug logging for TurboVault
  useEffect(() => {
    console.log('Dashboard - TurboVault Debug:', {
      address: turboVaultContract?.address,
      totalAssets: turboVaultTotalAssets,
      totalSupply: turboVaultTotalSupply,
      assetsError: turboVaultAssetsError,
      supplyError: turboVaultSupplyError
    });
    
    if (turboVaultAssetsError) {
      console.error('TurboVault totalAssets error:', turboVaultAssetsError);
    }
    if (turboVaultSupplyError) {
      console.error('TurboVault totalSupply error:', turboVaultSupplyError);
    }
  }, [turboVaultContract?.address, turboVaultTotalAssets, turboVaultTotalSupply, turboVaultAssetsError, turboVaultSupplyError]);

  // Read MockLido metrics
  const { data: mockLidoTotalSupply } = useReadContract({
    address: mockLidoContract?.address as `0x${string}` | undefined,
    abi: mockLidoContract?.abi,
    functionName: 'totalSupply',
    query: { enabled: !!mockLidoContract?.address, refetchInterval: 2000 }
  });

  const { data: mockLidoPooledETH } = useReadContract({
    address: mockLidoContract?.address as `0x${string}` | undefined,
    abi: mockLidoContract?.abi,
    functionName: 'getPooledEthByShares',
    args: mockLidoTotalSupply ? [mockLidoTotalSupply] : undefined,
    query: { enabled: !!mockLidoContract?.address && !!mockLidoTotalSupply, refetchInterval: 2000 }
  });

  // Update metrics when data changes
  useEffect(() => {
    console.log('Dashboard - Updating metrics with data:', {
      safeVaultTotalDeposits,
      safeVaultTotalYield,
      safeVaultStETHShares,
      turboVaultTotalAssets,
      turboVaultTotalSupply,
      mockLidoTotalSupply,
      mockLidoPooledETH
    });

    setMetrics(prev => ({
      safeVault: {
        totalDeposits: formatEther(typeof safeVaultTotalDeposits === 'bigint' ? safeVaultTotalDeposits : 0n),
        totalYield: formatEther(typeof safeVaultTotalYield === 'bigint' ? safeVaultTotalYield : 0n),
        stETHShares: formatEther(typeof safeVaultStETHShares === 'bigint' ? safeVaultStETHShares : 0n),
        stETHBalance: formatEther(typeof safeVaultStETHShares === 'bigint' ? safeVaultStETHShares : 0n), // Assuming 1:1 for now
      },
      turboVault: {
        totalAssets: formatEther(typeof turboVaultTotalAssets === 'bigint' ? turboVaultTotalAssets : 0n),
        totalSupply: formatEther(typeof turboVaultTotalSupply === 'bigint' ? turboVaultTotalSupply : 0n),
        shares: formatEther(typeof turboVaultTotalSupply === 'bigint' ? turboVaultTotalSupply : 0n),
        assetBalance: formatEther(typeof turboVaultTotalAssets === 'bigint' ? turboVaultTotalAssets : 0n),
      },
      mockLido: {
        totalSupply: formatEther(typeof mockLidoTotalSupply === 'bigint' ? mockLidoTotalSupply : 0n),
        pooledETH: formatEther(typeof mockLidoPooledETH === 'bigint' ? mockLidoPooledETH : 0n),
        shares: formatEther(typeof mockLidoTotalSupply === 'bigint' ? mockLidoTotalSupply : 0n),
      }
    }));
    setLastUpdated(new Date());
    setIsLoading(false);
  }, [safeVaultTotalDeposits, safeVaultTotalYield, safeVaultStETHShares, turboVaultTotalAssets, turboVaultTotalSupply, mockLidoTotalSupply, mockLidoPooledETH]);

  // Show refreshing indicator when any data is being fetched
  useEffect(() => {
    const isAnyLoading = !safeVaultTotalDeposits || !safeVaultTotalYield || !mockLidoTotalSupply || !turboVaultTotalAssets || !turboVaultTotalSupply;
    setIsRefreshing(isAnyLoading);
  }, [safeVaultTotalDeposits, safeVaultTotalYield, mockLidoTotalSupply, turboVaultTotalAssets, turboVaultTotalSupply]);

  if (!address) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded p-4">
        <div className="text-center text-gray-500 font-mono text-sm">
          <p>Connect wallet to view dashboard</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded p-4">
        <div className="text-center text-gray-500 font-mono text-sm">
          <p>Loading vault metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-mono text-white">VAULT DASHBOARD</h3>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-500 font-mono">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          {isRefreshing && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SafeVault Metrics - First in flow */}
        <div className="bg-gray-800 rounded p-3">
          <div className="text-xs text-gray-400 font-mono mb-2">SAFEVAULT</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Deposits:</span>
              <span className="text-white">{metrics?.safeVault.totalDeposits} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Yield:</span>
              <span className="text-green-400">{metrics?.safeVault.totalYield} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">stETH Shares:</span>
              <span className="text-blue-400">{metrics?.safeVault.stETHShares}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">stETH Balance:</span>
              <span className="text-blue-400">{metrics?.safeVault.stETHBalance} ETH</span>
            </div>
          </div>
        </div>

        {/* MockLido Metrics - Second in flow */}
        <div className="bg-gray-800 rounded p-3">
          <div className="text-xs text-gray-400 font-mono mb-2">MOCKLIDO</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Supply:</span>
              <span className="text-white">{metrics?.mockLido.totalSupply}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pooled ETH:</span>
              <span className="text-cyan-400">{metrics?.mockLido.pooledETH} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Shares:</span>
              <span className="text-cyan-400">{metrics?.mockLido.shares}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Exchange Rate:</span>
              <span className="text-cyan-400">
                {metrics?.mockLido.pooledETH && metrics?.mockLido.totalSupply 
                  ? (parseFloat(metrics.mockLido.pooledETH) / parseFloat(metrics.mockLido.totalSupply)).toFixed(6)
                  : '0.000000'
                }
              </span>
            </div>
          </div>
        </div>

        {/* TurboVault Metrics - Third in flow */}
        <div className="bg-gray-800 rounded p-3">
          <div className="text-xs text-gray-400 font-mono mb-2">TURBOVAULT</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Assets:</span>
              <span className="text-white">{metrics?.turboVault.totalAssets} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Supply:</span>
              <span className="text-purple-400">{metrics?.turboVault.totalSupply}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Shares:</span>
              <span className="text-purple-400">{metrics?.turboVault.shares}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Asset Balance:</span>
              <span className="text-white">{metrics?.turboVault.assetBalance} ETH</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="text-center">
            <div className="text-gray-500">Total System ETH</div>
            <div className="text-white text-sm">
              {metrics ? (
                (parseFloat(metrics.safeVault.totalDeposits) + 
                 parseFloat(metrics.turboVault.totalAssets) + 
                 parseFloat(metrics.mockLido.pooledETH)).toFixed(6)
              ) : '0.000000'} ETH
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Generated Yield</div>
            <div className="text-green-400 text-sm">
              {metrics?.safeVault.totalYield || '0.000000'} ETH
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Yield Rate</div>
            <div className="text-yellow-400 text-sm">
              {metrics?.safeVault.totalDeposits && metrics?.safeVault.totalYield
                ? ((parseFloat(metrics.safeVault.totalYield) / parseFloat(metrics.safeVault.totalDeposits)) * 100).toFixed(4)
                : '0.0000'
              }%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
