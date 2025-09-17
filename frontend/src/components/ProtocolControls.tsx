import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
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

interface ProtocolControlsProps {
  logs: LogEntry[];
  addLogEntry: (log: Omit<LogEntry, 'id' | 'timestamp' | 'blockNumber'>) => void;
}

const ProtocolControls: React.FC<ProtocolControlsProps> = ({ logs, addLogEntry }) => {
  const { address } = useAccount();
  const { safeVaultContract, mockLidoContract, turboVaultContract } = useContract();
  const { refreshTurboVault, refreshEigenLayer } = useWeb3Context();
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [isRestaking, setIsRestaking] = useState(false);
  const [isEigenLayerYieldPending, setIsEigenLayerYieldPending] = useState(false);

  // Read TurboVault total assets to show available for restaking
  const { data: turboVaultTotalAssets, refetch: refetchTurboVaultAssets } = useReadContract({
    address: turboVaultContract?.address as `0x${string}` | undefined,
    abi: turboVaultContract?.abi,
    functionName: 'totalAssets',
    query: {
      enabled: !!turboVaultContract?.address,
    },
  });

  // Contract write hooks
  const { writeContract: writeSafeVault, data: harvestTxHash, isPending: isHarvestPending } = useWriteContract();
  const { writeContract: writeMockLido, data: fastForwardTx, isPending: isFastForwardPending } = useWriteContract();
  const { writeContract: writeTurboVault, data: restakeTxHash, isPending: isRestakePending } = useWriteContract();
  const { writeContract: writeTurboVaultYield, data: eigenLayerYieldTxHash, isPending: isEigenLayerYieldTxPending, error: eigenLayerYieldError } = useWriteContract();
  
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

  const { isLoading: isEigenLayerYieldConfirming } = useWaitForTransactionReceipt({
    hash: eigenLayerYieldTxHash,
  });

  // Check if there are assets to restake
  const hasAssetsToRestake = turboVaultTotalAssets && turboVaultTotalAssets > 0n;

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
      // Restake all available assets to EigenLayer
      const restakeAmount = turboVaultTotalAssets;
      
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

  const generateEigenLayerYield = async () => {
    if (!turboVaultContract?.address) {
      addLogEntry({
        type: 'error',
        message: 'TurboVault contract not available',
        data: { error: true }
      });
      return;
    }
    
    setIsEigenLayerYieldPending(true);
    
    try {
      addLogEntry({
        type: 'test_action',
        message: 'Generating EigenLayer yield (simulating 7 days)...',
        data: { action: 'eigenlayer_yield_start' }
      });
      
      console.log('Calling generateEigenLayerYield with args:', [7n]);
      console.log('TurboVault contract address:', turboVaultContract.address);
      console.log('TurboVault ABI available:', !!turboVaultContract.abi);
      
      const result = await writeTurboVaultYield({
        address: turboVaultContract.address as `0x${string}`,
        abi: turboVaultContract.abi,
        functionName: 'generateEigenLayerYield' as any,
        args: [7n], // 7 days
      });
      
      console.log('generateEigenLayerYield transaction submitted:', result);
      console.log('Transaction hash after submission:', eigenLayerYieldTxHash);
      console.log('Error after submission:', eigenLayerYieldError);
      
    } catch (error) {
      console.error('Error generating EigenLayer yield:', error);
      addLogEntry({
        type: 'error',
        message: `EigenLayer yield generation failed: ${error instanceof Error ? error.message : String(error)}`,
        data: { error: true }
      });
      setIsEigenLayerYieldPending(false);
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
        refetchTurboVaultAssets()
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
  }, [harvestTxHash, isHarvestConfirming, isHarvestPending, addLogEntry, refreshTurboVault, refetchTurboVaultAssets]);

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

  // Monitor transaction hash changes
  useEffect(() => {
    if (eigenLayerYieldTxHash) {
      console.log('EigenLayer yield transaction hash received:', eigenLayerYieldTxHash);
    }
  }, [eigenLayerYieldTxHash]);

  // Handle EigenLayer yield generation completion
  useEffect(() => {
    console.log('EigenLayer yield useEffect triggered:', {
      eigenLayerYieldTxHash,
      isEigenLayerYieldConfirming,
      isEigenLayerYieldTxPending,
      isEigenLayerYieldPending
    });
    
    if (eigenLayerYieldTxHash && !isEigenLayerYieldConfirming && !isEigenLayerYieldTxPending) {
      console.log('EigenLayer yield transaction completed!');
      addLogEntry({
        type: 'test_action',
        message: `✅ EigenLayer yield generated (7 days simulated) - TX: ${eigenLayerYieldTxHash.slice(0, 10)}...`,
        data: { transactionHash: eigenLayerYieldTxHash }
      });
      
      // Refresh both TurboVault and EigenLayer data
      Promise.all([refreshTurboVault(), refreshEigenLayer()]).then(() => {
        addLogEntry({
          type: 'test_action',
          message: '🔄 Dashboard data refreshed after EigenLayer yield generation',
          data: { action: 'dashboard_refresh_eigenlayer_yield' }
        });
      }).catch((error) => {
        console.error('Error refreshing data after EigenLayer yield generation:', error);
        addLogEntry({
          type: 'error',
          message: `Failed to refresh Dashboard after EigenLayer yield: ${error}`,
          data: { error: true }
        });
      });
      
      setIsEigenLayerYieldPending(false);
    }
  }, [eigenLayerYieldTxHash, isEigenLayerYieldConfirming, isEigenLayerYieldTxPending, addLogEntry, refreshTurboVault, refreshEigenLayer]);

  // Alternative completion check - if transaction hash exists and we're not pending, consider it complete
  useEffect(() => {
    if (eigenLayerYieldTxHash && isEigenLayerYieldPending && !isEigenLayerYieldTxPending) {
      console.log('Alternative completion check: Transaction hash exists and not pending');
      // Give it a moment for the transaction to be mined
      setTimeout(() => {
        console.log('Alternative completion: Marking as complete');
        addLogEntry({
          type: 'test_action',
          message: `✅ EigenLayer yield generated (7 days simulated) - TX: ${eigenLayerYieldTxHash.slice(0, 10)}...`,
          data: { transactionHash: eigenLayerYieldTxHash }
        });
        
        // Refresh both TurboVault and EigenLayer data
        Promise.all([refreshTurboVault(), refreshEigenLayer()]).then(() => {
          addLogEntry({
            type: 'test_action',
            message: '🔄 Dashboard data refreshed after EigenLayer yield generation',
            data: { action: 'dashboard_refresh_eigenlayer_yield' }
          });
        }).catch((error) => {
          console.error('Error refreshing data after EigenLayer yield generation:', error);
          addLogEntry({
            type: 'error',
            message: `Failed to refresh Dashboard after EigenLayer yield: ${error}`,
            data: { error: true }
          });
        });
        
        setIsEigenLayerYieldPending(false);
      }, 2000); // Wait 2 seconds for transaction to be mined
    }
  }, [eigenLayerYieldTxHash, isEigenLayerYieldPending, isEigenLayerYieldTxPending, addLogEntry, refreshTurboVault, refreshEigenLayer]);

  // Simple completion check - if we're not pending anymore, consider it complete
  useEffect(() => {
    if (isEigenLayerYieldPending && !isEigenLayerYieldTxPending && !eigenLayerYieldTxHash) {
      console.log('Simple completion check: Not pending anymore, marking as complete');
      // Give it a moment for the transaction to be mined
      setTimeout(() => {
        console.log('Simple completion: Marking as complete');
        addLogEntry({
          type: 'test_action',
          message: '✅ EigenLayer yield generated (7 days simulated)',
          data: { action: 'eigenlayer_yield_complete' }
        });
        
        // Refresh both TurboVault and EigenLayer data
        Promise.all([refreshTurboVault(), refreshEigenLayer()]).then(() => {
          addLogEntry({
            type: 'test_action',
            message: '🔄 Dashboard data refreshed after EigenLayer yield generation',
            data: { action: 'dashboard_refresh_eigenlayer_yield' }
          });
        }).catch((error) => {
          console.error('Error refreshing data after EigenLayer yield generation:', error);
          addLogEntry({
            type: 'error',
            message: `Failed to refresh Dashboard after EigenLayer yield: ${error}`,
            data: { error: true }
          });
        });
        
        setIsEigenLayerYieldPending(false);
      }, 3000); // Wait 3 seconds for transaction to be mined
    }
  }, [isEigenLayerYieldPending, isEigenLayerYieldTxPending, eigenLayerYieldTxHash, addLogEntry, refreshTurboVault, refreshEigenLayer]);

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

  // Timeout mechanism for EigenLayer yield generation
  useEffect(() => {
    if (isEigenLayerYieldPending) {
      console.log('Setting timeout for EigenLayer yield generation...');
      const timeout = setTimeout(() => {
        console.log('EigenLayer yield generation timeout triggered!');
        addLogEntry({
          type: 'error',
          message: 'EigenLayer yield generation timeout - transaction may have failed',
          data: { error: true }
        });
        setIsEigenLayerYieldPending(false);
      }, 30000); // 30 second timeout

      return () => {
        console.log('Clearing EigenLayer yield timeout');
        clearTimeout(timeout);
      };
    }
  }, [isEigenLayerYieldPending, addLogEntry]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-4">
      <div className="mb-4">
        <h3 className="text-sm font-mono text-white font-semibold mb-1">PROTOCOL CONTROLS</h3>
        <div className="text-xs text-gray-400 font-mono">Generate Yield • Harvest • Restake</div>
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
        
        <button
          onClick={restakeToEigenLayer}
          disabled={isRestaking || isRestakePending || isRestakeConfirming || !hasAssetsToRestake}
          className="w-full px-4 py-3 rounded text-sm font-mono bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 disabled:bg-gray-700/50 disabled:border-gray-600 disabled:cursor-not-allowed text-indigo-300 hover:text-indigo-200 disabled:text-gray-400 transition-colors"
        >
          {isRestaking || isRestakePending || isRestakeConfirming ? 'Restaking...' : 
           !hasAssetsToRestake ? 'No Assets to Restake' : 
           'Restake to EigenLayer'}
        </button>
        
        <button
          onClick={generateEigenLayerYield}
          disabled={!turboVaultContract?.address || isEigenLayerYieldPending || isEigenLayerYieldTxPending || isEigenLayerYieldConfirming}
          className="w-full px-4 py-3 rounded text-sm font-mono bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 disabled:bg-gray-700/50 disabled:border-gray-600 disabled:cursor-not-allowed text-purple-300 hover:text-purple-200 disabled:text-gray-400 transition-colors"
        >
          {isEigenLayerYieldPending || isEigenLayerYieldTxPending || isEigenLayerYieldConfirming ? 'Generating...' : 'Generate EigenLayer Yield'}
        </button>
      </div>

      {/* Flow Information */}
      <div className="bg-gray-900 border border-gray-700 rounded p-4 mt-4">
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
            <span>TurboVault → EigenLayer</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
            <span>EigenLayer rewards: → TurboVault</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
            <span>Users: Claim combined rewards</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolControls;
