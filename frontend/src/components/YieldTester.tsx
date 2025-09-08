import React from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { useSafeVault } from '../hooks/useSafeVault';
import { Clock, TrendingUp } from 'lucide-react';

const YieldTester: React.FC = () => {
  const { isConnected } = useAccount();
  const { mockLidoContract } = useContract();
  const { refetchAllData } = useSafeVault();
  const { writeContract, data: updateYieldTx } = useWriteContract();
  const { writeContract: writeFastForward, data: fastForwardTx } = useWriteContract();

  // Wait for transactions
  const { isSuccess: isUpdateYieldSuccess } = useWaitForTransactionReceipt({
    hash: updateYieldTx,
  });

  const { isSuccess: isFastForwardSuccess } = useWaitForTransactionReceipt({
    hash: fastForwardTx,
  });

  // Refetch data when transactions complete
  React.useEffect(() => {
    if (isUpdateYieldSuccess || isFastForwardSuccess) {
      refetchAllData();
    }
  }, [isUpdateYieldSuccess, isFastForwardSuccess, refetchAllData]);

  const handleUpdateYield = async () => {
    if (!mockLidoContract?.address) return;
    
    try {
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
    if (!mockLidoContract?.address) return;
    
    try {
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Yield Testing</h3>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          For testing purposes, you can manually trigger yield updates or fast forward time.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={handleUpdateYield}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Update Yield
          </button>
          
          <button
            onClick={handleFastForward}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Clock className="h-4 w-4 inline mr-1" />
            +1 Day
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>• <strong>Update Yield:</strong> Manually trigger yield calculation</p>
          <p>• <strong>+1 Day:</strong> Fast forward time by 1 day (1% yield)</p>
        </div>
      </div>
    </div>
  );
};

export default YieldTester;
