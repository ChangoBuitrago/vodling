import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { useWeb3Context } from '../contexts/Web3Context';
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
    compoundingEfficiency: string;
  };
  mockLido: {
    totalETHStaked: string;
    totalStETHMinted: string;
    exchangeRate: string;
  };
  eigenLayer: {
    totalStaked: string;
    totalValue: string;
    userShares: string;
    userValue: string;
    userRewards: string;
    restakingEfficiency: string;
  };
}

const Dashboard: React.FC = () => {
  const { address } = useAccount();
  const { safeVaultContract, mockLidoContract } = useContract();
  const { turboVaultState, eigenLayerState } = useWeb3Context();
  const [metrics, setMetrics] = useState<VaultMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Format values for better readability
  const formatValue = (value: string | undefined, unit: string = '', isRate: boolean = false): string => {
    if (!value) return `0${unit}`;
    
    const numValue = parseFloat(value);
    if (numValue === 0) return `0${unit}`;
    
    // For rates (like exchange rates), show more precision
    if (isRate) {
      if (numValue >= 1000) {
        return `${(numValue / 1000).toFixed(2)}K${unit}`;
      } else if (numValue >= 1) {
        return `${numValue.toFixed(4)}${unit}`;
      } else {
        return `${numValue.toFixed(6)}${unit}`;
      }
    }
    
    // For regular values
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(2)}M${unit}`;
    } else if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(2)}K${unit}`;
    } else if (numValue >= 1) {
      return `${numValue.toFixed(4)}${unit}`;
    } else {
      return `${numValue.toFixed(6)}${unit}`;
    }
  };

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
          compoundingEfficiency: '0.0000',
        },
        mockLido: {
          totalETHStaked: '0.0',
          totalStETHMinted: '0.0',
          exchangeRate: '1.0',
        },
        eigenLayer: {
          totalStaked: '0.0',
          totalValue: '0.0',
          userShares: '0.0',
          userValue: '0.0',
          userRewards: '0.0',
          restakingEfficiency: '0.0000',
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

  // Debug logging for TurboVault
  useEffect(() => {
    console.log('Dashboard - TurboVault Debug:', {
      turboVaultState,
      isLoading: turboVaultState.isLoading
    });
  }, [turboVaultState]);

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
      turboVaultState,
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

    const compoundedYield = formatEther(turboVaultState.totalAssets);
    const vaultSharesMinted = formatEther(turboVaultState.totalSupply);
    
    // Calculate value per share: total assets / total shares
    // This represents the current value of each share
    const valuePerShare = vaultSharesMinted && compoundedYield && parseFloat(vaultSharesMinted) > 0
      ? (parseFloat(compoundedYield) / parseFloat(vaultSharesMinted)).toFixed(6)
      : '1.000000';
    
    // Calculate TurboVault APY based on share value appreciation
    // This represents the yield generated by TurboVault operations
    const turboVaultAPY = parseFloat(vaultSharesMinted) > 0 
      ? ((parseFloat(valuePerShare) - 1.0) * 100).toFixed(2)
      : '0.00';
    
    // Debug logging for TurboVault APY calculation
    console.log('Dashboard - TurboVault APY Calculation:');
    console.log(`  - Total Assets: ${compoundedYield} ETH`);
    console.log(`  - Total Supply: ${vaultSharesMinted} shares`);
    console.log(`  - Value per Share: ${valuePerShare}`);
    console.log(`  - TurboVault APY: ${turboVaultAPY}%`);
    console.log(`  - Calculation: (${valuePerShare} - 1.0) × 100 = ${turboVaultAPY}%`);

    // EigenLayer calculations
    const totalStaked = formatEther(eigenLayerState.totalStaked);
    const totalValue = formatEther(eigenLayerState.totalValue);
    
    // TurboVault holds all EigenLayer shares, not individual users
    const userShares = '0.0000'; // TurboVault holds all shares
    const userValue = '0.0000';   // Users don't have direct EigenLayer shares
    const userRewards = '0.0000'; // Users get rewards through TurboVault shares
    
    // Calculate EigenLayer APY based on value appreciation
    // This represents the yield generated by EigenLayer restaking
    const eigenLayerAPY = parseFloat(totalStaked) > 0 
      ? (((parseFloat(totalValue) - parseFloat(totalStaked)) / parseFloat(totalStaked)) * 100).toFixed(2)
      : '0.00';

    console.log('Dashboard - EigenLayer APY Calculation:');
    console.log(`  - TurboVault Total Staked: ${totalStaked} shares`);
    console.log(`  - TurboVault Total Value: ${totalValue} ETH`);
    console.log(`  - User Shares: ${userShares} shares (TurboVault holds all)`);
    console.log(`  - User Value: ${userValue} ETH (users get rewards through TurboVault)`);
    console.log(`  - User Rewards: ${userRewards} ETH (users get rewards through TurboVault)`);
    console.log(`  - EigenLayer APY: ${eigenLayerAPY}%`);

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
          compoundingEfficiency: turboVaultAPY,
        },
      mockLido: {
        totalETHStaked,
        totalStETHMinted,
        exchangeRate,
      },
        eigenLayer: {
          totalStaked,
          totalValue,
          userShares,
          userValue,
          userRewards,
          restakingEfficiency: eigenLayerAPY,
        }
    }));
    setLastUpdated(new Date());
    setIsLoading(false);
  }, [safeVaultTotalDeposits, safeVaultTotalYield, safeVaultStETHShares, turboVaultState, eigenLayerState, mockLidoTotalSupply, mockLidoPooledETH]);

  // Show refreshing indicator when any data is being fetched
  useEffect(() => {
    const isAnyLoading = !safeVaultTotalDeposits || !safeVaultTotalYield || !mockLidoTotalSupply || turboVaultState.isLoading || eigenLayerState.isLoading;
    setIsRefreshing(isAnyLoading);
  }, [safeVaultTotalDeposits, safeVaultTotalYield, mockLidoTotalSupply, turboVaultState.isLoading, eigenLayerState.isLoading]);

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
          <div className="text-xs text-gray-400 font-mono mb-2">PRINCIPAL PROTECTION + REWARD OPTIMIZATION</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-gray-800/30 rounded p-3">
              <div className="text-gray-400 mb-1">Lido APY</div>
              <div className="text-green-400 text-sm font-bold">
                {metrics?.mockLido.exchangeRate && parseFloat(metrics.mockLido.exchangeRate) > 1.0
                  ? `${((parseFloat(metrics.mockLido.exchangeRate) - 1) * 100).toFixed(2)}%`
                  : '0.00%'
                }
              </div>
            </div>
            <div className="bg-gray-800/30 rounded p-3">
              <div className="text-gray-400 mb-1">Total Rewards</div>
              <div className="text-yellow-400 text-sm font-bold">{metrics?.safeVault.pendingHarvest} ETH</div>
            </div>
            <div className="bg-gray-800/30 rounded p-3">
              <div className="text-gray-400 mb-1">TurboVault APY</div>
              <div className="text-purple-400 text-sm font-bold">
                {metrics?.turboVault.compoundingEfficiency || '0.00'}%
              </div>
            </div>
            <div className="bg-gray-800/30 rounded p-3">
              <div className="text-gray-400 mb-1">EigenLayer APY</div>
              <div className="text-indigo-400 text-sm font-bold">
                {metrics?.eigenLayer.restakingEfficiency || '0.00'}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Value Flow Visualization - Scrollable */}
      <div className="pb-4">
        <div className="flex space-x-4 overflow-x-auto flow-panels-scroll pb-2 px-2">
          {/* SafeVault Panel */}
          <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-3 w-[380px] min-w-[380px] flex-shrink-0">
            <div className="mb-2">
              <h4 className="text-sm font-mono text-blue-300 font-semibold mb-1">SAFEVAULT</h4>
              <div className="text-xs text-gray-400 font-mono">Principal Protection + Reward Harvesting</div>
            </div>
            <div className="space-y-1 text-sm font-mono">
              <div className="bg-gray-800/50 rounded p-3 flex justify-between items-center">
                <span className="text-gray-400">Principal Deposited</span>
                <span className="text-white font-bold whitespace-nowrap">{formatValue(metrics?.safeVault.principalDeposited, ' ETH')}</span>
              </div>
              <div className="bg-gray-800/50 rounded p-3 flex justify-between items-center">
                <span className="text-gray-400">Current Holdings</span>
                <span className="text-blue-300 font-bold whitespace-nowrap">{formatValue(metrics?.safeVault.currentHoldings, ' ETH')}</span>
              </div>
              <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border border-yellow-500/40 rounded p-3 flex justify-between items-center">
                <div className="flex items-center whitespace-nowrap">
                  <div className="kpi-indicator pending mr-2"></div>
                  <span className="text-yellow-300">Pending Harvest</span>
                </div>
                <span className="text-yellow-200 font-bold whitespace-nowrap">{formatValue(metrics?.safeVault.pendingHarvest, ' ETH')}</span>
              </div>
            </div>
          </div>

          {/* Flow Connector */}
          <div className="flex items-center justify-center min-w-[40px]">
            <div className="flow-connector"></div>
          </div>

          {/* MockLido Panel */}
          <div className="bg-gradient-to-r from-cyan-900/20 to-cyan-800/20 border border-cyan-500/30 rounded-lg p-3 w-[380px] min-w-[380px] flex-shrink-0">
            <div className="mb-2">
              <h4 className="text-sm font-mono text-cyan-300 font-semibold mb-1">MOCKLIDO</h4>
              <div className="text-xs text-gray-400 font-mono">The Staking Engine</div>
            </div>
            <div className="space-y-1 text-sm font-mono">
              <div className="bg-gray-800/50 rounded p-3 flex justify-between items-center">
                <span className="text-gray-400">Total ETH Staked</span>
                <span className="text-white font-bold whitespace-nowrap">{formatValue(metrics?.mockLido.totalETHStaked, ' ETH')}</span>
              </div>
              <div className="bg-gray-800/50 rounded p-3 flex justify-between items-center">
                <span className="text-gray-400">Total stETH Minted</span>
                <span className="text-cyan-300 font-bold whitespace-nowrap">{formatValue(metrics?.mockLido.totalStETHMinted, ' stETH')}</span>
              </div>
              <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-500/40 rounded p-3 flex justify-between items-center">
                <div className="flex items-center whitespace-nowrap">
                  <div className="kpi-indicator active mr-2"></div>
                  <span className="text-green-300">Exchange Rate</span>
                </div>
                <span className="text-green-200 font-bold whitespace-nowrap">{formatValue(metrics?.mockLido.exchangeRate, '', true)}</span>
              </div>
            </div>
          </div>

          {/* Flow Connector */}
          <div className="flex items-center justify-center min-w-[40px]">
            <div className="flow-connector"></div>
          </div>

          {/* TurboVault Panel */}
          <div className="bg-gradient-to-r from-purple-900/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-3 w-[380px] min-w-[380px] flex-shrink-0">
            <div className="mb-2">
              <h4 className="text-sm font-mono text-purple-300 font-semibold mb-1">TURBOVAULT</h4>
              <div className="text-xs text-gray-400 font-mono">Reward Pool + EigenLayer Gateway</div>
            </div>
            <div className="space-y-1 text-sm font-mono">
              <div className="bg-gray-800/50 rounded p-3 flex justify-between items-center">
                <span className="text-gray-400">Compounded Yield</span>
                <span className="text-white font-bold whitespace-nowrap">{formatValue(metrics?.turboVault.compoundedYield, ' ETH')}</span>
              </div>
              <div className="bg-gray-800/50 rounded p-3 flex justify-between items-center">
                <span className="text-gray-400">Vault Shares Minted</span>
                <span className="text-purple-300 font-bold whitespace-nowrap">{formatValue(metrics?.turboVault.vaultSharesMinted, '')}</span>
              </div>
              <div className="bg-gradient-to-r from-orange-900/30 to-orange-800/30 border border-orange-500/40 rounded p-3 flex justify-between items-center">
                <div className="flex items-center whitespace-nowrap">
                  <div className="kpi-indicator efficiency mr-2"></div>
                  <span className="text-orange-300">Value per Share</span>
                </div>
                <span className="text-orange-200 font-bold whitespace-nowrap">{formatValue(metrics?.turboVault.valuePerShare, '', true)}</span>
              </div>
            </div>
          </div>

          {/* Flow Connector */}
          <div className="flex items-center justify-center min-w-[40px]">
            <div className="flow-connector"></div>
          </div>

          {/* EigenLayer Panel */}
          <div className="bg-gradient-to-r from-indigo-900/20 to-indigo-800/20 border border-indigo-500/30 rounded-lg p-3 w-[380px] min-w-[380px] flex-shrink-0">
            <div className="mb-2">
              <h4 className="text-sm font-mono text-indigo-300 font-semibold mb-1">EIGENLAYER</h4>
              <div className="text-xs text-gray-400 font-mono">Restaking Engine</div>
            </div>
            <div className="space-y-1 text-sm font-mono">
              <div className="bg-gray-800/50 rounded p-3 flex justify-between items-center">
                <span className="text-gray-400">Total Shares</span>
                <span className="text-white font-bold whitespace-nowrap">{formatValue(metrics?.eigenLayer.totalStaked, ' shares')}</span>
              </div>
              <div className="bg-gray-800/50 rounded p-3 flex justify-between items-center">
                <span className="text-gray-400">Total Value</span>
                <span className="text-indigo-300 font-bold whitespace-nowrap">{formatValue(metrics?.eigenLayer.totalValue, ' ETH')}</span>
              </div>
              <div className="bg-gradient-to-r from-pink-900/30 to-pink-800/30 border border-pink-500/40 rounded p-3 flex justify-between items-center">
                <div className="flex items-center whitespace-nowrap">
                  <div className="kpi-indicator efficiency mr-2"></div>
                  <span className="text-pink-300">APY</span>
                </div>
                <span className="text-pink-200 font-bold whitespace-nowrap">{formatValue(metrics?.eigenLayer.restakingEfficiency, '%')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
