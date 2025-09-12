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
    isWithdrawTotalLoading
  } = useSafeVault();
  
  // Get balance state from Web3Context for immediate updates
  const { balanceState, refreshBalance, isRefreshing } = useWeb3Context();
  
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
      <div className="flex items-center mb-6">
        <div className="strategy-icon icon-bg-vodl">
          <i className="fas fa-chart-line icon-text-vodl text-xl"></i>
        </div>
        <h3 className="text-xl font-bold text-white ml-4 flex items-center">
          Your Portfolio
          {(isWithdrawTotalLoading || isRefreshing) && (
            <span className="ml-2 text-sm text-gray-400 flex items-center">
              <i className="fas fa-sync-alt animate-spin mr-1"></i>
              Updating...
            </span>
          )}
        </h3>
        <button
          onClick={refreshBalance}
          disabled={isRefreshing}
          className="ml-auto p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh balances"
        >
          <i className={`fas fa-sync-alt ${isRefreshing ? 'animate-spin' : ''}`}></i>
        </button>
      </div>
      
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
            Your Original Safe Deposit
          </p>
        </div>

        {/* Yield Only */}
        <div className="strategy-card glass-effect p-6">
          <div className="strategy-icon icon-bg-green mx-auto mb-4">
            <i className="fas fa-seedling icon-text-green text-2xl"></i>
          </div>
          <p className="text-lg font-medium text-gray-400 mb-2">Yield Earned</p>
          <p className="text-3xl font-bold text-gradient-green">
            {parseFloat(formatEther(balanceState.yieldBalance)).toFixed(4)} ETH
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Earned from Vodling
          </p>
        </div>

        {/* Total Balance + APY Combined */}
        <div className="strategy-card glass-effect p-6">
          <div className="strategy-icon icon-bg-vodl mx-auto mb-4">
            <i className="fas fa-chart-line icon-text-vodl text-2xl"></i>
          </div>
          <p className="text-lg font-medium text-gray-400 mb-2">Total Balance</p>
          <p className="text-3xl font-bold text-gradient-vodl mb-2">
            {parseFloat(formatEther(balanceState.totalBalance)).toFixed(4)} ETH
          </p>
          
          {/* APY Section */}
          <div className="border-t border-white/10 pt-3 mt-3">
            <p className="text-sm font-medium text-gray-400 mb-1">Current APY</p>
            <p className="text-xl font-bold text-gradient-purple">
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
            <p className="text-xs text-gray-500 mt-1">
              Annual Percentage Yield
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
