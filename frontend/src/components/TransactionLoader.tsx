import React from 'react';

interface TransactionLoaderProps {
  isWriting: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error?: string;
  transactionHash?: string;
  type: 'deposit' | 'withdrawPrincipal' | 'withdrawYield';
}

const TransactionLoader: React.FC<TransactionLoaderProps> = ({
  isWriting,
  isConfirming,
  isSuccess,
  error,
  transactionHash,
  type,
}) => {
  const getStepText = () => {
    if (error) return 'Transaction Failed';
    if (isSuccess) return 'Transaction Confirmed';
    if (isConfirming) return 'Confirming Transaction';
    if (isWriting) return 'Preparing Transaction';
    return 'Ready';
  };

  const getStepIcon = () => {
    if (error) return <i className="fas fa-exclamation-triangle text-red-400 text-xl"></i>;
    if (isSuccess) return <i className="fas fa-check-circle text-vodl-400 text-xl"></i>;
    if (isConfirming || isWriting) return <i className="fas fa-spinner text-indigo-400 text-xl animate-spin"></i>;
    return <i className="fas fa-clock text-gray-400 text-xl"></i>;
  };

  const getActionText = () => {
    switch (type) {
      case 'deposit':
        return 'Depositing ETH';
      case 'withdrawPrincipal':
        return 'Withdrawing Principal';
      case 'withdrawYield':
        return 'Withdrawing Yield';
      default:
        return 'Processing Transaction';
    }
  };

  const getStepDescription = () => {
    if (error) return error;
    if (isSuccess) return 'Your transaction has been successfully confirmed on the blockchain.';
    if (isConfirming) return 'Waiting for blockchain confirmation. This may take a few moments.';
    if (isWriting) return 'Please confirm the transaction in your wallet.';
    return 'Ready to process your transaction.';
  };

  return (
    <div className="glass-effect p-6 mb-6 fade-in">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {getStepIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white">
            {getActionText()}
          </h3>
          <p className="text-sm text-gray-300 mt-1">
            {getStepText()}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {getStepDescription()}
          </p>
          {transactionHash && (
            <div className="mt-3">
              <p className="text-xs text-gray-400">Transaction Hash:</p>
              <p className="text-xs font-mono text-indigo-400 break-all bg-white/5 p-2 rounded-lg">
                {transactionHash}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="mt-6">
        <div className="flex items-center space-x-4">
          {/* Step 1: Writing */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isWriting || isConfirming || isSuccess ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-400'
            }`}>
              {isWriting ? (
                <i className="fas fa-spinner animate-spin text-sm"></i>
              ) : (
                <span className="text-sm font-medium">1</span>
              )}
            </div>
            <span className="ml-2 text-sm text-gray-300">Prepare</span>
          </div>
          
          {/* Arrow */}
          <div className={`w-8 h-0.5 ${isConfirming || isSuccess ? 'bg-indigo-600' : 'bg-white/10'}`} />
          
          {/* Step 2: Confirming */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isConfirming || isSuccess ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-400'
            }`}>
              {isConfirming ? (
                <i className="fas fa-spinner animate-spin text-sm"></i>
              ) : isSuccess ? (
                <i className="fas fa-check text-sm"></i>
              ) : (
                <span className="text-sm font-medium">2</span>
              )}
            </div>
            <span className="ml-2 text-sm text-gray-300">Confirm</span>
          </div>
          
          {/* Arrow */}
          <div className={`w-8 h-0.5 ${isSuccess ? 'bg-vodl-600' : 'bg-white/10'}`} />
          
          {/* Step 3: Complete */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isSuccess ? 'bg-vodl-600 text-white' : 'bg-white/10 text-gray-400'
            }`}>
              {isSuccess ? (
                <i className="fas fa-check text-sm"></i>
              ) : (
                <span className="text-sm font-medium">3</span>
              )}
            </div>
            <span className="ml-2 text-sm text-gray-300">Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionLoader;
