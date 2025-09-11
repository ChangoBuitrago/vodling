import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { useSafeVault } from '../hooks/useSafeVault';

const YieldTester: React.FC = () => {
  const { isConnected } = useAccount();
  const { mockLidoContract } = useContract();
  const { refetchAllData, yieldBalance } = useSafeVault();
  const { writeContract, data: updateYieldTx, isPending: isUpdateYieldPending } = useWriteContract();
  const { writeContract: writeFastForward, data: fastForwardTx, isPending: isFastForwardPending } = useWriteContract();
  const [lastYieldUpdate, setLastYieldUpdate] = useState<Date | null>(null);

  // Wait for transactions
  const { isSuccess: isUpdateYieldSuccess } = useWaitForTransactionReceipt({
    hash: updateYieldTx,
  });

  const { isSuccess: isFastForwardSuccess } = useWaitForTransactionReceipt({
    hash: fastForwardTx,
  });

  // Refetch data when transactions complete
  React.useEffect(() => {
    if (isUpdateYieldSuccess) {
      console.log('Yield update successful, refetching data...');
      setLastYieldUpdate(new Date());
      refetchAllData();
    }
  }, [isUpdateYieldSuccess, refetchAllData]);

  React.useEffect(() => {
    if (isFastForwardSuccess) {
      console.log('Fast forward successful, refetching data...');
      setLastYieldUpdate(new Date());
      refetchAllData();
    }
  }, [isFastForwardSuccess, refetchAllData]);

  const handleUpdateYield = async () => {
    if (!mockLidoContract?.address) {
      console.error('MockLido contract not available');
      return;
    }
    
    try {
      console.log('Updating yield...');
      await writeContract({
        address: mockLidoContract.address as `0x${string}`,
        abi: mockLidoContract.abi,
        functionName: 'updateYield',
      });
    } catch (error) {
      console.error('Failed to update yield:', error);
    }
  };

  const handleFastForward = async () => {
    if (!mockLidoContract?.address) {
      console.error('MockLido contract not available');
      return;
    }
    
    try {
      console.log('Fast forwarding time...');
      // Fast forward 1 day (86400 seconds)
      await writeFastForward({
        address: mockLidoContract.address as `0x${string}`,
        abi: mockLidoContract.abi,
        functionName: 'fastForwardTime',
        args: [BigInt(86400)], // 1 day in seconds
      });
    } catch (error) {
      console.error('Failed to fast forward time:', error);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="space-y-6">
        <p className="text-sm text-gray-400">
          For testing purposes, you can manually trigger yield updates or fast forward time to simulate yield generation.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleUpdateYield}
            disabled={isUpdateYieldPending}
            className="btn-primary w-full py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center">
              {isUpdateYieldPending ? (
                <i className="fas fa-spinner fa-spin mr-2"></i>
              ) : (
                <i className="fas fa-sync-alt mr-2"></i>
              )}
              {isUpdateYieldPending ? 'Updating...' : 'Update Yield'}
            </span>
          </button>
          
          <button
            onClick={handleFastForward}
            disabled={isFastForwardPending}
            className="btn-secondary w-full py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center">
              {isFastForwardPending ? (
                <i className="fas fa-spinner fa-spin mr-2"></i>
              ) : (
                <i className="fas fa-clock mr-2"></i>
              )}
              {isFastForwardPending ? 'Fast Forwarding...' : 'Fast Forward +1 Day'}
            </span>
          </button>
        </div>

        {/* Yield Status */}
        <div className="glass-effect p-4 border border-vodl-500/20">
          <h4 className="text-sm font-medium text-vodl-400 mb-2 flex items-center">
            <i className="fas fa-chart-line mr-2"></i>
            Current Yield Balance
          </h4>
          <p className="text-lg font-bold text-gradient-green">
            {yieldBalance ? (Number(yieldBalance) / 1e18).toFixed(6) : '0.000000'} ETH
          </p>
          {lastYieldUpdate && (
            <p className="text-xs text-gray-400 mt-2">
              Last updated: {lastYieldUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className="glass-effect p-4 border border-indigo-500/20">
          <h4 className="text-sm font-medium text-indigo-400 mb-3 flex items-center">
            <i className="fas fa-info-circle mr-2"></i>
            Testing Functions:
          </h4>
          <div className="text-xs text-gray-300 space-y-2">
            <div className="flex items-start">
              <i className="fas fa-sync-alt text-indigo-400 mr-2 mt-0.5 text-xs"></i>
              <span><strong>Update Yield:</strong> Manually trigger yield calculation</span>
            </div>
            <div className="flex items-start">
              <i className="fas fa-clock text-indigo-400 mr-2 mt-0.5 text-xs"></i>
              <span><strong>+1 Day:</strong> Fast forward time by 1 day (simulates 1% yield)</span>
            </div>
          </div>
        </div>
    </div>
  );
};

export default YieldTester;
