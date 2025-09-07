import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { useContract } from './useContract';
import { parseEther } from 'ethers';

export const useSafeVault = () => {
  const { address } = useAccount();
  const { safeVaultContract } = useContract();

  // Read functions
  const { data: principalBalance = 0n } = useContractRead({
    address: safeVaultContract?.address,
    abi: safeVaultContract?.abi,
    functionName: 'getUserPrincipal',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  const { data: yieldBalance = 0n } = useContractRead({
    address: safeVaultContract?.address,
    abi: safeVaultContract?.abi,
    functionName: 'getUserYield',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  const { data: totalBalance = 0n } = useContractRead({
    address: safeVaultContract?.address,
    abi: safeVaultContract?.abi,
    functionName: 'getUserTotalBalance',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  const { data: totalPrincipal = 0n } = useContractRead({
    address: safeVaultContract?.address,
    abi: safeVaultContract?.abi,
    functionName: 'totalPrincipal',
  });

  const { data: totalYield = 0n } = useContractRead({
    address: safeVaultContract?.address,
    abi: safeVaultContract?.abi,
    functionName: 'getTotalYield',
  });

  const { data: ethPrice = 0n } = useContractRead({
    address: safeVaultContract?.address,
    abi: safeVaultContract?.abi,
    functionName: 'getETHPrice',
  });

  const { data: minDeposit = parseEther('0.01') } = useContractRead({
    address: safeVaultContract?.address,
    abi: safeVaultContract?.abi,
    functionName: 'minDeposit',
  });

  const { data: maxDeposit = parseEther('1000') } = useContractRead({
    address: safeVaultContract?.address,
    abi: safeVaultContract?.abi,
    functionName: 'maxDeposit',
  });

  // Write functions
  const { write: depositWrite, data: depositTx } = useContractWrite({
    address: safeVaultContract?.address,
    abi: safeVaultContract?.abi,
    functionName: 'deposit',
  });

  const { write: withdrawPrincipalWrite, data: withdrawPrincipalTx } = useContractWrite({
    address: safeVaultContract?.address,
    abi: safeVaultContract?.abi,
    functionName: 'withdrawPrincipal',
  });

  const { write: withdrawYieldWrite, data: withdrawYieldTx } = useContractWrite({
    address: safeVaultContract?.address,
    abi: safeVaultContract?.abi,
    functionName: 'withdrawYield',
  });

  // Wait for transactions
  const { isLoading: isDepositLoading } = useWaitForTransaction({
    hash: depositTx?.hash,
  });

  const { isLoading: isWithdrawPrincipalLoading } = useWaitForTransaction({
    hash: withdrawPrincipalTx?.hash,
  });

  const { isLoading: isWithdrawYieldLoading } = useWaitForTransaction({
    hash: withdrawYieldTx?.hash,
  });

  const isLoading = isDepositLoading || isWithdrawPrincipalLoading || isWithdrawYieldLoading;

  const deposit = async (amount: bigint) => {
    depositWrite({
      args: [amount],
      value: amount,
    });
  };

  const withdrawPrincipal = async (amount: bigint) => {
    withdrawPrincipalWrite({
      args: [amount],
    });
  };

  const withdrawYield = async (amount: bigint) => {
    withdrawYieldWrite({
      args: [amount],
    });
  };

  return {
    principalBalance,
    yieldBalance,
    totalBalance,
    totalPrincipal,
    totalYield,
    ethPrice,
    minDeposit,
    maxDeposit,
    deposit,
    withdrawPrincipal,
    withdrawYield,
    isLoading,
  };
};
