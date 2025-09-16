import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useWatchContractEvent, useWriteContract, useWaitForTransactionReceipt, useBlockNumber } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { useWeb3Context } from '../contexts/Web3Context';
import { formatEther } from 'ethers';

interface LogEntry {
  id: string;
  timestamp: Date;
  blockNumber: number;
  type: 'yield_harvested' | 'deposit' | 'test_action' | 'error';
  message: string;
  data?: any;
  txHash?: string;
}

const TestingTools: React.FC = () => {
  const { address } = useAccount();
  const { safeVaultContract, mockLidoContract } = useContract();
  const { refreshTurboVault } = useWeb3Context();
  const { data: blockNumber } = useBlockNumber();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Contract write hooks
  const { writeContract: writeSafeVault, data: harvestTxHash, isPending: isHarvestPending } = useWriteContract();
  const { writeContract: writeMockLido, data: fastForwardTx, isPending: isFastForwardPending } = useWriteContract();
  
  // Wait for transactions
  const { isLoading: isHarvestConfirming } = useWaitForTransactionReceipt({
    hash: harvestTxHash,
  });
  
  const { isSuccess: isFastForwardSuccess } = useWaitForTransactionReceipt({
    hash: fastForwardTx,
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
          message: `YieldHarvested: ${yieldAmount} ETH`,
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
          message: `Deposit: ${user.slice(0, 8)}...${user.slice(-6)} → ${amount} ETH`,
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
        message: 'Harvesting yield to TurboVault...',
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

  // Handle fast forward completion
  useEffect(() => {
    if (isFastForwardSuccess) {
      addLogEntry({
        type: 'test_action',
        message: '✅ 1% yield generated in MockLido',
        data: { action: 'fast_forward_complete' }
      });
    }
  }, [isFastForwardSuccess, addLogEntry]);

  // Handle harvest transaction completion
  useEffect(() => {
    if (harvestTxHash && !isHarvestConfirming && !isHarvestPending) {
      addLogEntry({
        type: 'test_action',
        message: `✅ Yield harvested to TurboVault - TX: ${harvestTxHash.slice(0, 10)}...`,
        data: { transactionHash: harvestTxHash }
      });
      
      // Refresh TurboVault data to update the Dashboard
      refreshTurboVault().then(() => {
        addLogEntry({
          type: 'test_action',
          message: '🔄 Dashboard data refreshed',
          data: { action: 'dashboard_refresh' }
        });
      }).catch((error) => {
        console.error('Error refreshing TurboVault data:', error);
        addLogEntry({
          type: 'error',
          message: `Failed to refresh Dashboard: ${error}`,
          data: { error: true }
        });
      });
      
      setIsHarvesting(false);
    }
  }, [harvestTxHash, isHarvestConfirming, isHarvestPending, addLogEntry, refreshTurboVault]);

  // Timeout mechanism to prevent harvest from getting stuck
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
        {/* Workflow Controls */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4">
          <div className="mb-4">
            <h3 className="text-sm font-mono text-white font-semibold mb-1">WORKFLOW</h3>
            <div className="text-xs text-gray-400 font-mono">Generate Yield • Harvest to TurboVault</div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={generateYield}
              disabled={!mockLidoContract?.address || isFastForwardPending}
              className="w-full px-4 py-3 rounded text-sm font-mono bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 disabled:bg-gray-700/50 disabled:border-gray-600 disabled:cursor-not-allowed text-blue-300 hover:text-blue-200 disabled:text-gray-400 transition-colors"
            >
              {isFastForwardPending ? 'Generating...' : 'Generate Yield'}
            </button>
            
            <button
              onClick={harvestToTurboVault}
              disabled={!safeVaultContract?.address || isHarvesting || isHarvestPending || isHarvestConfirming}
              className="w-full px-4 py-3 rounded text-sm font-mono bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 hover:border-green-500/50 disabled:bg-gray-700/50 disabled:border-gray-600 disabled:cursor-not-allowed text-green-300 hover:text-green-200 disabled:text-gray-400 transition-colors"
            >
              {isHarvesting || isHarvestPending || isHarvestConfirming ? (
                isHarvestPending ? 'Submitting...' : isHarvestConfirming ? 'Confirming...' : 'Harvesting...'
              ) : (
                'Harvest to TurboVault'
              )}
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4">
          <div className="mb-3">
            <h3 className="text-sm font-mono text-white font-semibold mb-1">STATUS</h3>
            <div className="text-xs text-gray-400 font-mono">System Monitoring</div>
          </div>
          
          <div className="text-xs text-gray-400 font-mono space-y-2">
            <div>Block: {blockNumber ? Number(blockNumber) : 'N/A'}</div>
            <div>Events: {logs.length}</div>
            <div className="text-green-300">Monitoring: Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingTools;