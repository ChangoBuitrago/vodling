import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { useContract } from '../hooks/useContract';
import { useWeb3Context } from '../contexts/Web3Context';
import { formatEther } from 'ethers';

const ClaimYield: React.FC = () => {
  const { address } = useAccount();
  const { safeVaultContract } = useContract();
  const { writeContract } = useWriteContract();
  const { refreshBalance, refreshTurboVault, refreshEigenLayer } = useWeb3Context();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimableShares, setClaimableShares] = useState<string>('0');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Read claimable yield shares
  const { data: claimableSharesData, refetch: refetchClaimable } = useReadContract({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getClaimableYieldShares',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!safeVaultContract?.address && !!address,
      refetchInterval: 5000 // Refetch every 5 seconds
    }
  });

  // Read user's principal balance to show their stake
  const { data: userPrincipal } = useReadContract({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'getUserPrincipal',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!safeVaultContract?.address && !!address,
      refetchInterval: 5000
    }
  });

  // Read total principal to show user's share percentage
  const { data: totalPrincipal } = useReadContract({
    address: safeVaultContract?.address as `0x${string}` | undefined,
    abi: safeVaultContract?.abi,
    functionName: 'totalPrincipal',
    query: { 
      enabled: !!safeVaultContract?.address,
      refetchInterval: 5000
    }
  });

  // Update claimable shares when data changes
  useEffect(() => {
    if (claimableSharesData !== undefined) {
      const shares = formatEther(typeof claimableSharesData === 'bigint' ? claimableSharesData : 0n);
      setClaimableShares(shares);
      setLastUpdated(new Date());
    }
  }, [claimableSharesData]);

  // Handle claim transaction
  const handleClaim = async () => {
    if (!safeVaultContract?.address || !address) return;
    
    setIsClaiming(true);
    try {
      const hash = await writeContract({
        address: safeVaultContract.address as `0x${string}`,
        abi: safeVaultContract.abi,
        functionName: 'claimYieldShares',
      });
      
      // Wait for transaction confirmation
      await new Promise((resolve, reject) => {
        const checkReceipt = async () => {
          try {
            // The transaction will be handled by wagmi's useWaitForTransactionReceipt
            resolve(hash);
          } catch (error) {
            reject(error);
          }
        };
        checkReceipt();
      });
      
      // Refetch data after successful claim
      await refetchClaimable();
      
      // Refresh all global state to update dashboard and other components
      await Promise.all([
        refreshBalance(),
        refreshTurboVault(),
        refreshEigenLayer()
      ]);
      
      // Show success message
      setClaimSuccess(true);
      setTimeout(() => setClaimSuccess(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error('Error claiming yield shares:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  // Calculate user's share percentage
  const userSharePercentage = userPrincipal && totalPrincipal && parseFloat(formatEther(totalPrincipal)) > 0
    ? ((parseFloat(formatEther(userPrincipal)) / parseFloat(formatEther(totalPrincipal))) * 100).toFixed(2)
    : '0.00';

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
          <p>Connect wallet to claim yield shares</p>
        </div>
      </div>
    );
  }

  const hasClaimableShares = parseFloat(claimableShares) > 0;
  const hasPrincipal = userPrincipal && parseFloat(formatEther(userPrincipal)) > 0;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-mono text-white">CLAIM YIELD SHARES</h3>
        <div className="text-xs text-gray-500 font-mono">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {!hasPrincipal ? (
        <div className="text-center text-gray-500 font-mono text-sm py-8">
          <p>No principal deposited</p>
          <p className="text-xs mt-2">Deposit ETH to start earning yield shares</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* User's Stake Information */}
          <div className="bg-gray-800/50 rounded p-3">
            <div className="text-xs text-gray-400 font-mono mb-2">YOUR STAKE</div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-mono text-sm">Principal Deposited</span>
              <span className="text-white font-bold font-mono">
                {formatValue(formatEther(userPrincipal))} ETH
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-300 font-mono text-sm">Share of Vault</span>
              <span className="text-blue-300 font-bold font-mono">
                {userSharePercentage}%
              </span>
            </div>
          </div>

          {/* Claimable Shares */}
          <div className={`rounded p-3 ${hasClaimableShares 
            ? 'bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-500/40' 
            : 'bg-gray-800/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {hasClaimableShares && (
                  <div className="kpi-indicator active mr-2"></div>
                )}
                <span className={`font-mono text-sm ${hasClaimableShares ? 'text-green-300' : 'text-gray-400'}`}>
                  Claimable TurboVault Shares
                </span>
              </div>
              <span className={`font-bold font-mono ${hasClaimableShares ? 'text-green-200' : 'text-gray-500'}`}>
                {formatValue(claimableShares)}
              </span>
            </div>
          </div>

          {/* Success Message */}
          {claimSuccess && (
            <div className="bg-green-900/30 border border-green-500/50 rounded p-3 mb-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <span className="text-green-300 font-mono text-sm">
                  ✅ Yield shares claimed successfully! Dashboard updated.
                </span>
              </div>
            </div>
          )}

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={!hasClaimableShares || isClaiming}
            className={`w-full py-3 px-4 rounded font-mono text-sm font-bold transition-all duration-200 ${
              hasClaimableShares && !isClaiming
                ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg hover:shadow-green-500/25'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isClaiming ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Claiming...
              </div>
            ) : hasClaimableShares ? (
              'CLAIM NOW'
            ) : (
              'NO SHARES TO CLAIM'
            )}
          </button>

          {/* Information Panel */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
            <div className="text-xs text-blue-300 font-mono mb-2">CORRECT YIELD FLOW</div>
            <div className="text-xs text-gray-400 font-mono space-y-1">
              <p>• Principal stays in Lido (never touched)</p>
              <p>• Lido rewards flow to TurboVault (shared pool)</p>
              <p>• TurboVault restakes to EigenLayer for additional rewards</p>
              <p>• You claim your share of (Lido + EigenLayer) rewards</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimYield;
