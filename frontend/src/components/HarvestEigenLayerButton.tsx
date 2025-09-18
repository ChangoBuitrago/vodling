import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSafeVault } from '../hooks/useSafeVault';
import { useFadeIn } from '../hooks/useAnimations';
import { handleTransactionError } from '../utils/errorParser';

const HarvestEigenLayerButton: React.FC = () => {
  const { isConnected } = useAccount();
  const { 
    isEigenLayerHarvestLoading,
    isEigenLayerHarvestSuccess,
    eigenLayerHarvestTx,
    simulateEigenLayerHarvest,
    transactionError,
    clearTransactionError
  } = useSafeVault();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const fadeInRef = useFadeIn(0.4);

  const handleHarvestEigenLayer = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setError('');
      clearTransactionError();
      
      console.log('🌾 Starting EigenLayer harvest simulation...');
      await simulateEigenLayerHarvest();
      
    } catch (err: any) {
      const parsedError = handleTransactionError(err, 'harvest');
      
      if (parsedError.isUserCancellation) {
        console.log('🚫 User cancelled EigenLayer harvest transaction - resetting form');
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
    if (isEigenLayerHarvestSuccess) {
      setError('');
      setShowSuccess(true);
      
      // Return to normal state after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isEigenLayerHarvestSuccess]);

  // Clear form when loading state changes
  React.useEffect(() => {
    if (!isEigenLayerHarvestLoading && error) {
      setError('');
    }
  }, [isEigenLayerHarvestLoading, error]);

  if (!isConnected) {
    return null;
  }

  // Show success message briefly after successful harvest
  if (isEigenLayerHarvestSuccess && showSuccess) {
    return (
      <div className="glass-effect p-8 text-center fade-in">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 bg-gradient-to-r from-indigo-500 to-indigo-600">
          <i className="fas fa-check text-2xl text-white"></i>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">
          EigenLayer Harvest Successful!
        </h3>
        <p className="text-gray-400 mb-6">
          EigenLayer rewards have been successfully harvested from TurboVault and are now available in your account.
        </p>
        
        {/* Transaction Details with Block Explorer Link */}
        {eigenLayerHarvestTx && (
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-gray-500 font-mono break-all mb-3">
                Simulation Hash: {eigenLayerHarvestTx}
              </p>
              <p className="text-xs text-gray-400">
                This is a simulation for testing purposes
              </p>
            </div>
          </div>
        )}
        
        <p className="text-sm text-gray-400 mt-6">
          Your EigenLayer rewards are now part of your total yield balance...
        </p>
      </div>
    );
  }

  return (
    <div ref={fadeInRef} className="glass-effect p-6">
      <div className="flex items-center mb-6">
        <div className="strategy-icon icon-bg-indigo">
          <i className="fas fa-layer-group icon-text-indigo text-xl"></i>
        </div>
        <h3 className="text-xl font-bold text-white ml-4">Harvest EigenLayer Rewards</h3>
      </div>

      <div className="space-y-6">
        {/* Step 1: Description */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">1. Harvest EigenLayer Yield</h4>
          <p className="helper-text text-gray-400 text-sm mb-4">
            Withdraw accumulated EigenLayer rewards from TurboVault back to your individual account.
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
            onClick={handleHarvestEigenLayer}
            disabled={isEigenLayerHarvestLoading}
            className="w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isEigenLayerHarvestLoading 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(79, 70, 229, 0.9))',
              border: `1px solid ${isEigenLayerHarvestLoading ? 'rgba(255,255,255,0.1)' : 'rgba(99, 102, 241, 0.3)'}`,
              boxShadow: 'none',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
            }}
          >
            {isEigenLayerHarvestLoading ? (
              <span className="flex items-center justify-center">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Simulating EigenLayer Harvest...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <i className="fas fa-layer-group mr-2"></i>
                Simulate EigenLayer Harvest → TurboVault
              </span>
            )}
          </button>
        </div>

        {/* Information */}
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <div className="flex items-start space-x-3">
            <i className="fas fa-info-circle text-indigo-400 mt-1"></i>
            <div className="text-sm text-indigo-300">
              <p className="font-medium mb-2">What happens when you simulate EigenLayer harvest:</p>
              <ul className="space-y-1 text-indigo-200">
                <li>• Simulates EigenLayer rewards being added to TurboVault</li>
                <li>• This is a simulation for testing and flow control</li>
                <li>• Your total yield balance will reflect the simulated rewards</li>
                <li>• This helps test the complete yield flow</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HarvestEigenLayerButton;
