import React from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { formatEther } from 'ethers';
import { useFadeIn, useStaggerChildren, useHoverAnimation } from '../hooks/useAnimations';

interface BalanceItemProps {
  icon: string;
  iconBg: string;
  iconText: string;
  label: string;
  value: string;
  valueClass: string;
}

const BalanceItem: React.FC<BalanceItemProps> = ({ icon, iconBg, iconText, label, value, valueClass }) => {
  const hoverRef = useHoverAnimation();
  
  return (
    <div ref={hoverRef} className="strategy-card glass-effect p-4">
      <div className="flex items-center">
        <div className={`strategy-icon ${iconBg}`}>
          <i className={`${icon} ${iconText} text-xl`}></i>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className={`text-2xl font-bold stat-value ${valueClass}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

const BalanceCard: React.FC = () => {
  const { isConnected } = useAccount();
  const { 
    principalBalance, 
    yieldBalance, 
    totalBalance, 
    isLoading,
    refetchAllData
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="loading-skeleton rounded-xl p-4 h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={fadeInRef} className="glass-effect p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <i className="fas fa-chart-line text-gradient-vodl mr-3"></i>
          Your Vodling Portfolio
        </h3>
        <button
          onClick={refetchAllData}
          className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-gray-300 flex items-center"
          title="Refresh balances"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Refresh
        </button>
      </div>
      
      <div ref={staggerRef} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Principal Balance */}
        <BalanceItem
          icon="fas fa-shield-alt"
          iconBg="icon-bg-indigo"
          iconText="icon-text-indigo"
          label="Principal"
          value={`${parseFloat(formatEther(principalBalance as bigint)).toFixed(4)} ETH`}
          valueClass="text-white"
        />

        {/* Yield Balance */}
        <BalanceItem
          icon="fas fa-chart-line"
          iconBg="icon-bg-green"
          iconText="icon-text-green"
          label="Yield Earned"
          value={`${parseFloat(formatEther(yieldBalance as bigint)).toFixed(6)} ETH`}
          valueClass="text-gradient-green"
        />

        {/* Total Balance */}
        <BalanceItem
          icon="fas fa-wallet"
          iconBg="icon-bg-purple"
          iconText="icon-text-purple"
          label="Total Value"
          value={`${parseFloat(formatEther(totalBalance as bigint)).toFixed(4)} ETH`}
          valueClass="text-gradient-purple"
        />
      </div>
    </div>
  );
};

export default BalanceCard;
