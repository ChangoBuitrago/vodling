import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useWatchContractEvent, useWriteContract, useWaitForTransactionReceipt, useBlockNumber, useReadContract } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { useWeb3Context } from '../contexts/Web3Context';
import { formatEther } from 'ethers';

interface LogEntry {
  id: string;
  timestamp: Date;
  blockNumber: number;
  type: 'yield_harvested' | 'deposit' | 'test_action' | 'error' | 'admin_action';
  message: string;
  data?: any;
  txHash?: string;
}

const TestingTools: React.FC = () => {
  const { address } = useAccount();
  const { safeVaultContract, mockLidoContract, turboVaultContract } = useContract();
  const { refreshTurboVault, refreshEigenLayer, eigenLayerState } = useWeb3Context();
  const { data: blockNumber } = useBlockNumber();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [isRestaking, setIsRestaking] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Read TurboVault total assets to show available for restaking
  const { data: turboVaultTotalAssets, refetch: refetchTurboVaultAssets } = useReadContract({
    address: turboVaultContract?.address as `0x${string}` | undefined,
    abi: turboVaultContract?.abi,
    functionName: 'totalAssets',
    query: {
      enabled: !!turboVaultContract?.address,
    },
  });

  // Read TurboVault total supply
  const { data: turboVaultTotalSupply, refetch: refetchTurboVaultSupply } = useReadContract({
    address: turboVaultContract?.address as `0x${string}` | undefined,
    abi: turboVaultContract?.abi,
    functionName: 'totalSupply',
    query: {
      enabled: !!turboVaultContract?.address,
    },
  });

  // Contract write hooks
  const { writeContract: writeSafeVault, data: harvestTxHash, isPending: isHarvestPending } = useWriteContract();
  const { writeContract: writeMockLido, data: fastForwardTx, isPending: isFastForwardPending } = useWriteContract();
  const { writeContract: writeTurboVault, data: restakeTxHash, isPending: isRestakePending } = useWriteContract();
  const { writeContract: writeTurboVaultWithdraw, data: withdrawTxHash, isPending: isWithdrawPending } = useWriteContract();
  
  // Wait for transactions
  const { isLoading: isHarvestConfirming } = useWaitForTransactionReceipt({
    hash: harvestTxHash,
  });
  
  const { isSuccess: isFastForwardSuccess } = useWaitForTransactionReceipt({
    hash: fastForwardTx,
  });

  const { isLoading: isRestakeConfirming } = useWaitForTransactionReceipt({
    hash: restakeTxHash,
  });

  const { isLoading: isWithdrawConfirming } = useWaitForTransactionReceipt({
    hash: withdrawTxHash,
  });

  // Auto-scroll to bottom when new logs are added
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Listen for YieldHarvested events from SafeVault
  useWatchContractEvent({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    eventName: 'YieldHarvested',
    onLogs(logs) {
      logs.forEach((log) => {
        if (!log.args.timestamp || !log.args.yieldAmount) return;
        
        const timestamp = new Date(Number(log.args.timestamp) * 1000);
        const yieldAmount = formatEther(log.args.yieldAmount);
        
        const newLog: LogEntry = {
          id: `${log.transactionHash}-${log.logIndex}`,
          timestamp,
          blockNumber: Number(log.blockNumber),
          type: 'yield_harvested',
          message: `YieldHarvested: ${yieldAmount} ETH → TurboVault`,
          data: {
            yieldAmount: log.args.yieldAmount,
            timestamp: log.args.timestamp,
          },
          txHash: log.transactionHash,
        };
        
        setLogs(prev => [...prev, newLog]);
      });
    },
    enabled: !!safeVaultContract?.address,
  });

  // Listen for Deposit events from SafeVault
  useWatchContractEvent({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    eventName: 'Deposit',
    onLogs(logs) {
      logs.forEach((log) => {
        if (!log.args.amount || !log.args.user) return;
        
        const timestamp = new Date();
        const amount = formatEther(log.args.amount);
        const user = log.args.user;
        
        const newLog: LogEntry = {
          id: `${log.transactionHash}-${log.logIndex}`,
          timestamp,
          blockNumber: Number(log.blockNumber),
          type: 'deposit',
          message: `Deposit: ${user.slice(0, 8)}...${user.slice(-6)} → ${amount} ETH (Principal Protected)`,
          data: {
            user: log.args.user,
            amount: log.args.amount,
            stETHShares: log.args.stETHShares,
          },
          txHash: log.transactionHash,
        };
        
        setLogs(prev => [...prev, newLog]);
      });
    },
    enabled: !!safeVaultContract?.address,
  });

  // Listen for YieldClaimed events from SafeVault
  useWatchContractEvent({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    eventName: 'YieldClaimed',
    onLogs(logs) {
      logs.forEach((log) => {
        if (!log.args.user || !log.args.amount) return;
        
        const timestamp = new Date();
        const amount = formatEther(log.args.amount);
        const user = log.args.user;
        
        const newLog: LogEntry = {
          id: `${log.transactionHash}-${log.logIndex}`,
          timestamp,
          blockNumber: Number(log.blockNumber),
          type: 'test_action',
          message: `YieldClaimed: ${user.slice(0, 8)}...${user.slice(-6)} → ${amount} shares (Lido + EigenLayer rewards)`,
          data: {
            user: log.args.user,
            amount: log.args.amount,
          },
          txHash: log.transactionHash,
        };
        
        setLogs(prev => [...prev, newLog]);
      });
    },
    enabled: !!safeVaultContract?.address,
  });

  const addLogEntry = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp' | 'blockNumber'>) => {
    const newLog: LogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      blockNumber: blockNumber ? Number(blockNumber) : 0,
    };
    setLogs(prev => [...prev, newLog]);
  }, [blockNumber]);

  const clearLogs = () => {
    setLogs([]);
  };

  const generateYield = async () => {
    if (!mockLidoContract?.address) return;
    
    try {
      addLogEntry({
        type: 'test_action',
        message: 'Generating 1% yield in MockLido...',
        data: { action: 'generate_yield' }
      });

      await writeMockLido({
        address: mockLidoContract.address as `0x${string}`,
        abi: mockLidoContract.abi,
        functionName: 'fastForwardTime',
        args: [86400n], // 1 day in seconds
      });
      
    } catch (error) {
      console.error('Error generating yield:', error);
      addLogEntry({
        type: 'error',
        message: `Failed to generate yield: ${error}`,
        data: { error: true }
      });
    }
  };

  const harvestToTurboVault = async () => {
    if (!safeVaultContract?.address || !address) return;
    
    setIsHarvesting(true);
    
    try {
      addLogEntry({
        type: 'test_action',
        message: 'Harvesting Lido rewards to TurboVault...',
        data: { action: 'harvest_start' }
      });
      
      await writeSafeVault({
        address: safeVaultContract.address as `0x${string}`,
        abi: safeVaultContract?.abi,
        functionName: 'harvestYield',
      });
      
    } catch (error) {
      console.error('Error harvesting:', error);
      addLogEntry({
        type: 'error',
        message: `Harvest failed: ${error instanceof Error ? error.message : String(error)}`,
        data: { error: true }
      });
      setIsHarvesting(false);
    }
  };

  const restakeToEigenLayer = async () => {
    if (!turboVaultContract?.address || !turboVaultTotalAssets) return;
    
    setIsRestaking(true);
    
    try {
      // Restake 50% of available assets to EigenLayer
      const restakeAmount = turboVaultTotalAssets / 2n;
      
      addLogEntry({
        type: 'admin_action',
        message: `Admin restaking ${formatEther(restakeAmount)} ETH to EigenLayer...`,
        data: { action: 'restake_start', amount: restakeAmount }
      });
      
      await writeTurboVault({
        address: turboVaultContract.address as `0x${string}`,
        abi: turboVaultContract.abi,
        functionName: 'restakeToEigenLayer',
        args: [restakeAmount],
      });
      
    } catch (error) {
      console.error('Error restaking to EigenLayer:', error);
      addLogEntry({
        type: 'error',
        message: `Restake failed: ${error instanceof Error ? error.message : String(error)}`,
        data: { error: true }
      });
      setIsRestaking(false);
    }
  };

  const withdrawFromEigenLayer = async () => {
    if (!turboVaultContract?.address) return;
    
    setIsWithdrawing(true);
    
    try {
      // Withdraw all EigenLayer shares (this would need to be tracked in a real implementation)
      const withdrawShares = 1000n; // Mock amount - in real implementation, track EigenLayer shares
      
      addLogEntry({
        type: 'admin_action',
        message: `Admin withdrawing from EigenLayer...`,
        data: { action: 'withdraw_start', shares: withdrawShares }
      });
      
      await writeTurboVaultWithdraw({
        address: turboVaultContract.address as `0x${string}`,
        abi: turboVaultContract.abi,
        functionName: 'withdrawFromEigenLayer',
        args: [withdrawShares],
      });
      
    } catch (error) {
      console.error('Error withdrawing from EigenLayer:', error);
      addLogEntry({
        type: 'error',
        message: `Withdraw failed: ${error instanceof Error ? error.message : String(error)}`,
        data: { error: true }
      });
      setIsWithdrawing(false);
    }
  };

  // Handle fast forward completion
  useEffect(() => {
    if (isFastForwardSuccess) {
      addLogEntry({
        type: 'test_action',
        message: '✅ 1% yield generated in MockLido (Principal protected)',
        data: { action: 'fast_forward_complete' }
      });
    }
  }, [isFastForwardSuccess, addLogEntry]);

  // Handle harvest transaction completion
  useEffect(() => {
    if (harvestTxHash && !isHarvestConfirming && !isHarvestPending) {
      addLogEntry({
        type: 'test_action',
        message: `✅ Lido rewards harvested to TurboVault - TX: ${harvestTxHash.slice(0, 10)}...`,
        data: { transactionHash: harvestTxHash }
      });
      
      // Refresh TurboVault data
      Promise.all([
        refreshTurboVault(),
        refetchTurboVaultAssets(),
        refetchTurboVaultSupply()
      ]).then(() => {
        addLogEntry({
          type: 'test_action',
          message: '🔄 TurboVault data refreshed',
          data: { action: 'dashboard_refresh' }
        });
      }).catch((error) => {
        console.error('Error refreshing TurboVault data:', error);
        addLogEntry({
          type: 'error',
          message: `Failed to refresh TurboVault: ${error}`,
          data: { error: true }
        });
      });
      
      setIsHarvesting(false);
    }
  }, [harvestTxHash, isHarvestConfirming, isHarvestPending, addLogEntry, refreshTurboVault, refetchTurboVaultAssets, refetchTurboVaultSupply]);

  // Handle restake transaction completion
  useEffect(() => {
    if (restakeTxHash && !isRestakeConfirming && !isRestakePending) {
      addLogEntry({
        type: 'admin_action',
        message: `✅ TurboVault assets restaked to EigenLayer - TX: ${restakeTxHash.slice(0, 10)}...`,
        data: { transactionHash: restakeTxHash }
      });
      
      // Refresh both TurboVault and EigenLayer data
      Promise.all([refreshTurboVault(), refreshEigenLayer()]).then(() => {
        addLogEntry({
          type: 'admin_action',
          message: '🔄 Dashboard data refreshed after restaking',
          data: { action: 'dashboard_refresh_restake' }
        });
      }).catch((error) => {
        console.error('Error refreshing data after restaking:', error);
        addLogEntry({
          type: 'error',
          message: `Failed to refresh Dashboard after restaking: ${error}`,
          data: { error: true }
        });
      });
      
      setIsRestaking(false);
    }
  }, [restakeTxHash, isRestakeConfirming, isRestakePending, addLogEntry, refreshTurboVault, refreshEigenLayer]);

  // Handle withdraw transaction completion
  useEffect(() => {
    if (withdrawTxHash && !isWithdrawConfirming && !isWithdrawPending) {
      addLogEntry({
        type: 'admin_action',
        message: `✅ EigenLayer assets withdrawn to TurboVault - TX: ${withdrawTxHash.slice(0, 10)}...`,
        data: { transactionHash: withdrawTxHash }
      });
      
      // Refresh both TurboVault and EigenLayer data
      Promise.all([refreshTurboVault(), refreshEigenLayer()]).then(() => {
        addLogEntry({
          type: 'admin_action',
          message: '🔄 Dashboard data refreshed after withdrawal',
          data: { action: 'dashboard_refresh_withdraw' }
        });
      }).catch((error) => {
        console.error('Error refreshing data after withdrawal:', error);
        addLogEntry({
          type: 'error',
          message: `Failed to refresh Dashboard after withdrawal: ${error}`,
          data: { error: true }
        });
      });
      
      setIsWithdrawing(false);
    }
  }, [withdrawTxHash, isWithdrawConfirming, isWithdrawPending, addLogEntry, refreshTurboVault, refreshEigenLayer]);

  // Timeout mechanism to prevent operations from getting stuck
  useEffect(() => {
    if (isHarvesting) {
      const timeout = setTimeout(() => {
        addLogEntry({
          type: 'error',
          message: 'Harvest timeout - transaction may have failed',
          data: { error: true }
        });
        setIsHarvesting(false);
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isHarvesting, addLogEntry]);

  const formatLogEntry = (log: LogEntry) => {
    const timeStr = log.timestamp.toISOString().substr(11, 12);
    const typeColor = log.type === 'yield_harvested' ? 'text-green-300' : 
                     log.type === 'deposit' ? 'text-blue-300' : 
                     log.type === 'admin_action' ? 'text-purple-300' :
                     log.type === 'error' ? 'text-red-300' : 'text-yellow-300';
    
    return (
      <div key={log.id} className="flex items-start space-x-2 p-2 bg-gray-800/30 border-l-2 border-gray-600 hover:border-gray-500 hover:bg-gray-800/50 transition-colors">
        <div className="text-xs text-gray-400 font-mono w-14 flex-shrink-0">
          {timeStr}
        </div>
        <div className="text-xs text-gray-400 font-mono w-10 flex-shrink-0">
          #{log.blockNumber}
        </div>
        <div className={`text-xs font-mono ${typeColor} flex-1 leading-relaxed`}>
          {log.message}
        </div>
        {log.txHash && (
          <div className="text-xs text-gray-500 font-mono flex-shrink-0">
            {log.txHash.slice(0, 8)}...
          </div>
        )}
      </div>
    );
  };

  if (!address) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 font-mono text-sm">
          <p>Connect wallet to access testing tools</p>
        </div>
      </div>
    );
  }

  const turboVaultAssets = formatEther(turboVaultTotalAssets || 0n);
  const turboVaultSupply = formatEther(turboVaultTotalSupply || 0n);
  const hasAssetsToRestake = parseFloat(turboVaultAssets) > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-full">
      {/* Event Logger Section - Left Column (3/5 width) */}
      <div className="lg:col-span-3 bg-gray-900 border border-gray-700 rounded p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h3 className="text-sm font-mono text-white font-semibold mb-1">EVENT LOG</h3>
            <div className="text-xs text-gray-400 font-mono ml-2">Real-time Protocol Events</div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={scrollToBottom}
              className="px-3 py-1 rounded text-xs font-mono bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              title="Scroll to bottom"
            >
              ↓
            </button>
            <button
              onClick={clearLogs}
              className="px-3 py-1 rounded text-xs font-mono bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              CLEAR
            </button>
          </div>
        </div>

        <div className="mb-3">
          <div className="text-xs text-gray-500 font-mono">
            Block: {blockNumber ? Number(blockNumber) : 'N/A'} • Events: {logs.length} • Status: ACTIVE
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border border-gray-700 rounded bg-gray-950 max-h-96 event-log-scroll">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono">
              <div className="text-center">
                <p>No events</p>
                <p className="text-gray-700 mt-1">Event monitoring active</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {logs.slice(-50).map(formatLogEntry)} {/* Show last 50 events */}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Stacked Sections */}
      <div className="lg:col-span-2 flex flex-col space-y-4">
        {/* Core Workflow Controls */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4">
          <div className="mb-4">
            <h3 className="text-sm font-mono text-white font-semibold mb-1">CORE WORKFLOW</h3>
            <div className="text-xs text-gray-400 font-mono">Generate Yield • Harvest to TurboVault</div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={generateYield}
              disabled={!mockLidoContract?.address || isFastForwardPending}
              className="w-full px-4 py-3 rounded text-sm font-mono bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 disabled:bg-gray-700/50 disabled:border-gray-600 disabled:cursor-not-allowed text-blue-300 hover:text-blue-200 disabled:text-gray-400 transition-colors"
            >
              {isFastForwardPending ? 'Generating...' : 'Generate 1% Yield (Lido)'}
            </button>
            
            <button
              onClick={harvestToTurboVault}
              disabled={!safeVaultContract?.address || isHarvesting || isHarvestPending || isHarvestConfirming}
              className="w-full px-4 py-3 rounded text-sm font-mono bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 hover:border-green-500/50 disabled:bg-gray-700/50 disabled:border-gray-600 disabled:cursor-not-allowed text-green-300 hover:text-green-200 disabled:text-gray-400 transition-colors"
            >
              {isHarvesting || isHarvestPending || isHarvestConfirming ? (
                isHarvestPending ? 'Submitting...' : isHarvestConfirming ? 'Confirming...' : 'Harvesting...'
              ) : (
                'Harvest Lido Rewards → TurboVault'
              )}
            </button>
          </div>
        </div>

        {/* Admin EigenLayer Controls */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4">
          <div className="mb-4">
            <h3 className="text-sm font-mono text-white font-semibold mb-1">ADMIN CONTROLS</h3>
            <div className="text-xs text-gray-400 font-mono">TurboVault → EigenLayer Restaking</div>
            <button
              onClick={() => {
                refetchTurboVaultAssets();
                refetchTurboVaultSupply();
                refreshEigenLayer();
                addLogEntry({
                  type: 'test_action',
                  message: '🔄 Manually refreshed TurboVault and EigenLayer data',
                  data: { action: 'manual_refresh' }
                });
              }}
              className="mt-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-gray-300 hover:text-white transition-colors"
            >
              Refresh Data
            </button>
          </div>
          
          <div className="space-y-3">
            {/* TurboVault Info */}
            <div className="text-xs text-gray-400 font-mono space-y-1 bg-gray-800/30 rounded p-2">
              <div>TurboVault Assets: {turboVaultAssets} ETH</div>
              <div>TurboVault Shares: {turboVaultSupply}</div>
              <div>EigenLayer Total: {formatEther(eigenLayerState.totalStaked)} ETH</div>
            </div>
            
            <button
              onClick={restakeToEigenLayer}
              disabled={isRestaking || isRestakePending || isRestakeConfirming || !hasAssetsToRestake}
              className="w-full px-4 py-3 rounded text-sm font-mono bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 disabled:bg-gray-700/50 disabled:border-gray-600 disabled:cursor-not-allowed text-indigo-300 hover:text-indigo-200 disabled:text-gray-400 transition-colors"
            >
              {isRestaking || isRestakePending || isRestakeConfirming ? 'Restaking...' : 
               !hasAssetsToRestake ? 'No Assets to Restake' : 
               'Restake 50% to EigenLayer'}
            </button>
            
            <button
              onClick={withdrawFromEigenLayer}
              disabled={isWithdrawing || isWithdrawPending || isWithdrawConfirming}
              className="w-full px-4 py-3 rounded text-sm font-mono bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 hover:border-pink-500/50 disabled:bg-gray-700/50 disabled:border-gray-600 disabled:cursor-not-allowed text-pink-300 hover:text-pink-200 disabled:text-gray-400 transition-colors"
            >
              {isWithdrawing || isWithdrawPending || isWithdrawConfirming ? 'Withdrawing...' : 
               'Withdraw from EigenLayer'}
            </button>
          </div>
        </div>

        {/* Flow Information */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4">
          <div className="mb-3">
            <h3 className="text-sm font-mono text-white font-semibold mb-1">FLOW STATUS</h3>
            <div className="text-xs text-gray-400 font-mono">Current Architecture</div>
          </div>
          
          <div className="text-xs text-gray-400 font-mono space-y-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              <span>Principal: Protected in Lido</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span>Lido Rewards: → TurboVault</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
              <span>EigenLayer: Admin-managed</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
              <span>Users: Claim combined rewards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingTools;