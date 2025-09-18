import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { useFadeIn } from '../hooks/useAnimations';
import { handleTransactionError } from '../utils/errorParser';

const HarvestButton: React.FC = () => {
  const { isConnected } = useAccount();
  const { 
    isHarvestLoading,
    isHarvestWriting,
    isHarvestConfirming,
    isHarvestSuccess,
    harvestTx,
    harvestYield,
    transactionError,
    clearTransactionError
  } = useSafeVault();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const fadeInRef = useFadeIn(0.4);

  const handleHarvest = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setError('');
      clearTransactionError();
      
      console.log('🌾 Starting harvest process...');
      await harvestYield();
      
    } catch (err: any) {
      const parsedError = handleTransactionError(err, 'harvest');
      
      if (parsedError.isUserCancellation) {
        console.log('🚫 User cancelled harvest transaction - resetting form');
        setError('');
        return;
      }
      
      if (parsedError.shouldShowError) {
        setError(parsedError.message);
      }
    }
  };

  // Handle success state
  React.useEffect(() => {
    if (isHarvestSuccess) {
      setError('');
      setShowSuccess(true);
      
      // Return to normal state after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isHarvestSuccess]);

  // Clear form when loading state changes
  React.useEffect(() => {
    if (!isHarvestLoading && error) {
      setError('');
    }
  }, [isHarvestLoading, error]);

  if (!isConnected) {
    return null;
  }

  // Show success message briefly after successful harvest
  if (isHarvestSuccess && showSuccess) {
    return (
      <div className="glass-effect p-8 text-center fade-in">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 bg-gradient-to-r from-green-500 to-green-600">
          <i className="fas fa-check text-2xl text-white"></i>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">
          Harvest Successful!
        </h3>
        <p className="text-gray-400 mb-6">
          LIDO yield has been successfully harvested and moved to TurboVault for EigenLayer restaking.
        </p>
        
        {/* Transaction Details with Block Explorer Link */}
        {harvestTx && (
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-gray-500 font-mono break-all mb-3">
                Transaction Hash: {harvestTx}
              </p>
              <a 
                href={`https://etherscan.io/tx/${harvestTx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="etherscan-link inline-flex items-center space-x-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                <i className="fas fa-external-link-alt"></i>
                <span>View on Etherscan</span>
              </a>
            </div>
          </div>
        )}
        
        <p className="text-sm text-gray-400 mt-6">
          Your yield will be restaked into EigenLayer automatically...
        </p>
      </div>
    );
  }

  return (
    <div ref={fadeInRef} className="glass-effect p-6">
      <div className="flex items-center mb-6">
        <div className="strategy-icon icon-bg-green">
          <i className="fas fa-seedling icon-text-green text-xl"></i>
        </div>
        <h3 className="text-xl font-bold text-white ml-4">Harvest EigenLayer Rewards</h3>
      </div>

      <div className="space-y-6">
        {/* Step 1: Description */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">1. Harvest LIDO Yield</h4>
          <p className="helper-text text-gray-400 text-sm mb-4">
            Move accumulated LIDO staking rewards from SafeVault to TurboVault for EigenLayer restaking.
          </p>
        </div>

        {/* Error Display */}
        {(error || transactionError) && (
          <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <i className="fas fa-exclamation-triangle text-red-400 mr-3"></i>
            <p className="text-sm text-red-400">{error || transactionError}</p>
          </div>
        )}

        {/* Step 2: Harvest Button */}
        <div>
          <button
            onClick={handleHarvest}
            disabled={isHarvestLoading}
            className="w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isHarvestLoading 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(22, 163, 74, 0.9))',
              border: `1px solid ${isHarvestLoading ? 'rgba(255,255,255,0.1)' : 'rgba(34, 197, 94, 0.3)'}`,
              boxShadow: 'none',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
            }}
          >
            {isHarvestLoading ? (
              <span className="flex items-center justify-center">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                {isHarvestWriting ? 'Submitting...' : isHarvestConfirming ? 'Confirming...' : 'Processing...'}
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <i className="fas fa-seedling mr-2"></i>
                Harvest EigenLayer Rewards → TurboVault
              </span>
            )}
          </button>
        </div>

        {/* Information */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-start space-x-3">
            <i className="fas fa-info-circle text-blue-400 mt-1"></i>
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-2">What happens when you harvest:</p>
              <ul className="space-y-1 text-blue-200">
                <li>• LIDO staking rewards are moved from SafeVault to TurboVault</li>
                <li>• TurboVault automatically restakes the rewards into EigenLayer</li>
                <li>• Your yield will continue growing through both LIDO and EigenLayer strategies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HarvestButton;
