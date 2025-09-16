import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { formatEther } from 'ethers';

interface VaultMetrics {
  safeVault: {
    principalDeposited: string;
    currentHoldings: string;
    pendingHarvest: string;
  };
  turboVault: {
    compoundedYield: string;
    vaultSharesMinted: string;
    valuePerShare: string;
  };
  mockLido: {
    totalETHStaked: string;
    totalStETHMinted: string;
    exchangeRate: string;
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
          principalDeposited: '0.0',
          currentHoldings: '0.0',
          pendingHarvest: '0.0',
        },
        turboVault: {
          compoundedYield: '0.0',
          vaultSharesMinted: '0.0',
          valuePerShare: '1.0',
        },
        mockLido: {
          totalETHStaked: '0.0',
          totalStETHMinted: '0.0',
          exchangeRate: '1.0',
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

    const principalDeposited = formatEther(typeof safeVaultTotalDeposits === 'bigint' ? safeVaultTotalDeposits : 0n);
    const totalYield = formatEther(typeof safeVaultTotalYield === 'bigint' ? safeVaultTotalYield : 0n);
    const currentHoldings = (parseFloat(principalDeposited) + parseFloat(totalYield)).toFixed(6);
    const pendingHarvest = totalYield; // This is the yield that will move to TurboVault

    const totalETHStaked = formatEther(typeof mockLidoPooledETH === 'bigint' ? mockLidoPooledETH : 0n);
    const totalStETHMinted = formatEther(typeof mockLidoTotalSupply === 'bigint' ? mockLidoTotalSupply : 0n);
    const exchangeRate = totalStETHMinted && totalETHStaked && parseFloat(totalStETHMinted) > 0 
      ? (parseFloat(totalETHStaked) / parseFloat(totalStETHMinted)).toFixed(6)
      : '1.000000';

    const compoundedYield = formatEther(typeof turboVaultTotalAssets === 'bigint' ? turboVaultTotalAssets : 0n);
    const vaultSharesMinted = formatEther(typeof turboVaultTotalSupply === 'bigint' ? turboVaultTotalSupply : 0n);
    const valuePerShare = vaultSharesMinted && compoundedYield && parseFloat(vaultSharesMinted) > 0
      ? (parseFloat(compoundedYield) / parseFloat(vaultSharesMinted)).toFixed(6)
      : '1.000000';

    setMetrics(prev => ({
      safeVault: {
        principalDeposited,
        currentHoldings,
        pendingHarvest,
      },
      turboVault: {
        compoundedYield,
        vaultSharesMinted,
        valuePerShare,
      },
      mockLido: {
        totalETHStaked,
        totalStETHMinted,
        exchangeRate,
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-mono text-white">PROTOCOL MONITORING DASHBOARD</h3>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-500 font-mono">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          {isRefreshing && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {/* System Health Summary */}
      <div className="mb-6 pb-4 border-b border-gray-700">
        <div className="text-center">
          <div className="text-xs text-gray-400 font-mono mb-2">SYSTEM HEALTH INDICATORS</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-gray-800/30 rounded p-3">
              <div className="text-gray-400 mb-1">Yield Generation Rate</div>
              <div className="text-green-400 text-sm font-bold">
                {metrics?.mockLido.exchangeRate && parseFloat(metrics.mockLido.exchangeRate) > 1.0
                  ? `${((parseFloat(metrics.mockLido.exchangeRate) - 1) * 100).toFixed(4)}%`
                  : '0.0000%'
                }
              </div>
            </div>
            <div className="bg-gray-800/30 rounded p-3">
              <div className="text-gray-400 mb-1">Pending Harvest</div>
              <div className="text-yellow-400 text-sm font-bold">{metrics?.safeVault.pendingHarvest} ETH</div>
            </div>
            <div className="bg-gray-800/30 rounded p-3">
              <div className="text-gray-400 mb-1">Compounding Efficiency</div>
              <div className="text-purple-400 text-sm font-bold">
                {metrics?.turboVault.valuePerShare && parseFloat(metrics.turboVault.valuePerShare) > 1.0
                  ? `${((parseFloat(metrics.turboVault.valuePerShare) - 1) * 100).toFixed(4)}%`
                  : '0.0000%'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Value Flow Visualization - Centered */}
      <div className="flex justify-center pb-4">
        <div className="flex space-x-4">
          {/* SafeVault Panel */}
          <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-3 w-[320px] flex-shrink-0">
            <div className="mb-2">
              <h4 className="text-sm font-mono text-blue-300 font-semibold mb-1">SAFEVAULT</h4>
              <div className="text-xs text-gray-400 font-mono">User Deposits & Yield Aggregation</div>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-gray-800/50 rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Principal Deposited</span>
                  <span className="text-white text-lg font-bold">{metrics?.safeVault.principalDeposited} ETH</span>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Holdings (stETH)</span>
                  <span className="text-blue-300 text-lg font-bold">{metrics?.safeVault.currentHoldings} ETH</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border border-yellow-500/40 rounded p-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="kpi-indicator pending mr-2"></div>
                    <span className="text-yellow-300">PENDING HARVEST (Yield)</span>
                  </div>
                  <span className="text-yellow-200 text-lg font-bold">{metrics?.safeVault.pendingHarvest} ETH</span>
                </div>
                <div className="text-xs text-yellow-400">This is the value that will move to the TurboVault</div>
              </div>
            </div>
          </div>

          {/* Flow Connector */}
          <div className="flex items-center justify-center min-w-[40px]">
            <div className="flow-connector"></div>
          </div>

          {/* MockLido Panel */}
          <div className="bg-gradient-to-r from-cyan-900/20 to-cyan-800/20 border border-cyan-500/30 rounded-lg p-3 w-[320px] flex-shrink-0">
            <div className="mb-2">
              <h4 className="text-sm font-mono text-cyan-300 font-semibold mb-1">MOCKLIDO</h4>
              <div className="text-xs text-gray-400 font-mono">The Staking Engine</div>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-gray-800/50 rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total ETH Staked</span>
                  <span className="text-white text-lg font-bold">{metrics?.mockLido.totalETHStaked} ETH</span>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total stETH Minted</span>
                  <span className="text-cyan-300 text-lg font-bold">{metrics?.mockLido.totalStETHMinted} stETH</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-500/40 rounded p-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="kpi-indicator active mr-2"></div>
                    <span className="text-green-300">Exchange Rate (stETH:ETH)</span>
                  </div>
                  <span className="text-green-200 text-lg font-bold">{metrics?.mockLido.exchangeRate}</span>
                </div>
                <div className="text-xs text-green-400">This is the key driver of yield</div>
              </div>
            </div>
          </div>

          {/* Flow Connector */}
          <div className="flex items-center justify-center min-w-[40px]">
            <div className="flow-connector"></div>
          </div>

          {/* TurboVault Panel */}
          <div className="bg-gradient-to-r from-purple-900/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-3 w-[320px] flex-shrink-0">
            <div className="mb-2">
              <h4 className="text-sm font-mono text-purple-300 font-semibold mb-1">TURBOVAULT</h4>
              <div className="text-xs text-gray-400 font-mono">The Compounding Engine</div>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-gray-800/50 rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Compounded Yield (stETH)</span>
                  <span className="text-white text-lg font-bold">{metrics?.turboVault.compoundedYield} ETH</span>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Vault Shares Minted</span>
                  <span className="text-purple-300 text-lg font-bold">{metrics?.turboVault.vaultSharesMinted}</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-900/30 to-orange-800/30 border border-orange-500/40 rounded p-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="kpi-indicator efficiency mr-2"></div>
                    <span className="text-orange-300">Value per Share</span>
                  </div>
                  <span className="text-orange-200 text-lg font-bold">{metrics?.turboVault.valuePerShare}</span>
                </div>
                <div className="text-xs text-orange-400">This will increase as the TurboVault strategy generates its own yield</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
