import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useContract } from './useContract';
import { useWeb3Context } from '../contexts/Web3Context';
import { parseEther } from 'ethers';
import { useState, useEffect, useCallback } from 'react';

export const useEigenLayer = () => {
  const { mockEigenLayerContract, turboVaultContract } = useContract();
  const { eigenLayerState, refreshEigenLayer } = useWeb3Context();
  
  // Loading states
  const [isStakePending, setIsStakePending] = useState(false);
  const [isUnstakePending, setIsUnstakePending] = useState(false);
  const [isRestakePending, setIsRestakePending] = useState(false);
  const [isWithdrawPending, setIsWithdrawPending] = useState(false);

  // Write functions
  const { writeContract: writeStake, data: stakeTx, isPending: isStakeWriting } = useWriteContract();
  const { writeContract: writeUnstake, data: unstakeTx, isPending: isUnstakeWriting } = useWriteContract();
  const { writeContract: writeRestake, data: restakeTx, isPending: isRestakeWriting } = useWriteContract();
  const { writeContract: writeWithdraw, data: withdrawTx, isPending: isWithdrawWriting } = useWriteContract();
  
  // Wait for transactions
  const { isLoading: isStakeConfirming, isSuccess: isStakeSuccess } = useWaitForTransactionReceipt({
    hash: stakeTx,
    timeout: 60000,
  });
  
  const { isLoading: isUnstakeConfirming, isSuccess: isUnstakeSuccess } = useWaitForTransactionReceipt({
    hash: unstakeTx,
    timeout: 60000,
  });

  const { isLoading: isRestakeConfirming, isSuccess: isRestakeSuccess } = useWaitForTransactionReceipt({
    hash: restakeTx,
    timeout: 60000,
  });

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawTx,
    timeout: 60000,
  });
  
  // Direct stake function (for direct stETH staking)
  const stake = useCallback(async (amount: string) => {
    if (!mockEigenLayerContract?.address) return;
    
    try {
      setIsStakePending(true);
      writeStake({
        address: mockEigenLayerContract.address as `0x${string}`,
        abi: mockEigenLayerContract.abi,
        functionName: 'stake',
        args: [parseEther(amount)],
      });
    } catch (error) {
      console.error('Error staking to EigenLayer:', error);
    }
  }, [mockEigenLayerContract, writeStake]);
  
  // Direct unstake function (for direct stETH unstaking)
  const unstake = useCallback(async (shares: string) => {
    if (!mockEigenLayerContract?.address) return;
    
    try {
      setIsUnstakePending(true);
      writeUnstake({
        address: mockEigenLayerContract.address as `0x${string}`,
        abi: mockEigenLayerContract.abi,
        functionName: 'unstake',
        args: [parseEther(shares)],
      });
    } catch (error) {
      console.error('Error unstaking from EigenLayer:', error);
    }
  }, [mockEigenLayerContract, writeUnstake]);

  // Restake TurboVault shares to EigenLayer
  const restakeToEigenLayer = useCallback(async (shares: string) => {
    if (!turboVaultContract?.address) {
      console.error('TurboVault contract not available');
      return;
    }
    
    try {
      setIsRestakePending(true);
      console.log(`Restaking ${shares} shares to EigenLayer...`);
      writeRestake({
        address: turboVaultContract.address as `0x${string}`,
        abi: turboVaultContract.abi,
        functionName: 'restakeToEigenLayer',
        args: [parseEther(shares)],
      });
    } catch (error) {
      console.error('Error restaking to EigenLayer:', error);
      setIsRestakePending(false);
    }
  }, [turboVaultContract, writeRestake]);

  // Withdraw from EigenLayer back to TurboVault
  const withdrawFromEigenLayer = useCallback(async (shares: string) => {
    if (!turboVaultContract?.address) {
      console.error('TurboVault contract not available');
      return;
    }
    
    try {
      setIsWithdrawPending(true);
      console.log(`Withdrawing ${shares} shares from EigenLayer...`);
      writeWithdraw({
        address: turboVaultContract.address as `0x${string}`,
        abi: turboVaultContract.abi,
        functionName: 'withdrawFromEigenLayer',
        args: [parseEther(shares)],
      });
    } catch (error) {
      console.error('Error withdrawing from EigenLayer:', error);
      setIsWithdrawPending(false);
    }
  }, [turboVaultContract, writeWithdraw]);
  
  // Handle transaction completion
  useEffect(() => {
    if (stakeTx && !isStakeConfirming && isStakeSuccess) {
      setIsStakePending(false);
      refreshEigenLayer();
    }
  }, [stakeTx, isStakeConfirming, isStakeSuccess, refreshEigenLayer]);
  
  useEffect(() => {
    if (unstakeTx && !isUnstakeConfirming && isUnstakeSuccess) {
      setIsUnstakePending(false);
      refreshEigenLayer();
    }
  }, [unstakeTx, isUnstakeConfirming, isUnstakeSuccess, refreshEigenLayer]);

  useEffect(() => {
    if (restakeTx && !isRestakeConfirming && isRestakeSuccess) {
      setIsRestakePending(false);
      refreshEigenLayer();
    }
  }, [restakeTx, isRestakeConfirming, isRestakeSuccess, refreshEigenLayer]);

  useEffect(() => {
    if (withdrawTx && !isWithdrawConfirming && isWithdrawSuccess) {
      setIsWithdrawPending(false);
      refreshEigenLayer();
    }
  }, [withdrawTx, isWithdrawConfirming, isWithdrawSuccess, refreshEigenLayer]);
  
  return {
    // State
    eigenLayerState,
    
    // Functions
    stake,
    unstake,
    restakeToEigenLayer,
    withdrawFromEigenLayer,
    refreshEigenLayer,
    
    // Loading states
    isStakeLoading: isStakePending || isStakeWriting,
    isUnstakeLoading: isUnstakePending || isUnstakeWriting,
    isRestakeLoading: isRestakePending || isRestakeWriting,
    isWithdrawLoading: isWithdrawPending || isWithdrawWriting,
    
    // Transaction states
    stakeTx,
    unstakeTx,
    restakeTx,
    withdrawTx,
    isStakeSuccess,
    isUnstakeSuccess,
    isRestakeSuccess,
    isWithdrawSuccess,
  };
};
