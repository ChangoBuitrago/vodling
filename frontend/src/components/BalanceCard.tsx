import React from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { formatEther } from 'ethers';
import { useFadeIn, useStaggerChildren } from '../hooks/useAnimations';

const BalanceCard: React.FC = () => {
  const { isConnected } = useAccount();
  const { 
    principalBalance, 
    yieldBalance, 
    totalBalance, 
    isLoading
  } = useSafeVault();
  
  const fadeInRef = useFadeIn(0.2);
  const staggerRef = useStaggerChildren(0.4);
  
  // Debug logging
  React.useEffect(() => {
    console.log('BalanceCard - Principal Balance:', principalBalance);
    console.log('BalanceCard - Yield Balance:', yieldBalance);
    console.log('BalanceCard - Total Balance:', totalBalance);
    console.log('BalanceCard - Is Loading:', isLoading);
  }, [principalBalance, yieldBalance, totalBalance, isLoading]);

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

  if (isLoading) {
    return (
      <div className="glass-effect p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
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
      </h3>
      
      <div ref={staggerRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Principal Balance */}
        <div className="strategy-card glass-effect p-6">
          <div className="strategy-icon icon-bg-blue mx-auto mb-4">
            <i className="fas fa-coins icon-text-blue text-2xl"></i>
          </div>
          <p className="text-lg font-medium text-gray-400 mb-2">Principal Balance</p>
          <p className="text-3xl font-bold text-gradient-blue">
            {parseFloat(formatEther(principalBalance as bigint)).toFixed(6)} ETH
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
          <p className="text-3xl font-bold text-gradient-vodl">
            {parseFloat(formatEther(totalBalance as bigint)).toFixed(6)} ETH
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Principal + Yield Combined
          </p>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
