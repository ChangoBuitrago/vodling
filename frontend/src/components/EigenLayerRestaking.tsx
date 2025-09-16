import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { formatEther } from 'ethers';

const EigenLayerRestaking: React.FC = () => {
  const { address } = useAccount();
  const { turboVaultContract, mockEigenLayerContract } = useContract();
  const { writeContract } = useWriteContract();
  const [isRestaking, setIsRestaking] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [restakeAmount, setRestakeAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Read user's TurboVault shares
  const { data: userTurboVaultShares, refetch: refetchTurboVaultShares } = useReadContract({
    address: turboVaultContract?.address as `0x${string}` | undefined,
    abi: turboVaultContract?.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!turboVaultContract?.address && !!address,
      refetchInterval: 5000
    }
  });

  // Read user's EigenLayer shares
  const { data: userEigenLayerShares, refetch: refetchEigenLayerShares } = useReadContract({
    address: mockEigenLayerContract?.address as `0x${string}` | undefined,
    abi: mockEigenLayerContract?.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!mockEigenLayerContract?.address && !!address,
      refetchInterval: 5000
    }
  });

  // Read user's EigenLayer value
  const { data: userEigenLayerValue, refetch: refetchEigenLayerValue } = useReadContract({
    address: mockEigenLayerContract?.address as `0x${string}` | undefined,
    abi: mockEigenLayerContract?.abi,
    functionName: 'getUserValue',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!mockEigenLayerContract?.address && !!address,
      refetchInterval: 5000
    }
  });

  // Read user's EigenLayer rewards
  const { data: userEigenLayerRewards, refetch: refetchEigenLayerRewards } = useReadContract({
    address: mockEigenLayerContract?.address as `0x${string}` | undefined,
    abi: mockEigenLayerContract?.abi,
    functionName: 'getUserRewards',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!mockEigenLayerContract?.address && !!address,
      refetchInterval: 5000
    }
  });

  // Read total EigenLayer staked
  const { data: totalEigenLayerStaked } = useReadContract({
    address: mockEigenLayerContract?.address as `0x${string}` | undefined,
    abi: mockEigenLayerContract?.abi,
    functionName: 'totalStaked',
    query: { 
      enabled: !!mockEigenLayerContract?.address,
      refetchInterval: 5000
    }
  });

  // Read total EigenLayer value
  const { data: totalEigenLayerValue } = useReadContract({
    address: mockEigenLayerContract?.address as `0x${string}` | undefined,
    abi: mockEigenLayerContract?.abi,
    functionName: 'getTotalValue',
    query: { 
      enabled: !!mockEigenLayerContract?.address,
      refetchInterval: 5000
    }
  });

  // Update timestamp when data changes
  useEffect(() => {
    setLastUpdated(new Date());
  }, [userTurboVaultShares, userEigenLayerShares, userEigenLayerValue, userEigenLayerRewards]);

  // Handle restaking to EigenLayer
  const handleRestake = async () => {
    if (!turboVaultContract?.address || !address || !restakeAmount) return;
    
    const sharesToRestake = BigInt(Math.floor(parseFloat(restakeAmount) * 1e18));
    if (sharesToRestake <= 0) return;
    
    setIsRestaking(true);
    try {
      const hash = await writeContract({
        address: turboVaultContract.address as `0x${string}`,
        abi: turboVaultContract.abi,
        functionName: 'restakeToEigenLayer',
        args: [sharesToRestake],
      });
      
      // Wait for transaction confirmation
      await new Promise((resolve, reject) => {
        const checkReceipt = async () => {
          try {
            resolve(hash);
          } catch (error) {
            reject(error);
          }
        };
        checkReceipt();
      });
      
      // Refetch data after successful restaking
      await Promise.all([
        refetchTurboVaultShares(),
        refetchEigenLayerShares(),
        refetchEigenLayerValue(),
        refetchEigenLayerRewards()
      ]);
      
      setRestakeAmount('');
    } catch (error) {
      console.error('Error restaking to EigenLayer:', error);
    } finally {
      setIsRestaking(false);
    }
  };

  // Handle withdrawing from EigenLayer
  const handleWithdraw = async () => {
    if (!mockEigenLayerContract?.address || !address || !withdrawAmount) return;
    
    const sharesToWithdraw = BigInt(Math.floor(parseFloat(withdrawAmount) * 1e18));
    if (sharesToWithdraw <= 0) return;
    
    setIsWithdrawing(true);
    try {
      const hash = await writeContract({
        address: mockEigenLayerContract.address as `0x${string}`,
        abi: mockEigenLayerContract.abi,
        functionName: 'unstake',
        args: [sharesToWithdraw],
      });
      
      // Wait for transaction confirmation
      await new Promise((resolve, reject) => {
        const checkReceipt = async () => {
          try {
            resolve(hash);
          } catch (error) {
            reject(error);
          }
        };
        checkReceipt();
      });
      
      // Refetch data after successful withdrawal
      await Promise.all([
        refetchTurboVaultShares(),
        refetchEigenLayerShares(),
        refetchEigenLayerValue(),
        refetchEigenLayerRewards()
      ]);
      
      setWithdrawAmount('');
    } catch (error) {
      console.error('Error withdrawing from EigenLayer:', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Format values for display
  const formatValue = (value: string): string => {
    const numValue = parseFloat(value);
    if (numValue === 0) return '0.000000';
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(2)}K`;
    } else if (numValue >= 1) {
      return `${numValue.toFixed(4)}`;
    } else {
      return `${numValue.toFixed(6)}`;
    }
  };

  if (!address) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded p-4">
        <div className="text-center text-gray-500 font-mono text-sm">
          <p>Connect wallet to manage EigenLayer restaking</p>
        </div>
      </div>
    );
  }

  const turboVaultShares = formatEther(userTurboVaultShares || 0n);
  const eigenLayerShares = formatEther(userEigenLayerShares || 0n);
  const eigenLayerValue = formatEther(userEigenLayerValue || 0n);
  const eigenLayerRewards = formatEther(userEigenLayerRewards || 0n);
  const totalStaked = formatEther(totalEigenLayerStaked || 0n);
  const totalValue = formatEther(totalEigenLayerValue || 0n);

  const hasTurboVaultShares = parseFloat(turboVaultShares) > 0;
  const hasEigenLayerShares = parseFloat(eigenLayerShares) > 0;

  // Calculate restaking efficiency
  const restakingEfficiency = parseFloat(totalStaked) > 0 
    ? (((parseFloat(totalValue) - parseFloat(totalStaked)) / parseFloat(totalStaked)) * 100).toFixed(4)
    : '0.0000';

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-mono text-white">EIGENLAYER RESTAKING</h3>
        <div className="text-xs text-gray-500 font-mono">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      <div className="space-y-4">
        {/* User's Holdings */}
        <div className="bg-gray-800/50 rounded p-3">
          <div className="text-xs text-gray-400 font-mono mb-2">YOUR HOLDINGS</div>
          <div className="grid grid-cols-2 gap-4 text-sm font-mono">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">TurboVault Shares</span>
              <span className="text-white font-bold">
                {formatValue(turboVaultShares)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">EigenLayer Shares</span>
              <span className="text-indigo-300 font-bold">
                {formatValue(eigenLayerShares)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">EigenLayer Value</span>
              <span className="text-indigo-300 font-bold">
                {formatValue(eigenLayerValue)} ETH
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">EigenLayer Rewards</span>
              <span className="text-pink-300 font-bold">
                {formatValue(eigenLayerRewards)} ETH
              </span>
            </div>
          </div>
        </div>

        {/* Restake to EigenLayer */}
        {hasTurboVaultShares && (
          <div className="bg-gradient-to-r from-indigo-900/20 to-indigo-800/20 border border-indigo-500/30 rounded p-3">
            <div className="text-xs text-indigo-300 font-mono mb-2">RESTAKE TO EIGENLAYER</div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={restakeAmount}
                  onChange={(e) => setRestakeAmount(e.target.value)}
                  placeholder="Amount to restake"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                  step="0.000001"
                  min="0"
                />
                <button
                  onClick={handleRestake}
                  disabled={!restakeAmount || isRestaking || parseFloat(restakeAmount) > parseFloat(turboVaultShares)}
                  className={`px-4 py-2 rounded font-mono text-sm font-bold transition-all duration-200 ${
                    restakeAmount && !isRestaking && parseFloat(restakeAmount) <= parseFloat(turboVaultShares)
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isRestaking ? 'Restaking...' : 'RESTAKE'}
                </button>
              </div>
              <div className="text-xs text-gray-400 font-mono">
                Available: {formatValue(turboVaultShares)} shares
              </div>
            </div>
          </div>
        )}

        {/* Withdraw from EigenLayer */}
        {hasEigenLayerShares && (
          <div className="bg-gradient-to-r from-pink-900/20 to-pink-800/20 border border-pink-500/30 rounded p-3">
            <div className="text-xs text-pink-300 font-mono mb-2">WITHDRAW FROM EIGENLAYER</div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Amount to withdraw"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-pink-500"
                  step="0.000001"
                  min="0"
                />
                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || isWithdrawing || parseFloat(withdrawAmount) > parseFloat(eigenLayerShares)}
                  className={`px-4 py-2 rounded font-mono text-sm font-bold transition-all duration-200 ${
                    withdrawAmount && !isWithdrawing && parseFloat(withdrawAmount) <= parseFloat(eigenLayerShares)
                      ? 'bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isWithdrawing ? 'Withdrawing...' : 'WITHDRAW'}
                </button>
              </div>
              <div className="text-xs text-gray-400 font-mono">
                Available: {formatValue(eigenLayerShares)} shares
              </div>
            </div>
          </div>
        )}

        {/* EigenLayer Stats */}
        <div className="bg-gray-800/50 rounded p-3">
          <div className="text-xs text-gray-400 font-mono mb-2">EIGENLAYER STATS</div>
          <div className="grid grid-cols-2 gap-4 text-sm font-mono">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Staked</span>
              <span className="text-white font-bold">
                {formatValue(totalStaked)} ETH
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Value</span>
              <span className="text-white font-bold">
                {formatValue(totalValue)} ETH
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Restaking Efficiency</span>
              <span className="text-green-300 font-bold">
                {restakingEfficiency}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Your Rewards</span>
              <span className="text-pink-300 font-bold">
                {formatValue(eigenLayerRewards)} ETH
              </span>
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
          <div className="text-xs text-blue-300 font-mono mb-2">RESTAKING BENEFITS</div>
          <div className="text-xs text-gray-400 font-mono space-y-1">
            <p>• Earn additional rewards on top of Lido staking</p>
            <p>• Participate in EigenLayer's restaking ecosystem</p>
            <p>• Maintain liquidity with TurboVault shares</p>
            <p>• Withdraw anytime back to TurboVault</p>
          </div>
        </div>

        {/* No Holdings Message */}
        {!hasTurboVaultShares && !hasEigenLayerShares && (
          <div className="text-center text-gray-500 font-mono text-sm py-8">
            <p>No TurboVault shares to restake</p>
            <p className="text-xs mt-2">Claim yield shares first to start restaking</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EigenLayerRestaking;
