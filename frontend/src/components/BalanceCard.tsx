import React from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { useWeb3Context } from '../contexts/Web3Context';
import { formatEther } from 'ethers';
import { useFadeIn, useStaggerChildren } from '../hooks/useAnimations';

const BalanceCard: React.FC = () => {
  const { isConnected } = useAccount();
  const { 
    isLoading,
    isWithdrawTotalLoading,
    isRefreshing
  } = useSafeVault();
  
  // Get balance state from Web3Context for immediate updates
  const { balanceState } = useWeb3Context();
  
  const fadeInRef = useFadeIn(0.2);
  const staggerRef = useStaggerChildren(0.4);
  

  if (!isConnected) {
    return (
      <div className="glass-effect p-8 text-center fade-in">
        <div className="strategy-icon icon-bg-indigo mx-auto">
          <i className="fas fa-wallet icon-text-indigo text-2xl"></i>
        </div>
        <h3 className="text-xl font-bold mb-3 text-white">Connect Your Wallet</h3>
        <p className="text-gray-400">Connect your wallet to view your Vodling balances and start earning yield on your ETH.</p>
      </div>
    );
  }

  if (isLoading || balanceState.isLoading) {
    return (
      <div className="glass-effect p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="loading-skeleton rounded-xl p-6 h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={fadeInRef} className="glass-effect p-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
        <i className="fas fa-chart-line text-gradient-vodl mr-3"></i>
        Your Vodling Portfolio
        {(isWithdrawTotalLoading || isRefreshing) && (
          <span className="ml-2 text-sm text-gray-400 flex items-center">
            <i className="fas fa-sync-alt animate-spin mr-1"></i>
            Updating...
          </span>
        )}
      </h3>
      
      <div ref={staggerRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Principal Balance */}
        <div className="strategy-card glass-effect p-6">
          <div className="strategy-icon icon-bg-blue mx-auto mb-4">
            <i className="fas fa-coins icon-text-blue text-2xl"></i>
          </div>
          <p className="text-lg font-medium text-gray-400 mb-2">Principal Balance</p>
          <p className="text-3xl font-bold text-gradient-blue">
            {parseFloat(formatEther(balanceState.principalBalance)).toFixed(4)} ETH
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Your Original Deposit
          </p>
        </div>

        {/* Total Balance */}
        <div className="strategy-card glass-effect p-6">
          <div className="strategy-icon icon-bg-vodl mx-auto mb-4">
            <i className="fas fa-chart-line icon-text-vodl text-2xl"></i>
          </div>
          <p className="text-lg font-medium text-gray-400 mb-2">Total Balance</p>
          <p className="text-3xl font-bold text-gradient-vodl mb-2">
            {parseFloat(formatEther(balanceState.totalBalance)).toFixed(4)} ETH
          </p>
          
          {/* Yield only */}
          <div className="text-sm text-gray-400">
            <span className="text-green-400 font-medium">+{parseFloat(formatEther(balanceState.yieldBalance)).toFixed(3)} ETH yield</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Principal + Earned Yield
          </p>
        </div>

        {/* APY Panel */}
        <div className="strategy-card glass-effect p-6">
          <div className="strategy-icon icon-bg-purple mx-auto mb-4">
            <i className="fas fa-percentage icon-text-purple text-2xl"></i>
          </div>
          <p className="text-lg font-medium text-gray-400 mb-2">Current APY</p>
          <p className="text-3xl font-bold text-gradient-purple mb-2">
            {(() => {
              if (balanceState.principalBalance === 0n) return "0.00%";
              const principal = parseFloat(formatEther(balanceState.principalBalance));
              const yieldAmount = parseFloat(formatEther(balanceState.yieldBalance));
              if (principal === 0) return "0.00%";
              
              // Simple APY calculation (this is a rough estimate)
              // In a real implementation, you'd want to track time and calculate proper APY
              const apy = (yieldAmount / principal) * 100;
              return `${apy.toFixed(2)}%`;
            })()}
          </p>
          <div className="text-sm text-gray-500">
            <span className="text-purple-400">Live yield rate</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Annual Percentage Yield
          </p>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
